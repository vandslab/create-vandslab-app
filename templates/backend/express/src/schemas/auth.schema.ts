import { z } from 'zod';

/**
 * Zod schema for user registration
 * Validates email format, password strength, and optional name
 */
export const registerSchema = z.object({
	body: z.object({
		email: z
			.string({
				message: 'Email is required',
			})
			.email('Invalid email format'),
		password: z
			.string({
				message: 'Password is required',
			})
			.min(8, 'Password must be at least 8 characters long')
			.regex(
				/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
				'Password must contain at least one uppercase letter, one lowercase letter, and one number'
			),
		name: z.string().optional(),
	}),
});

/**
 * Zod schema for user login
 * Validates email format and password presence
 */
export const loginSchema = z.object({
	body: z.object({
		email: z
			.string({
				message: 'Email is required',
			})
			.email('Invalid email format'),
		password: z.string({
			message: 'Password is required',
		}),
	}),
});

// Type exports for TypeScript
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
