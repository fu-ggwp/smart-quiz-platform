import { Router } from "express";
import { me, switchRole, updateMe } from "./auth.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";

const authRouter = Router();

authRouter.get("/me", requireAuth, me);
authRouter.patch("/me", requireAuth, updateMe);
authRouter.patch("/role", requireAuth, switchRole);

export default authRouter;
