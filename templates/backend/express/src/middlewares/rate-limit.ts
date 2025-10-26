import rateLimit from "express-rate-limit";

/**
 * Strict rate limiter for authentication endpoints
 * Max 5 requests per 15 minutes per IP
 */
export const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 5, // Max 5 requests per 15 minutes
	message: "Too many login attempts, please try again after 15 minutes",
	standardHeaders: true,
	legacyHeaders: false,
	skipSuccessfulRequests: true, // Don't count successful auth
});

/**
 * API rate limiter for general API endpoints
 * Max 100 requests per minute per IP
 */
export const apiLimiter = rateLimit({
	windowMs: 60 * 1000, // 1 minute
	max: 100, // Max 100 requests per minute
	message: "Too many API requests, please slow down",
	standardHeaders: true,
	legacyHeaders: false,
});

/**
 * Strict rate limiter for sensitive operations
 * (campaigns, payments, sensitive data)
 * Max 30 requests per minute per IP
 */
export const strictLimiter = rateLimit({
	windowMs: 60 * 1000, // 1 minute
	max: 30, // Max 30 requests per minute
	message: "Rate limit exceeded for this operation",
	standardHeaders: true,
	legacyHeaders: false,
});
