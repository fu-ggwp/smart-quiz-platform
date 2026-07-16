import * as dao from "./study-sets.dao.js";
import { buildPaginatedResponse, getPagination } from "../../utils/pagination.js";
import {
  dbError,
  notFound,
  sanitizeSearchKeyword,
} from "./study-sets.helpers.js";

// List public study sets for admin review. `status`: "visible" | "hidden" | all.
export async function adminListPublicStudySets(query = {}) {
  const filters = {
    page: parseInt(query.page, 10) || 1,
    limit: parseInt(query.limit, 10) || 10,
    keyword: query.q || query.keyword || "",
    hidden:
      query.status === "hidden" ? true : query.status === "visible" ? false : undefined,
  };

  let dbQuery = dao.adminListPublicStudySets();

  const keyword = sanitizeSearchKeyword(filters.keyword);
  if (keyword) {
    dbQuery = dbQuery.or(
      `title.ilike.%${keyword}%,description.ilike.%${keyword}%,subject.ilike.%${keyword}%`,
    );
  }
  if (filters.hidden === true) {
    dbQuery = dbQuery.eq("is_admin_hidden", true);
  } else if (filters.hidden === false) {
    dbQuery = dbQuery.eq("is_admin_hidden", false);
  }

  const { from, to } = getPagination(filters, { defaultLimit: 10 });
  const { data, error, count } = await dbQuery
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (error) throw dbError(error, 500);

  return buildPaginatedResponse({
    items: data || [],
    count,
    page: filters.page,
    limit: filters.limit,
  });
}

// Hide (true) / restore (false) a public study set.
export async function adminSetVisibility(studySetId, hidden) {
  if (typeof hidden !== "boolean") {
    throw Object.assign(
      new Error("The information is invalid. Please check and try again."),
      { status: 400 },
    );
  }

  const { data: existing, error: findError } = await dao.adminFindStudySetById(studySetId);
  if (findError) throw dbError(findError, 500);
  if (!existing) throw notFound();

  const { data, error } = await dao.adminSetHidden(studySetId, hidden);
  if (error) throw dbError(error, 500);
  return data;
}
