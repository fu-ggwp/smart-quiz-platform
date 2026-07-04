import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import * as notificationsController from "./notifications.controller.js";

const router = Router();

router.get("/", requireAuth, notificationsController.listMine);
router.get("/unread-count", requireAuth, notificationsController.getUnreadCount);
router.patch("/read-all", requireAuth, notificationsController.markAllAsRead);
router.delete("/read", requireAuth, notificationsController.removeRead);
router.patch("/:notificationId/read", requireAuth, notificationsController.markOneAsRead);
router.delete("/:notificationId", requireAuth, notificationsController.removeOne);

export default router;
