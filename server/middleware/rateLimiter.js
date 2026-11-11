import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for authentication attempts (20 requests per 15 minutes).
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for AI draft generation and rewrites (60 requests per 15 minutes).
 * Allows adequate headroom for staff while protecting against AI API quota exhaustion.
 */
export const aiDraftLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: { message: 'AI generation limit reached. Please wait a few minutes before requesting more drafts.' },
  standardHeaders: true,
  legacyHeaders: false,
});
