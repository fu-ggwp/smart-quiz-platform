import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import {
  getMyExamSessions,
  getExamDetail,
  updateExam,
  updateExamSettings,
} from "./exams.controller.js";

const examsRouter = Router();

// Collection routes
examsRouter.get("/", requireAuth, getMyExamSessions);

// Exam detail and settings routes
examsRouter.get("/:id", requireAuth, getExamDetail);
examsRouter.patch("/:id", requireAuth, updateExam);
examsRouter.patch("/:id/settings", requireAuth, updateExamSettings);

export default examsRouter;
