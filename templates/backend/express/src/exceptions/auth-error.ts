import { BaseError } from "./base-error";

export class AuthError extends BaseError {
	public code?: string;
	public details?: any;

	constructor(message: string, code?: string, statusCode = 401, details?: any) {
		super(message, statusCode);
		this.code = code;
		this.details = details;
	}
}

export class TokenExpiredError extends AuthError {
	constructor() {
		super("Token Expired", "TOKEN_EXPIRED", 401);
	}
}

export class InvalidCredentialsError extends AuthError {
	constructor() {
		super("Invalid email or password", "INVALID_CREDENTIALS", 401);
	}
}

export class InvalidTokenError extends AuthError {
	constructor() {
		super("Invalid token", "INVALID_TOKEN", 401);
	}
}

export class NoTokenError extends AuthError {
	constructor() {
		super("No authentication token provided", "NO_TOKEN", 401);
	}
}

export class InsufficientPermissionError extends AuthError {
	constructor(requiredRole?: string) {
		super(
			"Insufficient permissions to access this content",
			"INSUFFICIENT_PERMISSIONS",
			403,
			{ requiredRole }
		);
	}
}
