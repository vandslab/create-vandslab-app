import {
	AuthError,
	InsufficientPermissionError,
	InvalidCredentialsError,
	InvalidTokenError,
	NoTokenError,
	TokenExpiredError,
} from './auth-error';
import { BaseError } from './base-error';

describe('AuthError', () => {
	it('defaults to 401 and stays operational', () => {
		const error = new AuthError('nope');
		expect(error).toBeInstanceOf(BaseError);
		expect(error.statusCode).toBe(401);
		expect(error.isOperational).toBe(true);
	});

	it('keeps the code and details it was given', () => {
		const error = new AuthError('nope', 'SOME_CODE', 418, { why: 'teapot' });
		expect(error.code).toBe('SOME_CODE');
		expect(error.statusCode).toBe(418);
		expect(error.details).toEqual({ why: 'teapot' });
	});
});

describe('auth error subclasses', () => {
	it.each([
		[new TokenExpiredError(), 'TOKEN_EXPIRED', 401],
		[new InvalidCredentialsError(), 'INVALID_CREDENTIALS', 401],
		[new InvalidTokenError(), 'INVALID_TOKEN', 401],
		[new NoTokenError(), 'NO_TOKEN', 401],
		[new InsufficientPermissionError('ADMIN'), 'INSUFFICIENT_PERMISSIONS', 403],
	])('%s carries its code and status', (error, code, statusCode) => {
		expect(error.code).toBe(code);
		expect(error.statusCode).toBe(statusCode);
	});

	it('reports which role was required', () => {
		expect(new InsufficientPermissionError('ADMIN').details).toEqual({ requiredRole: 'ADMIN' });
	});

	it('never leaks the password in the message', () => {
		expect(new InvalidCredentialsError().message).toBe('Invalid email or password');
	});
});
