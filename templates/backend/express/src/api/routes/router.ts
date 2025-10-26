import { Router } from "express";
import healthRoutes from "./health.routes";

const router: Router = Router();

/**
 * Main API router
 * All routes are prefixed with /api
 */

router.use("/health", healthRoutes);

/**
 * add routes like router.use("/auth", authRoutes)
 */

export default router;
