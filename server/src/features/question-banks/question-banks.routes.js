import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { uploadMaterial } from "../../middlewares/upload.middleware.js";
import {
  create,
  generateFromMaterial,
  getById,
  listReady,
  listReadyQuestions,
  list,
  listQuestions,
  remove,
  update,
} from "./question-banks.controller.js";

const questionBanksRouter = Router();

questionBanksRouter.get("/", requireAuth, requireRole("teacher"), list);
questionBanksRouter.post("/", requireAuth, requireRole("teacher"), create);
questionBanksRouter.post(
  "/generate-from-material",
  requireAuth,
  requireRole("teacher"),
  uploadMaterial,
  generateFromMaterial,
);
questionBanksRouter.get("/ready", requireAuth, requireRole("teacher"), listReady);
questionBanksRouter.get(
  "/ready/:id/questions",
  requireAuth,
  requireRole("teacher"),
  listReadyQuestions,
);

questionBanksRouter.get("/:id/questions", requireAuth, requireRole("teacher"), listQuestions);
questionBanksRouter.get("/:id", requireAuth, requireRole("teacher"), getById);
questionBanksRouter.patch("/:id", requireAuth, requireRole("teacher"), update);
questionBanksRouter.delete("/:id", requireAuth, requireRole("teacher"), remove);

export default questionBanksRouter;
