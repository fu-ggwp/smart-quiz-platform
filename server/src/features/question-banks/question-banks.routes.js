import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { create, getById, list, listSubjects, remove, update } from "./question-banks.controller.js";

const questionBanksRouter = Router();

questionBanksRouter.get("/", requireAuth, list);
questionBanksRouter.post("/", requireAuth, create);
questionBanksRouter.get("/subjects", requireAuth, listSubjects);
questionBanksRouter.get("/:id", requireAuth, getById);
questionBanksRouter.patch("/:id", requireAuth, update);
questionBanksRouter.delete("/:id", requireAuth, remove);

export default questionBanksRouter;
