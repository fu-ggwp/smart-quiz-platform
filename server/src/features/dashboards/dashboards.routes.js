import { Router } from "express";

import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { getLearnerDashboard, getTeacherDashboard } from "./dashboards.controller.js";

export const dashboardsRouter = Router();

dashboardsRouter.get("/learner", requireAuth, requireRole("learner"), getLearnerDashboard);
dashboardsRouter.get("/teacher", requireAuth, requireRole("teacher"), getTeacherDashboard);

export default dashboardsRouter;
