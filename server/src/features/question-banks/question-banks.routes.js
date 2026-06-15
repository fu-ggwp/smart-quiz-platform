import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { create, getById, list, remove, update } from "./question-banks.controller.js";

const questionBanksRouter = Router();

questionBanksRouter.get("/", requireAuth, list);
questionBanksRouter.post("/", requireAuth, create);
questionBanksRouter.get("/:id", requireAuth, getById);
questionBanksRouter.patch("/:id", requireAuth, update);
questionBanksRouter.delete("/:id", requireAuth, remove);

export default questionBanksRouter;