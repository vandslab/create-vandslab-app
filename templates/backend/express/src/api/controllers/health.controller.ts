import type { Request, Response, NextFunction } from "express";
import prisma from "@utils/prisma-client";

/**
 * Health check controller
 * Returns the health status of the API and its dependencies
 */

export class HealthController {
	/**
	 * GET /api/health
	 * basic health check
	 */

	public async getHealth(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			res.status(200).json({
				success: true,
				message: "API is running",
				timestamp: new Date().toISOString(),
			});
		} catch (error) {
			next(error);
		}
	}

	/**
	 * GET /api/health/detailed
	 * Detailed health check with database status
	 */
	public async getDetailedHealth(
		req: Request,
		res: Response,
		next: NextFunction
	) {
		try {
			// Check database connection
			let dbStatus = "healthy";
			try {
				await prisma.$queryRaw`SELECT 1`;
			} catch (error) {
				dbStatus = "unhealthy";
			}

			const isHealthy = dbStatus === "healthy";

			res.status(isHealthy ? 200 : 503).json({
				success: isHealthy,
				message: isHealthy
					? "All systems operational"
					: "Some systems are down",
				timestamp: new Date().toISOString(),
				services: {
					api: "healthy",
					database: dbStatus,
				},
			});
		} catch (error) {
			next(error);
		}
	}
}
