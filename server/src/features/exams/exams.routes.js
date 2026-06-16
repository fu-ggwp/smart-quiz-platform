import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
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
examsRouter.get("/learner", requireAuth, getAvailableExamSessions);
examsRouter.get("/learner/:id", requireAuth, getLearnerExamDetail);

// Collection routes
examsRouter.get("/", requireAuth, getMyExamSessions);
examsRouter.post("/", requireAuth, createExamSession);

// Exam detail and settings routes
examsRouter.get("/:id", requireAuth, getExamDetail);
examsRouter.patch("/:id/settings", requireAuth, updateExamSettings);

export default examsRouter;
