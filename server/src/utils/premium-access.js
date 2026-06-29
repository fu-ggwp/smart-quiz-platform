import { supabase as db } from "../config/supabase.js";
import { PREMIUM_PLAN_TABLE } from "../models/premium-plan.model.js";
import { USER_SUBSCRIPTION_TABLE } from "../models/user-subscription.model.js";

const defaultPremiumRequiredMessage =
  "This feature is available for Premium accounts only. Please upgrade to continue.";

function serviceError(message, status = 403) {
  return Object.assign(new Error(message), { status });
}

function dbError(error) {
  return Object.assign(new Error(error.message || "Failed to load subscription status."), {
    status: 500,
  });
}

function normalizeFeatures(features) {
  if (Array.isArray(features)) return features;
  if (Array.isArray(features?.items)) return features.items;
  return [];
}

function hasFeature(features, featureCode) {
  return normalizeFeatures(features).some((feature) => {
    if (typeof feature === "string") return feature === featureCode;
    return feature?.feature_code === featureCode;
  });
}

export async function getActiveSubscription(userId) {
  const now = new Date().toISOString();

  return db
    .from(USER_SUBSCRIPTION_TABLE)
    .select("subscription_id, premium_plan_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .lte("start_at", now)
    .gte("end_at", now)
    .order("end_at", { ascending: false })
    .limit(1)
    .maybeSingle();
}

export async function userPlanHasFeature(userId, featureCode) {
  const { data: subscription, error: subscriptionError } =
    await getActiveSubscription(userId);
  if (subscriptionError) throw dbError(subscriptionError);
  if (!subscription?.premium_plan_id) return false;

  const { data: plan, error: planError } = await db
    .from(PREMIUM_PLAN_TABLE)
    .select("features")
    .eq("premium_plan_id", subscription.premium_plan_id)
    .maybeSingle();
  if (planError) throw dbError(planError);

  return hasFeature(plan?.features, featureCode);
}

export async function requirePremiumFeature(userId, featureCode, message) {
  const allowed = await userPlanHasFeature(userId, featureCode);

  if (!allowed) {
    throw serviceError(message || defaultPremiumRequiredMessage);
  }
}
