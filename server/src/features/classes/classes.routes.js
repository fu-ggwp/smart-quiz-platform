import { Router } from "express";
import {
  getMyClasses,
  createClass,
  getClassDetail,
  getClassMembers,
  getJoinRequests,
  resolveJoinRequest,
} from "./classes.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";

const classesRouter = Router();

// Collection routes
classesRouter.get("/", requireAuth, getMyClasses);
classesRouter.post("/", requireAuth, createClass);

// Join request resolve — must be defined before /:id to avoid "join-requests" matching as an id
classesRouter.patch("/join-requests/:requestId", requireAuth, resolveJoinRequest);

// Class detail routes
classesRouter.get("/:id", requireAuth, getClassDetail);
classesRouter.get("/:id/members", requireAuth, getClassMembers);
classesRouter.get("/:id/join-requests", requireAuth, getJoinRequests);

export default classesRouter;
