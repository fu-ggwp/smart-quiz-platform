import { Router } from "express";
import { me, updateMe } from "./auth.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";

const authRouter = Router();

authRouter.get("/me", requireAuth, me);
authRouter.patch("/me", requireAuth, updateMe);

export default authRouter;
