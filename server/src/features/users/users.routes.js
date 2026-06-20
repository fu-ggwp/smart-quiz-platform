import { Router } from "express";
import * as usersController from "./users.controller.js";

const router = Router();

router.get("/public", usersController.listPublic);

export default router;
