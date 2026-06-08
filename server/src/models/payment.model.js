// Mirrors the `payments` table — a premium-plan purchase/subscription record.
// (The earlier scaffold guessed `amount`/`provider`/`provider_ref` and a
// single status; the real table tracks `payment_status` and
// `subscription_status` separately, has no `provider` column, and amounts
// are integer VND, not a generic `amount`+`currency` pair.)
export const PAYMENT_TABLE = "payments";

export const PaymentStatus = Object.freeze({
  PENDING: "pending",
  SUCCESSFUL: "successful",
  FAILED: "failed",
  CANCELLED: "cancelled",
});

export const SubscriptionStatus = Object.freeze({
  INACTIVE: "inactive",
  ACTIVE: "active",
  EXPIRED: "expired",
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
 * @property {"inactive"|"active"|"expired"|"cancelled"} subscription_status
 * @property {string} [gateway_transaction_id] - unique
 * @property {Object} gateway_payload    - jsonb
 * @property {string} [premium_start_at]
 * @property {string} [premium_end_at]
 * @property {string} created_at
 * @property {string} updated_at
 */
