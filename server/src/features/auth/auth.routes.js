import { Router } from "express";
import { me } from "./auth.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";

const authRouter = Router();

authRouter.get("/me", requireAuth, me);

export default authRouter;
