import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import queueRoutes from './routes/queue.routes';
import tokenRoutes from './routes/token.routes';
import analyticsRoutes from './routes/analytics.routes';
import { generalApiLimiter } from './middleware/rateLimiter';

dotenv.config();

process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err);
});

const app = express();
const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === 'production';

// Trust reverse proxy hops (required for Railway, Render, Cloudflare, etc.)
app.set('trust proxy', 1);

// Disable X-Powered-By header to obscure tech stack
app.disable('x-powered-by');

// 1. HTTP Security Headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: isProd ? undefined : false, // In development, don't restrict local assets
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: isProd
      ? {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true
        }
      : false,
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xFrameOptions: { action: 'sameorigin' }
  })
);

// 2. Strict CORS Configuration
const clientUrls = (process.env.CLIENT_URL || '')
  .split(',')
  .map((url) => url.trim().replace(/\/$/, ''))
  .filter(Boolean);

const allowedOrigins = [
  ...clientUrls,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., server-to-server, curl, mobile apps)
      if (!origin) return callback(null, true);

      // In development, permit localhost / 127.0.0.1 origins
      if (!isProd && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.replace(/\/$/, '');
      if (allowedOrigins.includes(normalizedOrigin) || normalizedOrigin.endsWith('.vercel.app')) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// 3. Strict Payload Size Limits (mitigates memory exhaustion and payload stuffing attacks)
app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: true, limit: '20kb' }));

// 4. Rate Limiting on all API endpoints
app.use('/api', generalApiLimiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Queue Management API',
    security: 'Hardened per backend-security-coder specifications'
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/queues', queueRoutes);
app.use('/api', tokenRoutes);
app.use('/api/analytics', analyticsRoutes);

// Catch-all 404
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// 5. Global Error Handler (Prevents sensitive internal information leakage)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const status = err.status || 500;
  console.error(`[API Error ${status}] ${req.method} ${req.originalUrl}:`, err.message || err);

  // In production, do not leak internal database errors or stack traces
  const safeMessage = isProd && status === 500
    ? 'An unexpected internal error occurred'
    : err.message || 'Internal Server Error';

  res.status(status).json({
    error: safeMessage,
    code: err.code || 'INTERNAL_ERROR'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Queue Management API server running on http://localhost:${PORT}`);
});

export default app;
