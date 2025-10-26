import { App } from "./app";
import { logger } from "./middlewares/console-logger";

const startServer = async () => {
	try {
		const server = new App();
		const PORT = process.env.PORT || 4000;

		server.app.listen(PORT, () => {
			logger.info(`Server running on http://localhost:${PORT}/`);
			logger.info(`API running on http://localhost:${PORT}/api`);
		});
	} catch (error) {
		logger.error(`Failed to start backend server: ${error}`);
		process.exit(1);
	}
};

startServer();
