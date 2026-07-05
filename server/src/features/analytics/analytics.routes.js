import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { getLearnerProgressOverview } from "./analytics.controller.js";

const router = Router();

router.get("/learner-progress", requireAuth, requireRole("learner"), getLearnerProgressOverview);

export default router;
