import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../prisma';
import { AuthRequest, JWT_SECRET, requireAuth } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import { sanitizedString } from '../utils/sanitize';

const router = Router();

const registerSchema = z.object({
  name: sanitizedString(2, 100),
  email: z.string().trim().email('Valid email is required').max(255).toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128, 'Password exceeds maximum length limit')
});

const loginSchema = z.object({
  email: z.string().trim().email('Valid email is required').max(255).toLowerCase(),
  password: z.string().min(1, 'Password is required').max(128, 'Password exceeds maximum length limit')
});

// Register endpoint with rate limiter
router.post('/register', authLimiter, async (req, res): Promise<void> => {
  try {
    const validated = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email }
    });

    if (existingUser) {
      res.status(409).json({ error: 'An account with this email already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(validated.password, 10);

    const user = await prisma.user.create({
      data: {
        name: validated.name,
        email: validated.email,
        password: hashedPassword,
        role: 'MANAGER'
      }
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { algorithm: 'HS256', expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues[0]?.message || 'Invalid input data' });
      return;
    }
    console.error('[SECURITY ERROR] Registration failure:', error?.message || error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Pre-computed dummy bcrypt hash to equalize execution time and prevent user enumeration via timing attacks
const DUMMY_HASH = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

// Login endpoint with rate limiter & brute force protection
router.post('/login', authLimiter, async (req, res): Promise<void> => {
  try {
    const validated = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: validated.email }
    });

    if (!user) {
      // Execute dummy comparison to equalize timing profile with existing users
      await bcrypt.compare(validated.password, DUMMY_HASH);
      console.warn(`[SECURITY] Failed login attempt for non-existent email: ${validated.email} from IP: ${req.ip}`);
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isMatch = await bcrypt.compare(validated.password, user.password);
    if (!isMatch) {
      console.warn(`[SECURITY] Failed password attempt for user: ${validated.email} from IP: ${req.ip}`);
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { algorithm: 'HS256', expiresIn: '7d' }
    );

    res.json({
      message: 'Logged in successfully',
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues[0]?.message || 'Invalid credentials' });
      return;
    }
    console.error('[SECURITY ERROR] Login failure:', error?.message || error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Current user profile
router.get('/me', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, email: true, name: true, role: true, createdAt: true }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve profile' });
  }
});

export default router;
