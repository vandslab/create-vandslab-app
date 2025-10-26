import { Router } from "express";
import { HealthController } from "@controllers/health.controller";

const router: Router = Router();
const healthController = new HealthController();

router.get("/", healthController.getHealth.bind(healthController));
router.get(
	"/detailed",
	healthController.getDetailedHealth.bind(healthController)
);

export default router;
