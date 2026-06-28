// Brevo (Sendinblue) email integration — shared across features
// (e.g. auth uses it for verification emails, classes for invites).
import { env } from "../config/env.js";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

export async function sendEmail({ to, subject, htmlContent }) {
  if (!env.brevoApiKey) {
    throw new Error("BREVO_API_KEY is not configured");
  }

  const response = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "api-key": env.brevoApiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: { email: env.brevoSenderEmail, name: env.brevoSenderName },
      to: [{ email: to }],
      subject,
      htmlContent,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to send email: ${response.status} ${text}`);
  }

  return response.json();
}
