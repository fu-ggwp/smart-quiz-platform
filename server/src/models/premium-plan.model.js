// Mirrors the `premium_plans` table — subscription tiers users can purchase.
// (The earlier scaffold guessed `name`/`price`/`currency`; real columns are
// `plan_name`/`price_vnd`/`plan_code`/`plan_type` — pricing is VND-only,
// no per-row currency field.)
export const PREMIUM_PLAN_TABLE = "premium_plans";

export const PremiumPlanType = Object.freeze({
  LEARNER_PREMIUM: "learner_premium",
  TEACHER_PREMIUM: "teacher_premium",
  CLASS_TEAM_PACK: "class_team_pack",
});

/**
 * @typedef {Object} PremiumPlan
 * @property {string} premium_plan_id
 * @property {string} plan_name
 * @property {string} plan_code       - unique
 * @property {"learner_premium"|"teacher_premium"|"class_team_pack"} plan_type
 * @property {number} price_vnd
 * @property {string} billing_period  - currently always "monthly"
 * @property {number} duration_days   - default 30
 * @property {string} [description]
 * @property {Object} features        - jsonb
 * @property {boolean} is_active
 * @property {string} created_at
 * @property {string} updated_at
 * @property {string} [deleted_at]
 */
