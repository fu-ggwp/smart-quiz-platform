import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import {
  create,
  getById,
  getQuestionById,
  listAssigned,
  listAssignedQuestions,
  list,
  listQuestions,
  remove,
  update,
  updateQuestion,
} from "./question-banks.controller.js";

const questionBanksRouter = Router();

questionBanksRouter.get("/", requireAuth, list);
questionBanksRouter.post("/", requireAuth, create);
questionBanksRouter.get("/assigned", requireAuth, listAssigned);
questionBanksRouter.get("/assigned/:id/questions", requireAuth, listAssignedQuestions);
questionBanksRouter.get("/questions/:questionId", requireAuth, getQuestionById);
questionBanksRouter.patch("/questions/:questionId", requireAuth, updateQuestion);
questionBanksRouter.get("/:id/questions", requireAuth, listQuestions);
questionBanksRouter.get("/:id", requireAuth, getById);
questionBanksRouter.patch("/:id", requireAuth, update);
questionBanksRouter.delete("/:id", requireAuth, remove);

export default questionBanksRouter;
