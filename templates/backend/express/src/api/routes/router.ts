import { Router } from "express";
import healthRoutes from "./health.routes";
import authRoutes from "./auth.routes";

const router: Router = Router();

/**
 * Main API router
 * All routes are prefixed with /api
 */

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);

export default router;
