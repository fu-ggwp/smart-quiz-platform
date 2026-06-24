import { Router } from "express";
import {
  getMyClasses,
  createClass,
  getClassDetail,
  getClassMembers,
  getJoinRequests,
  resolveJoinRequest,
  joinClass,
  getJoinedClasses,
  removeMember,
  getLearnerClassDetail,
} from "./classes.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";

const classesRouter = Router();

// Collection routes
classesRouter.get("/", requireAuth, requireRole("teacher"), getMyClasses);
classesRouter.post("/", requireAuth, requireRole("teacher"), createClass);

// Learner: list joined classes — must be before /:id
classesRouter.get("/joined", requireAuth, requireRole("learner"), getJoinedClasses);

// Learner joins a class — must be before /:id
classesRouter.post("/join", requireAuth, requireRole("learner"), joinClass);

// Learner: class detail with assigned activities (UC-17 / §3.3.4)
classesRouter.get("/:id/assigned-study-sets", requireAuth, requireRole("learner"), getLearnerClassDetail);

// Join request resolve — must be before /:id
classesRouter.patch("/join-requests/:requestId", requireAuth, requireRole("teacher"), resolveJoinRequest);

// Class detail routes
classesRouter.get("/:id", requireAuth, requireRole("teacher"), getClassDetail);
classesRouter.get("/:id/members", requireAuth, requireRole("teacher"), getClassMembers);
classesRouter.delete("/:id/members/:memberId", requireAuth, requireRole("teacher"), removeMember);
classesRouter.get("/:id/join-requests", requireAuth, requireRole("teacher"), getJoinRequests);

export default classesRouter;
