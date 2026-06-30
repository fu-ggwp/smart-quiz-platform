  import { Router } from "express";
import * as studySetsController from "./study-sets.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { supabase, supabaseClient } from "../../config/supabase.js";
import { USER_TABLE } from "../../models/user.model.js";

const router = Router();

async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return next();
  }

  try {
    const { data, error } = await supabaseClient.auth.getUser(token);
    if (error || !data?.user) {
      return next();
    }

    req.user = data.user;
    const { data: dbUser } = await supabase
      .from(USER_TABLE)
      .select("active_role")
      .eq("user_id", data.user.id)
      .single();
    if (dbUser) {
      req.user.role = dbUser.active_role;
    }
  } catch (err) {
    console.error("Error in optionalAuth middleware:", err);
  }
  next();
}

router.get("/mine", requireAuth, studySetsController.listMine);
router.get("/learner", requireAuth, requireRole("learner"), studySetsController.listLearnerStudySets);
router.get("/public", studySetsController.listPublic);

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
router.get("/:id", optionalAuth, studySetsController.getOne);
router.patch("/:id", requireAuth, studySetsController.update);
router.delete("/:id", requireAuth, studySetsController.remove);

export default router;
