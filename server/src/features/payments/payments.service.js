import { supabaseClient } from "../../config/supabase.js";
import { env } from "../../config/env.js";
import { PaymentStatus } from "../../models/payment.model.js";
import { UserSubscriptionStatus } from "../../models/user-subscription.model.js";
import * as gateway from "./payment-gateway.service.js";
import * as dao from "./payments.dao.js";

function dbError(error, status = 500) {
  return Object.assign(new Error(error.message || "Failed to load premium plans."), {
    status,
  });
}

function serviceError(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

function getBearerToken(req) {
  const authHeader = req.headers.authorization || "";
  return authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
}

async function resolveOptionalUser(req) {
  const token = getBearerToken(req);
  if (!token) return null;

  const { data, error } = await supabaseClient.auth.getUser(token);
  if (error || !data?.user) return null;

  return data.user;
}

function normalizeFeatures(features) {
  if (Array.isArray(features)) return features;
  if (Array.isArray(features?.items)) return features.items;
  return [];
}

function formatSubscription(subscription, plan) {
  if (!subscription?.subscription_id) return null;

  return {
    subscription_id: subscription.subscription_id,
    premium_plan_id: subscription.premium_plan_id,
    plan_name: plan?.plan_name || null,
    display_name: plan?.display_name || null,
    end_at: subscription.end_at,
  };
}

export async function listPlans(req) {
  const { data: plans, error: plansError } = await dao.findActivePremiumPlans();
  if (plansError) throw dbError(plansError);

  const currentUser = await resolveOptionalUser(req);
  let currentSubscription = null;

  if (currentUser?.id) {
    const { data: subscription, error: subscriptionError } =
      await dao.findActiveSubscriptionForUser(currentUser.id);
    if (subscriptionError) throw dbError(subscriptionError);

    if (subscription?.premium_plan_id) {
      const { data: subscriptionPlan, error: subscriptionPlanError } =
        await dao.findPremiumPlanById(subscription.premium_plan_id);
      if (subscriptionPlanError) throw dbError(subscriptionPlanError);
      currentSubscription = formatSubscription(subscription, subscriptionPlan);
    }
  }

  return {
    plans: (plans || []).map((plan) => ({
      ...plan,
      features: normalizeFeatures(plan.features),
    })),
    currentSubscription,
  };
}

export async function listMine(userId) {
  const { data, error } = await dao.findPaymentsForUser(userId);
  if (error) throw dbError(error);
  return { payments: data || [] };
}

export async function getOne(userId, paymentId) {
  const { data: payment, error } = await dao.findPaymentById(paymentId);
  if (error) throw dbError(error);
  if (!payment || payment.user_id !== userId) throw serviceError("Payment not found.", 404);

  const { data: subscription, error: subscriptionError } =
    await dao.findSubscriptionByPaymentId(payment.payment_id);
  if (subscriptionError) throw dbError(subscriptionError);

  return { payment, subscription: subscription || null };
}

function buildClientUrl(path) {
  const base = env.clientUrl || env.paymentRedirectBaseUrl || "http://localhost:3000";
  return new URL(path, base).toString();
}

function withPaymentId(url, paymentId) {
  const result = new URL(url);
  result.searchParams.set("paymentId", paymentId);
  return result.toString();
}

async function generateOrderCode() {
  for (let i = 0; i < 5; i += 1) {
    const orderCode = Number(`${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(-12));
    const { data, error } = await dao.findPaymentByOrderCode(orderCode);
    if (error) throw dbError(error);
    if (!data) return orderCode;
  }
  throw serviceError("Could not generate payment order code.", 500);
}

export async function startCheckout(user, body = {}) {
  if (!["learner", "teacher"].includes(user.role)) {
    throw serviceError("Only Learner and Teacher accounts can upgrade to Premium.", 403);
  }

  const { data: plan, error: planError } = await dao.findActivePremiumPlanById(body.planId);
  if (planError) throw dbError(planError);
  if (!plan) throw serviceError("Premium plan is unavailable.", 404);

  const { data: payment, error: paymentError } = await dao.createPendingPayment({
    user_id: user.id,
    premium_plan_id: plan.premium_plan_id,
    amount_vnd: plan.price_vnd,
    currency: "VND",
    payment_status: PaymentStatus.PENDING,
    payment_method: "payos",
    gateway_name: "payos",
    gateway_payload: {},
  });
  if (paymentError) throw dbError(paymentError);

  const orderCode = await generateOrderCode();
  const returnUrl = env.payosReturnUrl || buildClientUrl("/upgrade/result");
  const cancelUrl = env.payosCancelUrl || buildClientUrl("/upgrade/result");

  try {
    const link = await gateway.createPaymentLink({
      orderCode,
      amount: Number(plan.price_vnd),
      description: `Premium ${plan.plan_code}`.slice(0, 25),
      returnUrl: withPaymentId(returnUrl, payment.payment_id),
      cancelUrl: withPaymentId(cancelUrl, payment.payment_id),
      items: [{ name: plan.display_name || plan.plan_name, quantity: 1, price: Number(plan.price_vnd) }],
    });

    const { data: updated, error: updateError } = await dao.updatePayment(payment.payment_id, {
      gateway_payload: {
        gateway: "payos",
        orderCode,
        checkoutUrl: link.checkoutUrl,
        paymentLinkId: link.paymentLinkId,
        raw: link,
      },
    });
    if (updateError) throw dbError(updateError);

    return {
      payment: updated,
      checkoutUrl: link.checkoutUrl,
      orderCode,
    };
  } catch (error) {
    await dao.updatePayment(payment.payment_id, {
      payment_status: PaymentStatus.FAILED,
      failure_reason: error.message || "Could not create PayOS checkout.",
    });
    throw serviceError("Payment gateway is unavailable. Please try again.", 502);
  }
}

function addDays(value, days) {
  const date = new Date(value);
  date.setDate(date.getDate() + Number(days || 30));
  return date.toISOString();
}

async function activateSubscription(payment) {
  const { data: existingByPayment, error: existingError } =
    await dao.findSubscriptionByPaymentId(payment.payment_id);
  if (existingError) throw dbError(existingError);
  if (existingByPayment) return existingByPayment;

  const { data: active, error: activeError } = await dao.findActiveSubscriptionForUser(payment.user_id);
  if (activeError) throw dbError(activeError);

  const { data: plan, error: planError } = await dao.findActivePremiumPlanById(payment.premium_plan_id);
  if (planError) throw dbError(planError);
  if (!plan) throw serviceError("Premium plan is unavailable.", 404);

  const now = new Date().toISOString();
  const base = active?.end_at && new Date(active.end_at) > new Date() ? active.end_at : now;
  const changes = {
    premium_plan_id: plan.premium_plan_id,
    payment_id: payment.payment_id,
    status: UserSubscriptionStatus.ACTIVE,
    end_at: addDays(base, plan.duration_days),
  };

  if (active?.subscription_id) {
    const { data, error } = await dao.updateSubscription(active.subscription_id, changes);
    if (error) throw dbError(error);
    return data;
  }

  const { data, error } = await dao.createSubscription({
    user_id: payment.user_id,
    start_at: now,
    ...changes,
  });
  if (error) throw dbError(error);
  return data;
}

export async function handlePayOSWebhook(payload) {
  const data = await gateway.verifyWebhook(payload);
  const { data: payment, error } = await dao.findPaymentByOrderCode(data.orderCode);
  if (error) throw dbError(error);
  if (!payment) throw serviceError("Payment order not found.", 404);

  if (payment.payment_status === PaymentStatus.SUCCESSFUL) {
    const { data: subscription, error: subscriptionError } =
      await dao.findSubscriptionByPaymentId(payment.payment_id);
    if (subscriptionError) throw dbError(subscriptionError);
    return {
      received: true,
      paymentStatus: payment.payment_status,
      subscription: subscription || (await activateSubscription(payment)),
    };
  }

  const isSuccessful = payload.success === true && payload.code === "00" && data.code === "00";
  const nextStatus = isSuccessful ? PaymentStatus.SUCCESSFUL : PaymentStatus.FAILED;
  const { data: updated, error: updateError } = await dao.updatePayment(payment.payment_id, {
    payment_status: nextStatus,
    gateway_transaction_id: data.reference || data.paymentLinkId,
    gateway_payload: {
      ...(payment.gateway_payload || {}),
      webhook: payload,
      verifiedData: data,
    },
    paid_at: isSuccessful ? new Date().toISOString() : null,
    failure_reason: isSuccessful ? null : data.desc || payload.desc || "PayOS payment was not successful.",
  });
  if (updateError) throw dbError(updateError);

  const subscription = isSuccessful ? await activateSubscription(updated) : null;
  return { received: true, paymentStatus: updated.payment_status, subscription };
}
