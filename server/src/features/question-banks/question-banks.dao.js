import supabase, { supabaseAdmin } from "../../config/supabase.js";
import { QUESTION_BANK_TABLE } from "../../models/question-bank.model.js";
import { QUESTION_TABLE } from "../../models/question.model.js";
import { getPagination } from "../../utils/pagination.js";

const db = supabaseAdmin || supabase;

const sortableColumns = new Set([
  "title",
  "subject",
  "topic",
  "visibility",
  "status",
  "created_at",
  "updated_at",
]);

function cleanKeyword(value = "") {
  return String(value).trim().replace(/[,()]/g, " ").replace(/\s+/g, " ");
}

export function listByTeacher(teacherId, filters = {}) {
  const { page, limit, from, to } = getPagination(filters);
  const sortBy = sortableColumns.has(filters.sortBy) ? filters.sortBy : "updated_at";
  const ascending = filters.sortOrder === "asc";
  const keyword = cleanKeyword(filters.keyword);

  let query = db
    .from(QUESTION_BANK_TABLE)
    .select("*", { count: "exact" })
    .eq("teacher_id", teacherId)
    .is("deleted_at", null);

  if (keyword) {
    query = query.or(
      `title.ilike.%${keyword}%,description.ilike.%${keyword}%,subject.ilike.%${keyword}%,topic.ilike.%${keyword}%`
    );
  }

  if (filters.subject) query = query.eq("subject", filters.subject);
  if (filters.visibility) query = query.eq("visibility", filters.visibility);
  if (filters.status) query = query.eq("status", filters.status);

  return query.order(sortBy, { ascending }).range(from, to).then((result) => ({
    ...result,
    page,
    limit,
  }));
}

export function listSubjectsByTeacher(teacherId) {
  return db
    .from(QUESTION_BANK_TABLE)
    .select("subject")
    .eq("teacher_id", teacherId)
    .is("deleted_at", null)
    .not("subject", "is", null)
    .neq("subject", "")
    .order("subject", { ascending: true });
}

export function findOwnedById(questionBankId, teacherId) {
  return db
    .from(QUESTION_BANK_TABLE)
    .select("*")
    .eq("question_bank_id", questionBankId)
    .eq("teacher_id", teacherId)
    .is("deleted_at", null)
    .maybeSingle();
}

export function create(payload) {
  return db.from(QUESTION_BANK_TABLE).insert(payload).select("*").single();
}

export function update(questionBankId, teacherId, changes) {
  return db
    .from(QUESTION_BANK_TABLE)
    .update(changes)
    .eq("question_bank_id", questionBankId)
    .eq("teacher_id", teacherId)
    .is("deleted_at", null)
    .select("*")
    .maybeSingle();
}

export function softDelete(questionBankId, teacherId) {
  return update(questionBankId, teacherId, {
    status: "archived",
    deleted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
}

export async function countQuestions(questionBankId) {
  const { count, error } = await db
    .from(QUESTION_TABLE)
    .select("question_id", { count: "exact", head: true })
    .eq("question_bank_id", questionBankId)
    .is("deleted_at", null);

  if (error) throw error;
  return count || 0;
}
