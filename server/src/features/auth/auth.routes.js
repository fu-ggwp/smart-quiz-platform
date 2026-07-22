import { Router } from "express";
import { availability, me, switchRole, updateMe } from "./auth.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";

const authRouter = Router();

// Public: registration screen checks if an email / username is already used.
authRouter.post("/check-availability", availability);

authRouter.use(requireAuth);

authRouter.get("/me", me);
authRouter.patch("/me", updateMe);
authRouter.patch("/role", switchRole);

export default authRouter;
