import type { Request, Response, NextFunction } from "express";
import { BaseError } from "@/exceptions/base-error";
import { AuthError } from "@/exceptions/auth-error";
import { ValidationError } from "@/exceptions/validation-error";
import { logger } from "./console-logger";

/**
 * Global error handler middleware
 * This should be the LAST middleware in the chain
 */

export const errorHandler = (
	err: Error,
	req: Request,
	res: Response,
	next: NextFunction
) => {
	logger.error(
		{
			message: err.message,
			stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
			path: req.path,
			method: req.method,
		},
		"Error caught by error handler"
	);

	// Handle Validation errors
	if (err instanceof ValidationError) {
		return res.status(err.statusCode).json({
			success: false,
			message: err.message,
			errors: err.errors,
		});
	}

	// Handle Auth errors
	if (err instanceof AuthError) {
		return res.status(err.statusCode).json({
			success: false,
			message: err.message,
			code: err.code,
			...(err.details && { details: err.details }),
		});
	}

	// Handle Base operational errors
	if (err instanceof BaseError && err.isOperational) {
		return res.status(err.statusCode).json({
			success: false,
			message: err.message,
		});
	}

	// Handle unknown/programmer errors (non-operational)
	// In production, don't leak error details
	const statusCode = 500;
	const message =
		process.env.NODE_ENV === "production"
			? "Internal server error"
			: err.message;

	return res.status(statusCode).json({
		success: false,
		message,
		...(process.env.NODE_ENV === "development" && {
			stack: err.stack,
		}),
	});
};
