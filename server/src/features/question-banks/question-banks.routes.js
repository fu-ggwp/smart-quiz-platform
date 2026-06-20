import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import {
  create,
  generateFromMaterial,
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
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

function uploadMaterial(req, res, next) {
  upload.single("material")(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    const message = error.code === "LIMIT_FILE_SIZE"
      ? "Material file must be 15MB or smaller."
      : "Material file could not be uploaded.";

    res.status(400).json({ message });
  });
}

questionBanksRouter.get("/", requireAuth, list);
questionBanksRouter.post("/", requireAuth, create);
questionBanksRouter.post(
  "/generate-from-material",
  requireAuth,
  uploadMaterial,
  generateFromMaterial,
);
questionBanksRouter.get("/assigned", requireAuth, listAssigned);
questionBanksRouter.get("/assigned/:id/questions", requireAuth, listAssignedQuestions);
questionBanksRouter.get("/questions/:questionId", requireAuth, getQuestionById);
questionBanksRouter.patch("/questions/:questionId", requireAuth, updateQuestion);
questionBanksRouter.get("/:id/questions", requireAuth, listQuestions);
questionBanksRouter.get("/:id", requireAuth, getById);
questionBanksRouter.patch("/:id", requireAuth, update);
questionBanksRouter.delete("/:id", requireAuth, remove);

export default questionBanksRouter;
