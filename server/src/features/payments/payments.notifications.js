import { PaymentStatus } from "../../models/payment.model.js";
import { createNotification } from "../notifications/notifications.service.js";
import { logger } from "../../utils/logger.js";

export async function notifyUserOfPaymentResult({ payment, status }) {
  try {
    if (!payment?.user_id) return;

    const successful = status === PaymentStatus.SUCCESSFUL;

    await createNotification({
      userId: payment.user_id,
      title: successful ? "Payment successful" : "Payment failed",
      message: successful
        ? "Your premium access has been activated."
        : "Your payment could not be completed.",
      targetUrl: `/upgrade/result?paymentId=${payment.payment_id}`,
    });
  } catch (err) {
    logger.error("Failed to create payment result notification:", err.message);
  }
}
