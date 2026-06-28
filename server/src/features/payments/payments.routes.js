import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import * as paymentsController from "./payments.controller.js";

const router = Router();

router.get("/plans", paymentsController.listPlans);
router.post("/checkout", requireAuth, paymentsController.startCheckout);
router.post("/payos/webhook", paymentsController.handlePayOSWebhook);
router.get("/", requireAuth, paymentsController.listMine);
router.get("/:paymentId", requireAuth, paymentsController.getOne);

export default router;
