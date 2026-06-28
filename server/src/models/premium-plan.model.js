// Mirrors the `premium_plans` table — subscription tiers users can purchase.
export const PREMIUM_PLAN_TABLE = "premium_plans";

/**
 * @typedef {Object} PremiumPlan
 * @property {string} premium_plan_id
 * @property {string} plan_name
 * @property {string} plan_code       - unique
 * @property {number} price_vnd
 * @property {string} billing_period  - currently always "monthly"
 * @property {number} duration_days   - default 30
 * @property {string} [description]
 * @property {Object} features        - jsonb
 * @property {boolean} is_active
 * @property {string} [display_name]
 * @property {string} created_at
 * @property {string} updated_at
 * @property {string} [deleted_at]
 */
