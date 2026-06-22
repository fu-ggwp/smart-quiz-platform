import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import {
  createExamSession,
  getAvailableExamSessions,
  getExamDetail,
  getLearnerExamDetail,
  getMyExamSessions,
  updateExamSettings,
} from "./exams.controller.js";

const examsRouter = Router();

// Learner routes must be before /:id routes.
examsRouter.get("/learner", requireAuth, requireRole("learner"), getAvailableExamSessions);
examsRouter.get("/learner/:id", requireAuth, requireRole("learner"), getLearnerExamDetail);

// Collection routes
examsRouter.get("/", requireAuth, requireRole("teacher"), getMyExamSessions);
examsRouter.post("/", requireAuth, requireRole("teacher"), createExamSession);

// Exam detail and settings routes
examsRouter.get("/:id", requireAuth, requireRole("teacher"), getExamDetail);
examsRouter.patch("/:id/settings", requireAuth, requireRole("teacher"), updateExamSettings);

export default examsRouter;
