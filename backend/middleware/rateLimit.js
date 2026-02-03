/**
 * Rate limiting middleware (OWASP: prevent brute force & DoS).
 * IP-based limits with graceful 429 responses and Retry-After header.
 * All keys/limits are configurable via environment variables.
 */

import rateLimit from 'express-rate-limit';

// --- Configuration (env overrides for deployment) ---
const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000; // 15 min
const MAX_GENERAL = Number(process.env.RATE_LIMIT_MAX_GENERAL) || 200;        // general GETs/static
const MAX_POST = Number(process.env.RATE_LIMIT_MAX_POST) || 50;                // form submits, AI, etc.
const MAX_AI = Number(process.env.RATE_LIMIT_MAX_AI) || 20;                    // AI/expensive endpoints

/**
 * Standard 429 handler: JSON + Retry-After, no stack traces.
 */
function handleLimitReached(req, res) {
    const retryAfter = Math.ceil(WINDOW_MS / 1000);
    res.set('Retry-After', String(retryAfter));
    res.status(429).json({
        error: 'Too many requests',
        message: 'Please slow down and try again later.',
        retryAfterSeconds: retryAfter
    });
}

/**
 * General rate limit for GETs and light endpoints (IP-based).
 */
export const generalLimiter = rateLimit({
    windowMs: WINDOW_MS,
    max: MAX_GENERAL,
    message: { error: 'Too many requests', message: 'Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    handler: handleLimitReached
});

/**
 * Stricter limit for POST endpoints (forms, mutations).
 */
export const postLimiter = rateLimit({
    windowMs: WINDOW_MS,
    max: MAX_POST,
    message: { error: 'Too many requests', message: 'Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    handler: handleLimitReached
});

/**
 * Stricter limit for AI/expensive endpoints (e.g. /ask-berry, /api/ai/*).
 */
export const aiLimiter = rateLimit({
    windowMs: WINDOW_MS,
    max: MAX_AI,
    message: { error: 'Too many requests', message: 'AI is rate limited. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    handler: handleLimitReached
});
