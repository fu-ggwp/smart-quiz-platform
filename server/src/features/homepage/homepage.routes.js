import { Router } from "express";

import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { getLearnerHome, getTeacherHome } from "./homepage.controller.js";

export const homepageRouter = Router();

// Role-specific home page endpoints share auth but return different card payloads.
homepageRouter.get("/learner", requireAuth, requireRole("learner"), getLearnerHome);
homepageRouter.get("/teacher", requireAuth, requireRole("teacher"), getTeacherHome);

export default homepageRouter;
