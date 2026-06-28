import { PayOS } from "@payos/node";

function getPayOS() {
  const { PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY } = process.env;

  if (!PAYOS_CLIENT_ID || !PAYOS_API_KEY || !PAYOS_CHECKSUM_KEY) {
    throw Object.assign(new Error("Missing PayOS environment variables."), {
      status: 500,
    });
  }

  return new PayOS({
    clientId: PAYOS_CLIENT_ID,
    apiKey: PAYOS_API_KEY,
    checksumKey: PAYOS_CHECKSUM_KEY,
  });
}

export function createPaymentLink(payload) {
  return getPayOS().paymentRequests.create(payload);
}

export function verifyWebhook(payload) {
  return getPayOS().webhooks.verify(payload);
}
