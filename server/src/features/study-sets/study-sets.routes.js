import { Router } from "express";
import * as studySetsController from "./study-sets.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";

const router = Router();

router.get("/mine", requireAuth, studySetsController.listMine);
router.get("/learner", requireAuth, requireRole("learner"), studySetsController.listLearnerStudySets);
router.get("/public", studySetsController.listPublic);

// Admin moderation (UC-53 / §3.9.3) — registered before "/:id"
router.get("/admin/resources", requireAuth, requireRole("admin"), studySetsController.adminListResources);
router.patch(
  "/admin/resources/:id/visibility",
  requireAuth,
  requireRole("admin"),
  studySetsController.adminSetVisibility
);

router.get("/", requireAuth, studySetsController.listAvailable);
router.post("/", requireAuth, studySetsController.create);

router.get("/sessions/mine", requireAuth, requireRole("learner"), studySetsController.listMySessions);
router.post(
  "/sessions/:sessionId/answers",
  requireAuth,
  requireRole("learner"),
  studySetsController.submitAnswer,
);
router.patch(
  "/sessions/:sessionId/complete",
  requireAuth,
  requireRole("learner"),
  studySetsController.completeSession,
);
router.get(
  "/sessions/:sessionId/results",
  requireAuth,
  requireRole("learner"),
  studySetsController.getSessionResults,
);
router.post(
  "/sessions/:sessionId/questions/:questionId/ai-explanation",
  requireAuth,
  requireRole("learner"),
  studySetsController.generateAnswerExplanation,
);

router.post("/:id/sessions", requireAuth, requireRole("learner"), studySetsController.startSession);
router.get("/:id", requireAuth, studySetsController.getOne);
router.patch("/:id", requireAuth, studySetsController.update);
router.delete("/:id", requireAuth, studySetsController.remove);

export default router;
