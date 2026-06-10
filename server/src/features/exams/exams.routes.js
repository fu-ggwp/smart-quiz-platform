import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import * as examsController from "./exams.controller.js";

const router = Router();

router.get("/", requireAuth, asyncHandler(examsController.listMine));

export default router;
