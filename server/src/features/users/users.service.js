import * as dao from "./users.dao.js";
import { buildPaginatedResponse } from "../../utils/pagination.js";

function dbError(error, status = 400) {
  return Object.assign(new Error(error.message), { status });
}

function notFound(message = "User not found") {
  return Object.assign(new Error(message), { status: 404 });
}

// Allowed filter values, mirroring the DB CHECK constraints.
const ROLES = new Set(["learner", "teacher", "admin"]);
const ACCOUNT_STATUSES = new Set(["active", "pending", "locked", "disabled"]);

/**
 * Admin user list (UC-51 / §3.9.1). Normalizes/whitelists the query filters,
 * then returns a standard paginated response. Unknown filter values are
 * ignored (treated as "all").
 */
export async function listForAdmin(query = {}) {
  const filters = {
    page: parseInt(query.page, 10) || 1,
    limit: parseInt(query.limit, 10) || 10,
    keyword: query.q || query.keyword || "",
    role: ROLES.has(query.role) ? query.role : null,
    accountStatus: ACCOUNT_STATUSES.has(query.status) ? query.status : null,
    sortBy: query.sortBy === "name" ? "name" : "latest",
  };

  const { data, error, count, page, limit } = await dao.findUsersForAdmin(filters);
  if (error) {
    throw dbError(error, 500);
  }

  return buildPaginatedResponse({ items: data || [], count, page, limit });
}

// ── Admin user detail + status update (UC-52 / §3.9.2) ─────────────────────

/**
 * Attach derived premium status to a user detail row. The `users` table has no
 * is_premium column; premium is derived from an active user_subscriptions row.
 * Adds: is_premium (bool), premium_plan_name (string|null), premium_expires_at.
 */
async function attachPremiumStatus(user) {
  const { data: subscription, error } = await dao.findActiveSubscriptionForUser(user.user_id);
  if (error) throw dbError(error, 500);

  return {
    ...user,
    is_premium: Boolean(subscription),
    premium_plan_name:
      subscription?.premium_plan?.display_name ||
      subscription?.premium_plan?.plan_name ||
      null,
    premium_expires_at: subscription?.end_at || null,
  };
}

export async function getForAdmin(userId) {
  const { data, error } = await dao.findUserByIdForAdmin(userId);
  if (error) throw dbError(error, 500);
  if (!data) throw notFound();
  return attachPremiumStatus(data);
}

/**
 * Update a user's account status (UC-52 / §3.9.2). The UI maps its verbs to
 * the DB enum: Restore → active, Ban → disabled.
 * Guards: valid enum (MSG03), and an admin cannot change their own status.
 */
export async function updateAccountStatus(adminId, userId, body = {}) {
  const status = String(body.status ?? "").trim();

  if (!ACCOUNT_STATUSES.has(status)) {
    throw Object.assign(
      new Error("The information is invalid. Please check and try again."),
      { status: 400 },
    );
  }
  if (adminId === userId) {
    throw Object.assign(new Error("You cannot change your own account status."), {
      status: 400,
    });
  }

  await getForAdmin(userId); // 404 if missing

  const { data, error } = await dao.updateUserAccountStatus(userId, status);
  if (error) throw dbError(error, 500);

  return attachPremiumStatus(data);
}

export async function listPublic(query = {}) {
  const filters = {
    page: parseInt(query.page, 10) || 1,
    limit: parseInt(query.limit, 10) || 10,
    keyword: query.q || query.keyword || "",
  };

  const { data, error, count, page, limit } = await dao.findPublicUsers(filters);
  if (error) {
    throw dbError(error, 500);
  }

  return buildPaginatedResponse({
    items: data || [],
    count,
    page,
    limit,
  });
}

export async function getPublicProfile(username) {
  const normalizedUsername = String(username || "").trim();

  if (!normalizedUsername) {
    throw notFound();
  }

  const { data: user, error: userError } =
    await dao.findPublicUserByUsername(normalizedUsername);
  if (userError) {
    throw dbError(userError, 500);
  }
  if (!user) {
    throw notFound();
  }

  const { data: studySets, error: studySetError } =
    await dao.findPublicStudySetsByTeacher(user.user_id);
  if (studySetError) {
    throw dbError(studySetError, 500);
  }

  return {
    user: {
      username: user.username,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      bio: user.bio,
      active_role: user.active_role,
      created_at: user.created_at,
    },
    studySets: studySets || [],
  };
}
