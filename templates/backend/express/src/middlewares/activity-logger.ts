import type { Request, Response, NextFunction } from "express";
import prisma from "@utils/prisma-client";
import { logger } from "./console-logger";
import type { ActivityLogData } from "@interfaces/activity-log.interface";

/**
 * Activity Logger Middleware
 * Logs user activities to the database for audit trail
 * Uses fire-and-forget pattern (async, non-blocking)
 */

/**
 * Async function to log activity to database
 * Fire-and-forget: doesn't block the response
 */
async function writeActivityLog(
	data: ActivityLogData,
	ipAddress?: string,
	userAgent?: string
): Promise<void> {
	try {
		await prisma.activityLog.create({
			data: {
				userId: data.userId,
				action: data.action,
				resource: data.resource,
				resourceId: data.resourceId,
				ipAddress: ipAddress,
				userAgent: userAgent,
				metadata: data.metadata,
			},
		});
	} catch (error) {
		// Log error but don't fail the request
		logger.error(
			{ error, activityData: data },
			"Failed to write activity log"
		);
	}
}

/**
 * Middleware factory for logging specific actions
 *
 * @param action - Action type (e.g., "CREATE", "UPDATE", "DELETE")
 * @param resource - Resource type (e.g., "User", "Post", "Campaign")
 * @param getResourceId - Optional function to extract resource ID from request
 * @param getMetadata - Optional function to extract metadata from request
 *
 * @example
 * // Basic usage
 * router.post('/user', logActivity('CREATE', 'User'), createUser);
 *
 * // With resource ID from params
 * router.put('/user/:id', logActivity('UPDATE', 'User', (req) => req.params.id), updateUser);
 *
 * // With metadata (request body)
 * router.delete('/post/:id',
 *   logActivity('DELETE', 'Post',
 *     (req) => req.params.id,
 *     (req) => ({ title: req.body.title })
 *   ),
 *   deletePost
 * );
 */
export const logActivity = (
	action: string,
	resource?: string,
	getResourceId?: (req: Request) => string | undefined,
	getMetadata?: (req: Request) => any
) => {
	return (req: Request, res: Response, next: NextFunction) => {
		// Extract data from request
		const userId = (req as any).user?.id; // Assumes auth middleware sets req.user
		const ipAddress = req.ip || req.socket.remoteAddress || undefined;
		const userAgent = req.get("user-agent") || undefined;
		const resourceId = getResourceId ? getResourceId(req) : undefined;
		const metadata = getMetadata ? getMetadata(req) : undefined;

		// Fire-and-forget: log asynchronously without blocking response
		writeActivityLog(
			{
				userId,
				action,
				resource,
				resourceId,
				metadata,
			},
			ipAddress,
			userAgent
		).catch((error) => {
			// Already logged in writeActivityLog, just prevent unhandled rejection
		});

		// Continue with request immediately
		next();
	};
};

/**
 * Create activity log entry from controllers/services
 * Use this when you need direct logging without middleware
 *
 * @example
 * await createActivityLog({
 *   userId: user.id,
 *   action: 'PASSWORD_RESET',
 *   resource: 'User',
 *   resourceId: user.id,
 *   metadata: { email: user.email }
 * });
 */
export async function createActivityLog(
	data: ActivityLogData
): Promise<void> {
	await writeActivityLog(data);
}
