import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { uploadMaterial } from "../../middlewares/upload.middleware.js";
import { generateAnswerExplanation, generateFromMaterial } from "./ai.controller.js";

const aiRouter = Router();

aiRouter.post(
  "/questions/from-material",
  requireAuth,
  requireRole("teacher"),
  uploadMaterial,
  generateFromMaterial,
);

aiRouter.post(
  "/study-set-sessions/:sessionId/questions/:questionId/explanation",
  requireAuth,
  requireRole("learner"),
  generateAnswerExplanation,
);

export default aiRouter;
