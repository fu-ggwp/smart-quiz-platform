import { Router } from "express";

import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { getLearnerHome, getTeacherHome } from "./home.controller.js";

export const homeRouter = Router();

// Role-specific home page endpoints share auth but return different card payloads.
homeRouter.get("/learner", requireAuth, requireRole("learner"), getLearnerHome);
homeRouter.get("/teacher", requireAuth, requireRole("teacher"), getTeacherHome);

export default homeRouter;
