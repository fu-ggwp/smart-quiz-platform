import supabase from "../../config/supabase.js";
import { USER_TABLE } from "../../models/user.model.js";
import { getPagination } from "../../utils/pagination.js";

function sanitizeSearchKeyword(value) {
  return String(value || "")
    .trim()
    .replace(/[%,()]/g, " ")
    .replace(/\s+/g, " ");
}

export async function findPublicUsers(filters = {}) {
  const { page, limit, from, to } = getPagination(filters, { defaultLimit: 10 });
  const keyword = sanitizeSearchKeyword(filters.keyword);

  let query = supabase
    .from(USER_TABLE)
    .select("username, full_name, avatar_url, created_at", { count: "exact" })
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
