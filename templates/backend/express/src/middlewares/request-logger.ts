import type { Request, Response, NextFunction } from "express";
import { logger } from "./console-logger";

export const requestLogger = (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const clientIp: string = req.ip || req.socket.remoteAddress || "unknown IP";
	const method: string = req.method;
	const url: string = req.originalUrl || req.url || "unknown URL";

	//Log immediately when request arrives
	logger.info(`Incoming ${method} Request ${url} :: IP ${clientIp}`);

	const start: number = Date.now();

	// Log when response finishes
	res.on("finish", () => {
		const duration: number = Date.now() - start;
		const logData = {
			method,
			url,
			status: res.statusCode,
			duration: `${duration}ms`,
			ip: clientIp,
		};

		if (res.statusCode >= 500) {
			logger.error(logData, "Request failed with server error");
		} else if (res.statusCode >= 400) {
			logger.warn(logData, "Request failed with client error");
		} else {
			logger.info(logData, "Request completed");
		}
	});
	next();
};
