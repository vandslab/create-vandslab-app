import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";
import { Application } from "express";
import { logger } from "@/middlewares/console-logger";

/**
 * Setup Swagger UI documentation
 * Loads OpenAPI YAML spec and serves interactive API docs at /api-docs
 */
export const setupSwagger = (app: Application): void => {
	try {
		// Load OpenAPI YAML file
		const swaggerDocument = YAML.load(
			path.join(__dirname, "../docs/openapi.yaml")
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
