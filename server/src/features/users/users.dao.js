import { supabase } from "../../config/supabase.js";
import { STUDY_SET_TABLE } from "../../models/study-set.model.js";
import { USER_TABLE } from "../../models/user.model.js";
import { USER_SUBSCRIPTION_TABLE } from "../../models/user-subscription.model.js";
import { PREMIUM_PLAN_TABLE } from "../../models/premium-plan.model.js";
import { getPagination } from "../../utils/pagination.js";

function sanitizeSearchKeyword(value) {
  return String(value || "")
    .trim()
    .replace(/[%,()]/g, " ")
    .replace(/\s+/g, " ");
}

// Columns the Admin user list is allowed to read. Per §3.9.1 the list must NOT
// expose passwords, auth secrets, payment records, or private security data —
// so those columns are never selected here.
const ADMIN_USER_COLUMNS =
  "user_id, full_name, email, username, avatar_url, active_role, account_status, created_at";

/**
 * Admin user list (UC-51 / §3.9.1) — every user, with keyword search and
 * role / account-status filters, paginated.
 * Uses the service-role client so the admin can read all users' emails
 * (the anon client is RLS-limited and is reserved for the public search).
 */
export async function findUsersForAdmin(filters = {}) {
  const db = supabase;
  const { page, limit, from, to } = getPagination(filters, { defaultLimit: 10 });
  const keyword = sanitizeSearchKeyword(filters.keyword);

  let query = db
    .from(USER_TABLE)
    .select(ADMIN_USER_COLUMNS, { count: "exact" })
    .is("deleted_at", null);

  if (keyword) {
    query = query.or(
      `full_name.ilike.%${keyword}%,email.ilike.%${keyword}%,username.ilike.%${keyword}%`
    );
  }

  if (filters.role) query = query.eq("active_role", filters.role);
  if (filters.accountStatus) query = query.eq("account_status", filters.accountStatus);

  if (filters.sortBy === "name") {
    query = query.order("full_name", { ascending: true });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error, count } = await query.range(from, to);

  return { data, error, count, page, limit };
}

export async function findPublicUsers(filters = {}) {
  const { page, limit, from, to } = getPagination(filters, { defaultLimit: 10 });
  const keyword = sanitizeSearchKeyword(filters.keyword);

  let query = supabase
    .from(USER_TABLE)
    .select("username, full_name, avatar_url, active_role, created_at", { count: "exact" })
    .eq("account_status", "active")
    .neq("active_role", "admin")
    .is("deleted_at", null);

  if (keyword) {
    query = query.or(`username.ilike.%${keyword}%,full_name.ilike.%${keyword}%`);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  return { data, error, count, page, limit };
}

export function findPublicUserByUsername(username) {
  return supabase
    .from(USER_TABLE)
    .select("user_id, username, full_name, avatar_url, bio, active_role, created_at")
    .eq("username", username)
    .eq("account_status", "active")
    .neq("active_role", "admin")
    .is("deleted_at", null)
    .maybeSingle();
}

export function findPublicStudySetsByTeacher(teacherId) {
  return supabase
    .from(STUDY_SET_TABLE)
    .select(
      "study_set_id, title, description, subject, question_count, created_at, updated_at, teacher:users!teacher_id(full_name, username, avatar_url)",
    )
    .eq("teacher_id", teacherId)
    .eq("visibility", "public")
    .is("deleted_at", null)
    .eq("is_admin_hidden", false)
    .order("updated_at", { ascending: false });
}

// ── Admin user detail + status update (UC-52 / §3.9.2) ─────────────────────
// Safe detail columns (no auth secrets / payment records).
// NOTE: `users` has NO is_premium column — premium status is derived from an
// active row in `user_subscriptions` (see findActiveSubscriptionForUser).
const ADMIN_USER_DETAIL_COLUMNS =
  "user_id, full_name, email, username, avatar_url, bio, phone_number, " +
  "active_role, account_status, created_at, updated_at";

/**
 * Find the user's current active subscription (if any) plus its plan name.
 * "Active" = status active AND now within [start_at, end_at]. Used to derive
 * the premium status shown on the Admin user detail (§3.9.2 Premium status).
 */
export async function findActiveSubscriptionForUser(userId) {
  const now = new Date().toISOString();

  return supabase
    .from(USER_SUBSCRIPTION_TABLE)
    .select(
      `subscription_id, premium_plan_id, status, start_at, end_at,
       premium_plan:${PREMIUM_PLAN_TABLE}!premium_plan_id(plan_name, display_name)`,
    )
    .eq("user_id", userId)
    .eq("status", "active")
    .lte("start_at", now)
    .gte("end_at", now)
    .order("end_at", { ascending: false })
    .limit(1)
    .maybeSingle();
}

export async function findUserByIdForAdmin(userId) {
  const db = supabase;
  const { data, error } = await db
    .from(USER_TABLE)
    .select(ADMIN_USER_DETAIL_COLUMNS)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();
  return { data, error };
}

export async function updateUserAccountStatus(userId, accountStatus) {
  const db = supabase;
  const { data, error } = await db
    .from(USER_TABLE)
    .update({ account_status: accountStatus, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("deleted_at", null)
    .select(ADMIN_USER_DETAIL_COLUMNS)
    .single();
  return { data, error };
}
