import { Router } from "express";
import * as usersController from "./users.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";

const router = Router();

// Admin: full user list with search/filters (UC-51 / §3.9.1)
router.get("/", requireAuth, requireRole("admin"), usersController.listAll);

// Public: guest people search (UC-03) — safe public fields only
router.get("/public", usersController.listPublic);

export default router;
