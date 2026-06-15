import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import {
  createExamSession,
  getExamDetail,
  getMyExamSessions,
  updateExamSettings,
} from "./exams.controller.js";

const examsRouter = Router();

// Collection routes
examsRouter.get("/", requireAuth, getMyExamSessions);
examsRouter.post("/", requireAuth, createExamSession);

// Exam detail and settings routes
examsRouter.get("/:id", requireAuth, getExamDetail);
examsRouter.patch("/:id/settings", requireAuth, updateExamSettings);

export default examsRouter;
