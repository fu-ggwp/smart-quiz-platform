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
