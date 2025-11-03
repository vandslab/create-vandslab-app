import swaggerUi from "swagger-ui-express";
import path from "path";
import { Application } from "express";
import { logger } from "@/middlewares/console-logger";
import fs from "fs";

/**
 * Setup Swagger UI documentation
 * Loads auto-generated swagger-output.json from swagger-autogen
 * Serves interactive API docs at /api-docs
 */
export const setupSwagger = (app: Application): void => {
	try {
		// Load auto-generated Swagger JSON file (from swagger-autogen)
		const swaggerPath = path.join(__dirname, "../docs/swagger-output.json");

		if (!fs.existsSync(swaggerPath)) {
			logger.warn(
				"Swagger documentation file not found. Run 'pnpm swagger' to generate it."
			);
			return;
		}

		const swaggerDocument = JSON.parse(
			fs.readFileSync(swaggerPath, "utf-8")
		);

		// Swagger UI options
		const options: swaggerUi.SwaggerUiOptions = {
			customCss: ".swagger-ui .topbar { display: none }",
			customSiteTitle: "{{PROJECT_NAME}} API Documentation",
			swaggerOptions: {
				persistAuthorization: true, // Keep JWT token after page refresh
				displayRequestDuration: true,
				filter: true, // Enable search
				tryItOutEnabled: true,
			},
		};

		// Serve Swagger UI
		app.use(
			"/api-docs",
			swaggerUi.serve,
			swaggerUi.setup(swaggerDocument, options)
		);

		logger.info("Swagger documentation available at /api-docs");
	} catch (error) {
		logger.error({ error }, "Failed to load Swagger documentation");
	}
};
