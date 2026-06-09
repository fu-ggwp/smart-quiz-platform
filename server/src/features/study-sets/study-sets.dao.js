import supabase from "../../config/supabase.js";
import { STUDY_SET_TABLE } from "../../models/study-set.model.js";
import { PRACTICE_ATTEMPT_TABLE } from "../../models/practice-attempt.model.js";
import { ATTEMPT_ANSWER_TABLE } from "../../models/attempt-answer.model.js";

// Tìm theo gv sở hữu là teacher_id
export function findByTeacher(teacherId) {
  return supabase.from(STUDY_SET_TABLE).select("*").eq("teacher_id", teacherId);
}

// Tìm kiếm học phần public hoặc được assign cho lớp học cụ thể
export async function findPublic({ classId } = {}) {
  if (!classId) {
    return supabase.from(STUDY_SET_TABLE).select("*").eq("visibility", "public");
  }

  const { data: assignments, error: assignError } = await supabase
    .from("study_set_assignments")
    .select("study_set_id")
    .eq("class_id", classId);

  if (assignError) {
    return { data: null, error: assignError };
  }

  const assignedIds = (assignments || []).map((a) => a.study_set_id);

  let query = supabase.from(STUDY_SET_TABLE).select("*");
  if (assignedIds.length > 0) {
    query = query.or(`visibility.eq.public,study_set_id.in.(${assignedIds.join(",")})`);
  } else {
    query = query.eq("visibility", "public");
  }
  return query;
}

// Tìm study set theo id
export function findById(id) {
  return supabase.from(STUDY_SET_TABLE).select("*").eq("study_set_id", id).single();
}

// Tạo mới study set
export function create(payload) {
  return supabase.from(STUDY_SET_TABLE).insert(payload).select().single();
}

// Cập nhật study set
export function update(id, changes) {
  return supabase.from(STUDY_SET_TABLE).update(changes).eq("study_set_id", id).select().single();
}

// Xóa học phần
export function remove(id) {
  return supabase.from(STUDY_SET_TABLE).delete().eq("study_set_id", id);
}

// Gán study set cho lớp học
export function assignToClass(payload) {
  return supabase.from("study_set_assignments").insert(payload);
}

// Tạo attempt mới
export function createAttempt(payload) {
  return supabase.from(PRACTICE_ATTEMPT_TABLE).insert(payload).select().single();
}

// Tìm thông tin attempt theo id
export function findAttemptById(id) {
  return supabase.from(PRACTICE_ATTEMPT_TABLE).select("*").eq("practice_attempt_id", id).single();
}

// Cập nhật info attempt
export function updateAttempt(id, changes) {
  return supabase.from(PRACTICE_ATTEMPT_TABLE).update(changes).eq("practice_attempt_id", id).select().single();
}

// List toàn bộ attempts của học sinh
export function listAttemptsByLearner(learnerId) {
  return supabase
    .from(PRACTICE_ATTEMPT_TABLE)
    .select("*")
    .eq("learner_id", learnerId)
    .order("started_at", { ascending: false });
}

// Lưu các câu trả lời của học sinh
export function recordAnswer(payload) {
  return supabase.from(ATTEMPT_ANSWER_TABLE).insert(payload).select().single();
}

// List toàn bộ câu trả lời của 1 attempt
export function listAnswersByAttempt(attemptId) {
  return supabase.from(ATTEMPT_ANSWER_TABLE).select("*").eq("practice_attempt_id", attemptId);
}
