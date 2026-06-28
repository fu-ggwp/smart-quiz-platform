import { PayOS } from "@payos/node";
import { env } from "../../config/env.js";

function getPayOS() {
  if (!env.payosClientId || !env.payosApiKey || !env.payosChecksumKey) {
    throw Object.assign(new Error("Missing PayOS environment variables."), {
      status: 500,
    });
  }

  return new PayOS({
    clientId: env.payosClientId,
    apiKey: env.payosApiKey,
    checksumKey: env.payosChecksumKey,
  });
}

export function createPaymentLink(payload) {
  return getPayOS().paymentRequests.create(payload);
}

export function verifyWebhook(payload) {
  return getPayOS().webhooks.verify(payload);
}
