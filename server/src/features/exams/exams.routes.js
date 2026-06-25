import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import {
  createExamSession,
  getAvailableExamSessions,
  getExamDetail,
  getLearnerExamAttempt,
  getLearnerExamAttemptResults,
  getLearnerExamDetail,
  getMyExamSessions,
  recordLearnerExamEvent,
  saveLearnerExamAnswer,
  startLearnerExamAttempt,
  submitLearnerExamAttempt,
  updateExamSettings,
} from "./exams.controller.js";

const examsRouter = Router();

// Learner routes must be before /:id routes.

examsRouter.get("/learner", requireAuth, requireRole("learner"), getAvailableExamSessions);
examsRouter.get("/learner/:id", requireAuth, requireRole("learner"), getLearnerExamDetail);
examsRouter.post("/:id/attempts", requireAuth, requireRole("learner"), startLearnerExamAttempt);
examsRouter.get("/attempts/:attemptId/results", requireAuth, requireRole("learner"), getLearnerExamAttemptResults);
examsRouter.get("/attempts/:attemptId", requireAuth, requireRole("learner"), getLearnerExamAttempt);
examsRouter.post("/attempts/:attemptId/answers", requireAuth, requireRole("learner"), saveLearnerExamAnswer);
examsRouter.patch("/attempts/:attemptId/submit", requireAuth, requireRole("learner"), submitLearnerExamAttempt);
examsRouter.post("/attempts/:attemptId/events", requireAuth, requireRole("learner"), recordLearnerExamEvent);


// Collection routes
examsRouter.get("/", requireAuth, requireRole("teacher"), getMyExamSessions);
examsRouter.post("/", requireAuth, requireRole("teacher"), createExamSession);

// Exam detail and settings routes
examsRouter.get("/:id", requireAuth, requireRole("teacher"), getExamDetail);
examsRouter.patch("/:id/settings", requireAuth, requireRole("teacher"), updateExamSettings);

export default examsRouter;
