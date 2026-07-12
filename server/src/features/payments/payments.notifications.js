import { PaymentStatus } from "../../models/payment.model.js";
import { env } from "../../config/env.js";
import { sendEmail } from "../../utils/email.service.js";
import { createNotification } from "../notifications/notifications.service.js";
import { logger } from "../../utils/logger.js";
import * as dao from "./payments.dao.js";

function buildClientUrl(path) {
  return new URL(path, env.clientUrl || "http://localhost:3000").toString();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  })[char]);
}

async function sendPremiumSuccessEmail(payment) {
  try {
    const { data: user, error } = await dao.findPaymentRecipient(payment.user_id);
    if (error) throw error;
    if (!user?.email) return;

    const name = escapeHtml(user.full_name || "there");
    const resultUrl = buildClientUrl(`/upgrade/result?paymentId=${payment.payment_id}`);
    const safeResultUrl = escapeHtml(resultUrl);

    await sendEmail({
      to: user.email,
      subject: "Premium upgrade successful",
      htmlContent: `<p>Hi ${name},</p>
        <p>Your Premium subscription has been activated successfully.</p>
        <p>You can view your payment result here: <a href="${safeResultUrl}">${safeResultUrl}</a></p>`,
    });
  } catch (err) {
    logger.error("Failed to send premium success email:", err.message);
  }
}

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

    if (successful) await sendPremiumSuccessEmail(payment);
  } catch (err) {
    logger.error("Failed to create payment result notification:", err.message);
  }
}
