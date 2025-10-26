import type { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import { ValidationError } from "@/exceptions/validation-error";
import { logger } from "./console-logger";

declare global {
	namespace Express {
		interface Request {
			validatedData?: any;
		}
	}
}

/**
 * Zod validation middleware for Express
 * Validates request body, query, or params against a Zod schema
 * Stores validated data in req.validatedData for consistency
 *
 * @param schema - Zod schema to validate against
 * @param source - Which part of request to validate (body, query, params)
 * @returns Express middleware function
 *
 * @example
 * router.post('/login', validate(loginSchema, 'body'), authController.login);
 * router.get('/user/:id', validate(idParamsSchema, 'params'), userController.getUser);
 */

export const validate = (
	schema: z.ZodSchema,
	source: "body" | "query" | "params" = "body"
) => {
	return async (req: Request, res: Response, next: NextFunction) => {
		// logika
		try {
			const data = req[source];
			const validated = await schema.parseAsync(data);
			req.validatedData = validated;
			next();
		} catch (error) {
			// check if its a zod validation error
			if (error instanceof ZodError) {
				// Format error for consistent API response
				const errors = error.issues.map((err) => ({
					field: err.path.join("."),
					message: err.message,
					code: err.code,
				}));

				// log validation error
				logger.warn(
					{ source, errors, path: req.path, method: req.method },
					`Validation error: ${source}, validation failed`
				);

				// pass validation error to error handler
				next(new ValidationError(errors));
			} else {
				// not a zod error, forward it
				next(error);
			}
		}
	};
};
