// Mirrors the `payments` table — a premium-plan purchase transaction.
export const PAYMENT_TABLE = "payments";

export const PaymentStatus = Object.freeze({
  PENDING: "pending",
  SUCCESSFUL: "successful",
  FAILED: "failed",
  CANCELLED: "cancelled",
});

/**
 * @typedef {Object} Payment
 * @property {string} payment_id
 * @property {string} user_id           - FK -> users.user_id
 * @property {string} premium_plan_id   - FK -> premium_plans.premium_plan_id
 * @property {number} amount_vnd
 * @property {string} currency          - default "VND"
 * @property {"pending"|"successful"|"failed"|"cancelled"} payment_status
 * @property {string} [gateway_transaction_id] - unique
 * @property {Object} gateway_payload    - jsonb
 * @property {string} [payment_method]
 * @property {string} [gateway_name]
 * @property {string} [paid_at]
 * @property {string} [failure_reason]
 * @property {string} created_at
 * @property {string} updated_at
 */
