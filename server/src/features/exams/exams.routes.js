import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { createExamSession, getMyExamSessions } from "./exams.controller.js";

const examsRouter = Router();

// Collection routes
examsRouter.get("/", requireAuth, getMyExamSessions);
examsRouter.post("/", requireAuth, createExamSession);

export default examsRouter;
