import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@/config/jwt";
import prisma from "@utils/prisma-client";
import { Role } from "@prisma/client";
import {
	AuthError,
	InsufficientPermissionError,
	InvalidTokenError,
	NoTokenError,
	TokenExpiredError,
} from "@/exceptions/auth-error";

// Extend Express Request type to include user
declare global {
	namespace Express {
		interface Request {
			user?: {
				role: Role;
			};
		}
	}
}

/**
 * Middleware to authenticate JWT token
 * Verifies the token and attaches user to request
 */
export const authenticateToken = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		// Get token from Authorization header
		const authHeader = req.headers.authorization;
		const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN format

		if (!token) {
			throw new NoTokenError();
		}

		// Verify JWT token
		const decoded = jwt.verify(token, JWT_SECRET as string) as {
			userId: string;
		};

		// Find user in database
		const user = await prisma.user.findUnique({
			where: { id: decoded.userId },
			select: {
				id: true,
				role: true,
			},
		});

		if (!user) {
			throw new InvalidTokenError();
		}

		// Attach user to request
		req.user = user;

		next();
	} catch (error) {
		if (error instanceof jwt.TokenExpiredError) {
			return next(new TokenExpiredError());
		}
		if (error instanceof jwt.JsonWebTokenError) {
			return next(new InvalidTokenError());
		}
		// Pass through custom errors
		next(error);
	}
};

/**
 * Middleware to require ADMIN role
 */
export const requireAdmin = (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	if (!req.user) {
		throw new AuthError("Not authenticated", "NOT_AUTHENTICATED", 401);
	}

	if (req.user.role !== Role.ADMIN) {
		throw new InsufficientPermissionError("ADMIN");
	}

	next();
};

/**
 * Middleware to require any of the specified roles
 */
export const requireRole = (...roles: Role[]) => {
	return (req: Request, res: Response, next: NextFunction) => {
		if (!req.user) {
			throw new AuthError("Not authenticated", "NOT_AUTHENTICATED", 401);
		}

		if (!roles.includes(req.user.role)) {
			throw new InsufficientPermissionError(roles.join(" or "));
		}

		next();
	};
};

/**
 * Available auth middlewares:
 * - authenticateToken - Verify JWT and attach user to request
 * - requireAdmin - Check for ADMIN role
 * - requireRole(...roles) - Flexible role check (e.g. requireRole(Role.ADVERTISER, Role.PUBLISHER))
 */
