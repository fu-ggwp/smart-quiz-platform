import { supabase } from "../../config/supabase.js";
import { STUDY_SET_TABLE } from "../../models/study-set.model.js";
import { USER_TABLE } from "../../models/user.model.js";
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
  "user_id, full_name, email, username, avatar_url, active_role, account_status, is_premium, created_at";

/**
 * Admin user list (UC-51 / §3.9.1) — every user, with keyword search and
 * role / account-status / premium filters, paginated.
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
  if (typeof filters.isPremium === "boolean") query = query.eq("is_premium", filters.isPremium);

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
    .is("deleted_at", null)
    .maybeSingle();
}

export function findPublicStudySetsByTeacher(teacherId) {
  return supabase
    .from(STUDY_SET_TABLE)
    .select(
      "study_set_id, title, description, topic, tags, question_count, created_at, updated_at, teacher:users!teacher_id(full_name, username, avatar_url)",
    )
    .eq("teacher_id", teacherId)
    .eq("visibility", "public")
    .is("deleted_at", null)
    .eq("is_admin_hidden", false)
    .order("updated_at", { ascending: false });
}
