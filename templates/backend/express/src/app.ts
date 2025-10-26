import express, { Application } from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import { requestLogger } from "@middlewares/request-logger";
import { errorHandler } from "@middlewares/error-logger";
import apiRouter from "@api/routes/router";
import rateLimit from "express-rate-limit";
import { setupSwagger } from "@config/swagger";

export class App {
	public app: Application;
	constructor() {
		dotenv.config();

		this.app = express();
		this.initializeMiddlewares();
		this.initializeSwagger();
		this.initializeRoutes();
		this.initializeErrorHandling();
	}

	private initializeMiddlewares() {
		// Security headers
		this.app.use(helmet());

		// Rate limit
		this.app.use(
			rateLimit({
				windowMs: 15 * 60 * 1000,
				max: 100,
				message: "Too many request from this IP, please try again later.",
				standardHeaders: true,
				legacyHeaders: false,
			})
		);

		// CORS configuration
		this.app.use(
			cors({
				origin: process.env.CORS_ORIGIN || "http://localhost:3000",
				credentials: true,
			})
		);

		// Body parsers
		this.app.use(express.json());

		this.app.use(express.urlencoded({ extended: true }));

		this.app.use(requestLogger);
	}

	private initializeSwagger(): void {
		// Setup Swagger API documentation
		setupSwagger(this.app);
	}

	private initializeRoutes(): void {
		// Mount API router
		this.app.use("/api", apiRouter);
	}

	private initializeErrorHandling() {
		this.app.use(errorHandler);
	}
}
