import { supabase } from "../../config/supabase.js";
import { CLASS_TABLE } from "../../models/class.model.js";
import { ATTEMPT_ANSWER_TABLE } from "../../models/attempt-answer.model.js";
import { CLASS_MEMBER_TABLE } from "../../models/join-request.model.js";
import { EXAM_ATTEMPT_TABLE } from "../../models/exam-attempt.model.js";
import { EXAM_QUESTION_TABLE, EXAM_SESSION_TABLE } from "../../models/exam.model.js";

const db = supabase;

const EXAM_ATTEMPT_SELECT = `
  exam_attempt_id,
  exam_session_id,
  learner_id,
  attempt_number,
  started_at,
  expires_at,
  submitted_at,
  status,
  is_auto_submitted,
  question_order,
  answer_order,
  warning_count,
  total_score,
  created_at,
  updated_at
`;

const EXAM_SESSION_SELECT = `
  exam_session_id,
  class_id,
  teacher_id,
  question_bank_id,
  title,
  description,
  status,
  start_at,
  end_at,
  duration_minutes,
  attempt_limit,
  question_count,
  randomize_questions,
  randomize_answers,
  result_visibility,
  access_code,
  created_at,
  updated_at,
  classes:classes (
    class_id,
    teacher_id,
    class_name,
    status
  ),
  question_bank:question_banks (
    question_bank_id,
    title,
    topic
  )
`;

const SORTS = {
  latest: { column: "updated_at", ascending: false },
  start_asc: { column: "start_at", ascending: true },
  start_desc: { column: "start_at", ascending: false },
  title_asc: { column: "title", ascending: true },
};

function normalizePagination({ page = 1, pageSize = 10 } = {}) {
  const normalizedPage = Math.max(Number(page) || 1, 1);
  const normalizedPageSize = Math.min(Math.max(Number(pageSize) || 10, 1), 50);

  return { page: normalizedPage, pageSize: normalizedPageSize };
}

function includesText(value, term) {
  return String(value ?? "").toLowerCase().includes(term);
}

function filterExamSessions(items, filters) {
  const search = String(filters.search ?? "").trim().toLowerCase();
  const status = String(filters.status ?? "").trim();
  const classId = String(filters.classId ?? "").trim();
  const resultVisibility = String(filters.resultVisibility ?? "").trim();

  return items.filter((exam) => {
    const matchesSearch =
      !search ||
      includesText(exam.title, search) ||
      includesText(exam.description, search) ||
      includesText(exam.status, search) ||
      includesText(exam.classes?.class_name, search);

    const matchesStatus = !status || exam.status === status;
    const matchesClass = !classId || exam.class_id === classId;
    const matchesVisibility = !resultVisibility || exam.result_visibility === resultVisibility;

    return matchesSearch && matchesStatus && matchesClass && matchesVisibility;
  });
}

function sortExamSessions(items, sortBy) {
  if (sortBy === "title_asc") {
    return [...items].sort((left, right) => left.title.localeCompare(right.title));
  }

  if (sortBy === "start_asc" || sortBy === "start_desc") {
    const direction = sortBy === "start_asc" ? 1 : -1;

    return [...items].sort((left, right) => {
      const leftTime = left.start_at ? new Date(left.start_at).getTime() : Number.MAX_SAFE_INTEGER;
      const rightTime = right.start_at ? new Date(right.start_at).getTime() : Number.MAX_SAFE_INTEGER;
      return (leftTime - rightTime) * direction;
    });
  }

  return [...items].sort((left, right) => {
    const leftTime = left.updated_at ? new Date(left.updated_at).getTime() : 0;
    const rightTime = right.updated_at ? new Date(right.updated_at).getTime() : 0;
    return rightTime - leftTime;
  });
}

function buildClassOptions(items) {
  const classesById = new Map();

  items.forEach((exam) => {
    if (exam.classes?.class_id) {
      classesById.set(exam.classes.class_id, {
        class_id: exam.classes.class_id,
        class_name: exam.classes.class_name,
      });
    }
  });

  return Array.from(classesById.values()).sort((left, right) =>
    left.class_name.localeCompare(right.class_name)
  );
}

function paginateExamSessions(items, filters) {
  const { page, pageSize } = normalizePagination(filters);
  const filteredItems = sortExamSessions(filterExamSessions(items, filters), filters.sortBy);
  const total = filteredItems.length;
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: filteredItems.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages,
    classes: buildClassOptions(items),
  };
}

/**
 * Get exam sessions created by a teacher, with class and question bank context.
 */
export async function listTeacherExamSessions(teacherId, filters = {}) {
  const { page, pageSize } = normalizePagination(filters);
  const sort = SORTS[filters.sortBy] ?? SORTS.latest;

  const { data, error } = await db
    .from(EXAM_SESSION_TABLE)
    .select(EXAM_SESSION_SELECT)
    .eq("teacher_id", teacherId)
    .is("deleted_at", null)
    .order(sort.column, { ascending: sort.ascending, nullsFirst: false })
    .limit(1000);

  if (error) {
    return { data: null, error };
  }

  return { data: paginateExamSessions(data ?? [], filters), error: null };
}

/**
 * Get a single teacher-owned exam session by id.
 */
export function findTeacherExamSession(examSessionId, teacherId) {
  return db
    .from(EXAM_SESSION_TABLE)
    .select(EXAM_SESSION_SELECT)
    .eq("exam_session_id", examSessionId)
    .eq("teacher_id", teacherId)
    .is("deleted_at", null)
    .maybeSingle();
}

export function findExamSessionById(examSessionId) {
  return db
    .from(EXAM_SESSION_TABLE)
    .select(EXAM_SESSION_SELECT)
    .eq("exam_session_id", examSessionId)
    .is("deleted_at", null)
    .maybeSingle();
}

/**
 * Update configurable columns for a teacher-owned exam session.
 */
export function updateTeacherExamSessionConfig(examSessionId, teacherId, changes) {
  return db
    .from(EXAM_SESSION_TABLE)
    .update(changes)
    .eq("exam_session_id", examSessionId)
    .eq("teacher_id", teacherId)
    .is("deleted_at", null)
    .select(EXAM_SESSION_SELECT)
    .maybeSingle();
}

export function closeExpiredTeacherExamSessions(teacherId, nowIso) {
  return db
    .from(EXAM_SESSION_TABLE)
    .update({ status: "closed", updated_at: nowIso })
    .eq("teacher_id", teacherId)
    .eq("status", "active")
    .lte("end_at", nowIso)
    .is("deleted_at", null);
}

export function closeTeacherExamSession(examSessionId, teacherId, nowIso) {
  return db
    .from(EXAM_SESSION_TABLE)
    .update({ status: "closed", updated_at: nowIso })
    .eq("exam_session_id", examSessionId)
    .eq("teacher_id", teacherId)
    .eq("status", "active")
    .lte("end_at", nowIso)
    .is("deleted_at", null)
    .select(EXAM_SESSION_SELECT)
    .maybeSingle();
}

export function findManagedActiveClass(classId, teacherId) {
  return db
    .from(CLASS_TABLE)
    .select("class_id, teacher_id, class_name, status")
    .eq("class_id", classId)
    .eq("teacher_id", teacherId)
    .eq("status", "active")
    .is("deleted_at", null)
    .maybeSingle();
}

export function insertExamSession(payload) {
  return db
    .from(EXAM_SESSION_TABLE)
    .insert(payload)
    .select(EXAM_SESSION_SELECT)
    .single();
}

export function insertExamQuestions(rows) {
  if (!rows.length) {
    return Promise.resolve({ data: [], error: null });
  }

  return db
    .from(EXAM_QUESTION_TABLE)
    .insert(rows)
    .select("*");
}

export function deleteExamSession(examSessionId) {
  return db
    .from(EXAM_SESSION_TABLE)
    .delete()
    .eq("exam_session_id", examSessionId);
}

export function listActiveClassMemberships(learnerId) {
  return db
    .from(CLASS_MEMBER_TABLE)
    .select("class_id")
    .eq("learner_id", learnerId)
    .eq("status", "active");
}

// Active members (with contact info) of a class — used to notify learners when
// an exam session is published.
export function listActiveClassMemberEmails(classId) {
  return db
    .from(CLASS_MEMBER_TABLE)
    .select("learner:users!learner_id(user_id, email, full_name)")
    .eq("class_id", classId)
    .eq("status", "active");
}

export function countActiveClassMembers(classId) {
  return db
    .from(CLASS_MEMBER_TABLE)
    .select("class_member_id", { count: "exact", head: true })
    .eq("class_id", classId)
    .eq("status", "active");
}

export async function listLearnerExamSessions(classIds) {
  if (!classIds.length) return { data: [], error: null };

  return db
    .from(EXAM_SESSION_TABLE)
    .select(EXAM_SESSION_SELECT)
    .in("class_id", classIds)
    .eq("status", "active")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false, nullsFirst: false })
    .limit(1000);
}

export function closeExpiredLearnerExamSessions(classIds, nowIso) {
  if (!classIds.length) return Promise.resolve({ data: [], error: null });

  return db
    .from(EXAM_SESSION_TABLE)
    .update({ status: "closed", updated_at: nowIso })
    .in("class_id", classIds)
    .eq("status", "active")
    .lte("end_at", nowIso)
    .is("deleted_at", null);
}

export function findLearnerExamSession(examSessionId, classIds) {
  if (!classIds.length) return Promise.resolve({ data: null, error: null });

  return db
    .from(EXAM_SESSION_TABLE)
    .select(EXAM_SESSION_SELECT)
    .eq("exam_session_id", examSessionId)
    .in("class_id", classIds)
    .eq("status", "active")
    .is("deleted_at", null)
    .maybeSingle();
}

export function listLearnerExamAttempts(examSessionId, learnerId) {
  return db
    .from(EXAM_ATTEMPT_TABLE)
    .select("exam_attempt_id, attempt_number, status, started_at, expires_at, submitted_at, total_score, warning_count")
    .eq("exam_session_id", examSessionId)
    .eq("learner_id", learnerId)
    .order("attempt_number", { ascending: true });
}

export function listTeacherExamAttempts(examSessionId) {
  return db
    .from(EXAM_ATTEMPT_TABLE)
    .select(`${EXAM_ATTEMPT_SELECT}, learner:users!learner_id(user_id, email, username, full_name)`)
    .eq("exam_session_id", examSessionId)
    .order("started_at", { ascending: true });
}

export function listExamQuestions(examSessionId) {
  return db
    .from(EXAM_QUESTION_TABLE)
    .select("*")
    .eq("exam_session_id", examSessionId)
    .order("display_order", { ascending: true });
}

export function insertExamAttempt(payload) {
  return db.from(EXAM_ATTEMPT_TABLE).insert(payload).select(EXAM_ATTEMPT_SELECT).single();
}

export function findLearnerExamAttempt(examAttemptId, learnerId) {
  return db
    .from(EXAM_ATTEMPT_TABLE)
    .select(EXAM_ATTEMPT_SELECT)
    .eq("exam_attempt_id", examAttemptId)
    .eq("learner_id", learnerId)
    .maybeSingle();
}

export function findExamAttemptById(examAttemptId) {
  return db
    .from(EXAM_ATTEMPT_TABLE)
    .select(`${EXAM_ATTEMPT_SELECT}, learner:users!learner_id(user_id, email, username, full_name)`)
    .eq("exam_attempt_id", examAttemptId)
    .maybeSingle();
}

export function findInProgressExamAttempt(examSessionId, learnerId) {
  return db
    .from(EXAM_ATTEMPT_TABLE)
    .select(EXAM_ATTEMPT_SELECT)
    .eq("exam_session_id", examSessionId)
    .eq("learner_id", learnerId)
    .eq("status", "in_progress")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
}

export function updateExamAttempt(examAttemptId, changes) {
  return db
    .from(EXAM_ATTEMPT_TABLE)
    .update(changes)
    .eq("exam_attempt_id", examAttemptId)
    .select(EXAM_ATTEMPT_SELECT)
    .single();
}

export function listExamAttemptAnswers(examAttemptId) {
  return db
    .from(ATTEMPT_ANSWER_TABLE)
    .select("*")
    .eq("exam_attempt_id", examAttemptId);
}

export function upsertExamAttemptAnswer(payload) {
  return db
    .from(ATTEMPT_ANSWER_TABLE)
    .upsert(payload, { onConflict: "exam_attempt_id,exam_question_id" })
    .select("*")
    .single();
}

export function listLearnerCompletedAttempts(learnerId) {
  return db
    .from(EXAM_ATTEMPT_TABLE)
    .select(`
      exam_attempt_id,
      exam_session_id,
      learner_id,
      attempt_number,
      started_at,
      expires_at,
      submitted_at,
      status,
      total_score,
      warning_count,
      exam_sessions:exam_sessions!exam_session_id (
        exam_session_id,
        title,
        class_id,
        classes:classes (
          class_id,
          class_name
        )
      )
    `)
    .eq("learner_id", learnerId)
    .eq("status", "submitted");
}

