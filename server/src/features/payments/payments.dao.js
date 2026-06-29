import { supabase as db } from "../../config/supabase.js";
import { PAYMENT_TABLE } from "../../models/payment.model.js";
import { PREMIUM_PLAN_TABLE } from "../../models/premium-plan.model.js";
import { USER_SUBSCRIPTION_TABLE } from "../../models/user-subscription.model.js";

const PLAN_COLUMNS =
  "premium_plan_id, plan_name, display_name, plan_code, price_vnd, billing_period, duration_days, description, features";

export function findActivePremiumPlans() {
  return db
    .from(PREMIUM_PLAN_TABLE)
    .select(PLAN_COLUMNS)
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("price_vnd", { ascending: true });
}

export function findActiveSubscriptionForUser(userId) {
  const now = new Date().toISOString();

  return db
    .from(USER_SUBSCRIPTION_TABLE)
    .select("subscription_id, premium_plan_id, end_at")
    .eq("user_id", userId)
    .eq("status", "active")
    .lte("start_at", now)
    .gte("end_at", now)
    .order("end_at", { ascending: false })
    .limit(1)
    .maybeSingle();
}

export function findPremiumPlanById(planId) {
  return db
    .from(PREMIUM_PLAN_TABLE)
    .select("premium_plan_id, plan_name, display_name")
    .eq("premium_plan_id", planId)
    .maybeSingle();
}

export function findActivePremiumPlanById(planId) {
  return db
    .from(PREMIUM_PLAN_TABLE)
    .select(
      "premium_plan_id, plan_name, display_name, plan_code, price_vnd, duration_days, billing_period, description, features",
    )
    .eq("premium_plan_id", planId)
    .eq("is_active", true)
    .is("deleted_at", null)
    .maybeSingle();
}

export function createPendingPayment(payment) {
  return db.from(PAYMENT_TABLE).insert(payment).select("*").single();
}

export function updatePayment(paymentId, changes) {
  return db
    .from(PAYMENT_TABLE)
    .update({ ...changes, updated_at: new Date().toISOString() })
    .eq("payment_id", paymentId)
    .select("*")
    .single();
}

export function findPaymentById(paymentId) {
  return db.from(PAYMENT_TABLE).select("*").eq("payment_id", paymentId).maybeSingle();
}

export function findPaymentsForUser(userId) {
  return db
    .from(PAYMENT_TABLE)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
}

export function findPaymentByOrderCode(orderCode) {
  return db
    .from(PAYMENT_TABLE)
    .select("*")
    .contains("gateway_payload", { orderCode })
    .maybeSingle();
}

export function findSubscriptionByPaymentId(paymentId) {
  return db
    .from(USER_SUBSCRIPTION_TABLE)
    .select("*")
    .eq("payment_id", paymentId)
    .maybeSingle();
}

export function createSubscription(subscription) {
  return db.from(USER_SUBSCRIPTION_TABLE).insert(subscription).select("*").single();
}

export function updateSubscription(subscriptionId, changes) {
  return db
    .from(USER_SUBSCRIPTION_TABLE)
    .update({ ...changes, updated_at: new Date().toISOString() })
    .eq("subscription_id", subscriptionId)
    .select("*")
    .single();
}
