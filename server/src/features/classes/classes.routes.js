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
} from "./classes.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";

const classesRouter = Router();

// Collection routes
classesRouter.get("/", requireAuth, getMyClasses);
classesRouter.post("/", requireAuth, createClass);

// Learner: list joined classes — must be before /:id
classesRouter.get("/joined", requireAuth, getJoinedClasses);

// Learner joins a class — must be before /:id
classesRouter.post("/join", requireAuth, joinClass);

// Join request resolve — must be before /:id
classesRouter.patch("/join-requests/:requestId", requireAuth, resolveJoinRequest);

// Class detail routes
classesRouter.get("/:id", requireAuth, getClassDetail);
classesRouter.get("/:id/members", requireAuth, getClassMembers);
classesRouter.get("/:id/join-requests", requireAuth, getJoinRequests);

export default classesRouter;
