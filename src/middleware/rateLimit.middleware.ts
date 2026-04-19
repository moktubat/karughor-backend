import rateLimit from 'express-rate-limit';

// General API limit — 100 requests per 15 min per IP
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: { message: 'Too many requests. Please try again later.', statusCode: 429 },
    },
});

// Strict limit for auth routes — 10 attempts per 15 min per IP
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: { message: 'Too many login attempts. Please try again in 15 minutes.', statusCode: 429 },
    },
});

// OTP/forgot password — 5 attempts per hour per IP
export const otpLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: { message: 'Too many OTP requests. Please try again in an hour.', statusCode: 429 },
    },
});