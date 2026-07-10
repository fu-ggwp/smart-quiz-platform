import { supabase } from "../../config/supabase.js";
import { ANSWER_OPTION_TABLE } from "../../models/answer-option.model.js";
import { QUESTION_BANK_TABLE } from "../../models/question-bank.model.js";
import { QUESTION_TABLE } from "../../models/question.model.js";
import { getPagination } from "../../utils/pagination.js";

const db = supabase;

function cleanKeyword(value = "") {
  return String(value).trim().replace(/[,()]/g, " ").replace(/\s+/g, " ");
}

/**
 * List non-deleted banks owned by a teacher, with server-side filtering and paging.
 */
export function listByTeacher(teacherId, filters = {}) {
  const { page, limit, from, to } = getPagination(filters);
  const keyword = cleanKeyword(filters.keyword);

  let query = db
    .from(QUESTION_BANK_TABLE)
    .select("*", { count: "exact" })
    .eq("teacher_id", teacherId)
    .neq("status", "Deleted");

  if (keyword) {
    query = query.or(
      `title.ilike.%${keyword}%,description.ilike.%${keyword}%,topic.ilike.%${keyword}%`,
    );
  }

  if (filters.status) query = query.eq("status", filters.status);

  return query
    .order("updated_at", { ascending: false })
    .range(from, to)
    .then((result) => ({
      ...result,
      page,
      limit,
    }));
}

/**
 * Return only ready banks; draft/deleted banks cannot be used by exams.
 */
export function listReadyByTeacher(teacherId) {
  return db
    .from(QUESTION_BANK_TABLE)
    .select("*")
    .eq("teacher_id", teacherId)
    .eq("status", "Ready")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });
}

/**
 * Ownership gate for teacher-facing question-bank detail and edit screens.
 */
export function findOwnedById(questionBankId, teacherId) {
  return db
    .from(QUESTION_BANK_TABLE)
    .select("*")
    .eq("question_bank_id", questionBankId)
    .eq("teacher_id", teacherId)
    .neq("status", "Deleted")
    .maybeSingle();
}

/**
 * Ownership + Ready status gate for flows that consume question banks.
 */
export function findReadyOwnedById(questionBankId, teacherId) {
  return db
    .from(QUESTION_BANK_TABLE)
    .select("*")
    .eq("question_bank_id", questionBankId)
    .eq("teacher_id", teacherId)
    .eq("status", "Ready")
    .is("deleted_at", null)
    .maybeSingle();
}

/**
 * Insert question-bank metadata only; questions are synced separately.
 */
export function create(payload) {
  return db.from(QUESTION_BANK_TABLE).insert(payload).select("*").single();
}

/**
 * Update bank metadata while keeping deleted banks hidden from edits.
 */
export function update(questionBankId, teacherId, changes) {
  return db
    .from(QUESTION_BANK_TABLE)
    .update(changes)
    .eq("question_bank_id", questionBankId)
    .eq("teacher_id", teacherId)
    .neq("status", "Deleted")
    .select("*")
    .maybeSingle();
}

/**
 * Soft-delete a bank to preserve history for related questions and usages.
 */
export function archive(questionBankId, teacherId) {
  const now = new Date().toISOString();

  return update(questionBankId, teacherId, {
    status: "Deleted",
    deleted_at: now,
    updated_at: now,
  });
}

/**
 * Count active bank questions. Study-set copies are excluded by study_set_id = null.
 */
export async function countQuestions(questionBankId) {
  const { count, error } = await db
    .from(QUESTION_TABLE)
    .select("question_id", { count: "exact", head: true })
    .eq("question_bank_id", questionBankId)
    .is("study_set_id", null)
    .is("deleted_at", null);

  if (error) throw error;
  return count || 0;
}

/**
 * Load active questions and their answer options for one owned bank.
 */
export function listQuestionsByBank(questionBankId, teacherId) {
  return db
    .from(QUESTION_TABLE)
    .select(`
      question_id,
      question_bank_id,
      study_set_id,
      source_question_id,
      owner_id,
      question_text,
      explanation,
      chapter,
      created_at,
      updated_at,
      answer_options:${ANSWER_OPTION_TABLE} (
        answer_option_id,
        question_id,
        option_text,
        is_correct,
        display_order,
        created_at
      )
    `)
    .eq("question_bank_id", questionBankId)
    .eq("owner_id", teacherId)
    .is("study_set_id", null)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
}

/**
 * Find one active question that still belongs to the teacher's reusable bank area.
 */
export function findOwnedQuestionById(questionId, teacherId) {
  return db
    .from(QUESTION_TABLE)
    .select(`
      question_id,
      question_bank_id,
      study_set_id,
      source_question_id,
      owner_id,
      question_text,
      explanation,
      chapter,
      created_at,
      updated_at,
      answer_options:${ANSWER_OPTION_TABLE} (
        answer_option_id,
        question_id,
        option_text,
        is_correct,
        display_order,
        created_at
      )
    `)
    .eq("question_id", questionId)
    .eq("owner_id", teacherId)
    .is("study_set_id", null)
    .is("deleted_at", null)
    .maybeSingle();
}

/**
 * Update question fields only; answer options are synced by dedicated helpers.
 */
export function updateQuestion(questionId, teacherId, changes) {
  return db
    .from(QUESTION_TABLE)
    .update(changes)
    .eq("question_id", questionId)
    .eq("owner_id", teacherId)
    .is("study_set_id", null)
    .is("deleted_at", null)
    .select(`
      question_id,
      question_bank_id,
      study_set_id,
      source_question_id,
      owner_id,
      question_text,
      explanation,
      chapter,
      created_at,
      updated_at
    `)
    .maybeSingle();
}

/**
 * Create the question row before inserting its answer options.
 */
export function createQuestion(payload) {
  return db
    .from(QUESTION_TABLE)
    .insert(payload)
    .select(`
      question_id,
      question_bank_id,
      study_set_id,
      source_question_id,
      owner_id,
      question_text,
      explanation,
      chapter,
      created_at,
      updated_at
    `)
    .single();
}

/**
 * Soft-delete questions removed from the editor draft.
 */
export function archiveQuestionsByIds(questionBankId, teacherId, questionIds) {
  if (!questionIds.length) {
    return Promise.resolve({ data: [], error: null });
  }

  const now = new Date().toISOString();

  return db
    .from(QUESTION_TABLE)
    .update({ deleted_at: now, updated_at: now })
    .eq("question_bank_id", questionBankId)
    .eq("owner_id", teacherId)
    .is("study_set_id", null)
    .is("deleted_at", null)
    .in("question_id", questionIds)
    .select("question_id");
}

/**
 * Update one answer option by id while guarding that it belongs to the question.
 */
export function updateAnswerOption(answerOptionId, questionId, changes) {
  return db
    .from(ANSWER_OPTION_TABLE)
    .update(changes)
    .eq("answer_option_id", answerOptionId)
    .eq("question_id", questionId)
    .select("answer_option_id, question_id, option_text, is_correct, display_order, created_at")
    .maybeSingle();
}

/**
 * Delete option rows that no longer exist in the editor draft.
 */
export function deleteAnswerOptionsByIds(questionId, answerOptionIds) {
  if (!answerOptionIds.length) {
    return Promise.resolve({ data: [], error: null });
  }

  return db
    .from(ANSWER_OPTION_TABLE)
    .delete()
    .eq("question_id", questionId)
    .in("answer_option_id", answerOptionIds)
    .select("answer_option_id");
}

/**
 * Insert new answer-option rows when a draft grows from 2 choices to more choices.
 */
export function insertAnswerOptions(rows) {
  if (!rows.length) {
    return Promise.resolve({ data: [], error: null });
  }

  return db
    .from(ANSWER_OPTION_TABLE)
    .insert(rows)
    .select("answer_option_id, question_id, option_text, is_correct, display_order, created_at");
}

