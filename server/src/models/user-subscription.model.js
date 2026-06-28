export const USER_SUBSCRIPTION_TABLE = "user_subscriptions";

export const UserSubscriptionStatus = Object.freeze({
  ACTIVE: "active",
  CANCELLED: "cancelled",
  EXPIRED: "expired",
});

/**
 * @typedef {Object} UserSubscription
 * @property {string} subscription_id
 * @property {string} user_id
 * @property {string} premium_plan_id
 * @property {string} [payment_id]
 * @property {"active"|"cancelled"|"expired"} status
 * @property {string} start_at
 * @property {string} end_at
 * @property {string} [cancelled_at]
 * @property {string} created_at
 * @property {string} updated_at
 */
