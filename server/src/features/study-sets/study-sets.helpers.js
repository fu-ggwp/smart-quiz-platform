import * as dao from "./study-sets.dao.js";
import { notifyStudySetAssigned } from "../../utils/notification.service.js";
import { notifyLearnersOfStudySetAssignment } from "./study-sets.notifications.js";
import { logger } from "../../utils/logger.js";
import { requirePremiumFeature } from "../../utils/premium-access.js";

const aiStudySetQaFeature = "ai_study_set_qa";
const premiumRequiredMessage = "AI explanations are available for Premium accounts only. Please upgrade to continue.";

export function shouldNotify(payload = {}) {
  const flag = payload.notifyLearners ?? payload.notify_learners;
  return flag === undefined ? true : Boolean(flag);
}

export function notAvailable(message = "This study set is not available to you.") {
  return Object.assign(new Error(message), { status: 403 });
}

export function accessDenied(message = "You do not have permission to access or perform this action.") {
  return Object.assign(new Error(message), { status: 403 });
}

export async function notifyAssignment(targetClassIds, studySet, options = {}) {
  try {
    if (!targetClassIds?.length || !options.notify) return;

    const [{ data: members }, { data: classes }] = await Promise.all([
      dao.getActiveClassMemberEmails(targetClassIds),
      dao.getClassNamesByIds(targetClassIds),
    ]);

    const learners = (members || []).map((m) => m.learner).filter(Boolean);
    if (learners.length === 0) return;

    const className = (classes || []).map((c) => c.class_name).filter(Boolean).join(", ");
    await notifyStudySetAssigned({
      learners,
      studySetTitle: studySet.title,
      className,
    });
    await notifyLearnersOfStudySetAssignment({
      learners,
      studySetId: studySet.study_set_id,
      studySetTitle: studySet.title,
    });
  } catch (err) {
    logger.error("Failed to notify learners of study set assignment:", err.message);
  }
}

export function dbError(error, status = 400) {
  return Object.assign(new Error(error.message), { status });
}

export function serviceError(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

export function notFound(message = "Study set not found") {
  return Object.assign(new Error(message), { status: 404 });
}

export function sanitizeSearchKeyword(value) {
  return String(value || "")
    .trim()
    .replace(/[%,()]/g, " ")
    .replace(/\s+/g, " ");
}

export async function requirePremiumLearner(userId) {
  await requirePremiumFeature(userId, aiStudySetQaFeature, premiumRequiredMessage);
}

export function buildQuery(teacherId, filters) {
  let dbQuery = dao.findByTeacher(teacherId);

  const keyword = filters.keyword ? String(filters.keyword).trim() : "";
  if (keyword) {
    dbQuery = dbQuery.or(`title.ilike.%${keyword}%,description.ilike.%${keyword}%,subject.ilike.%${keyword}%`);
  }

  if (filters.visibility && filters.visibility !== "all") {
    dbQuery = dbQuery.eq("visibility", filters.visibility);
  }

  if (filters.sortBy === "name-asc") {
    dbQuery = dbQuery.order("title", { ascending: true });
  } else if (filters.sortBy === "name-desc") {
    dbQuery = dbQuery.order("title", { ascending: false });
  } else {
    dbQuery = dbQuery.order("updated_at", { ascending: false });
  }

  return dbQuery;
}

export function formatItems(items) {
  return (items || []).map((set) => {
    const assignedClassNames = (set.study_set_assignments || [])
      .map((a) => a.classes?.class_name)
      .filter(Boolean);

    const uniqueLearners = new Set(
      (set.practice_attempts || [])
        .map((pa) => pa.learner_id)
        .filter(Boolean)
    );
    const learnerCount = uniqueLearners.size;

    const setCopy = { ...set };
    delete setCopy.study_set_assignments;
    delete setCopy.practice_attempts;

    return {
      ...setCopy,
      assigned_class_names: assignedClassNames,
      assignedClassNames: assignedClassNames,
      learners: learnerCount,
      learner_count: learnerCount,
    };
  });
}

export async function validateStudySetAccess(studySet, userId, userRole) {
  if (userRole === "admin") {
    if (studySet.deleted_at) {
      throw notAvailable();
    }
    return;
  }
  if (studySet.teacher_id === userId) {
    return;
  }
  if (
    studySet.deleted_at ||
    studySet.is_admin_hidden
  ) {
    throw notAvailable();
  }
  if (studySet.visibility === "public") {
    return;
  }
  if (studySet.visibility === "private") {
    throw accessDenied();
  }

  if (studySet.visibility === "class_only") {
    if (userRole !== "learner") {
      throw accessDenied();
    }
    const { data: memberships, error: memberErr } = await dao.getLearnerClassMemberships(userId);
    if (memberErr || !memberships || memberships.length === 0) {
      throw accessDenied();
    }
    const classIds = memberships.map((m) => m.class_id);
    const { data: matched, error: matchErr } = await dao.checkAssignmentMatch(studySet.study_set_id, classIds);
    if (matchErr || !matched || matched.length === 0) {
      throw accessDenied();
    }
    return;
  }
}
