import rateLimit from 'express-rate-limit';

// Standard error payload for rate-limited requests
const rateLimitHandler = (req: any, res: any) => {
  res.status(429).json({
    error: 'Too many requests. Please slow down and try again shortly.',
    code: 'RATE_LIMIT_EXCEEDED'
  });
};

/**
 * General API rate limiter
 * Allows up to 300 requests per 15-minute window per IP.
 */
export const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler
});

/**
 * Strict rate limiter for Authentication endpoints (login, register)
 * Mitigates credential stuffing, password guessing, and brute-force attacks.
 * Allows up to 15 attempts per 15-minute window per IP.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`[SECURITY] Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many authentication attempts. Please wait 15 minutes before trying again.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED'
    });
  }
});

/**
 * Rate limiter for token creation (joining queues)
 * Prevents automated denial-of-service / queue inflation spam.
 * Allows up to 60 token creations per 15 minutes per IP.
 */
export const tokenCreationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`[SECURITY] Token creation limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many tokens created in a short period. Please try again later.',
      code: 'TOKEN_LIMIT_EXCEEDED'
    });
  }
});

