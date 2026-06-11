import { Router } from "express";
import { getMyClasses, createClass } from "./classes.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";

const classesRouter = Router();

// GET /api/classes — teacher sees their own classes
classesRouter.get("/", requireAuth, getMyClasses);

// POST /api/classes — teacher creates a new class
classesRouter.post("/", requireAuth, createClass);

export default classesRouter;
