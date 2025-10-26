import pino from "pino";

const isDevelopment = process.env.NODE_ENV !== "production";

export const logger = pino({
	level: process.env.LOG_LEVEL || "info",
	transport: isDevelopment
		? {
				target: "pino-pretty",
				options: {
					colorize: true,
					translateTime: "SYS:standard",
					ignore: "pid,hostname",
					customColors: "info:blue,warn:yellow,error:red",
				},
		  }
		: undefined,
});
