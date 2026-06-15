import supabase from "../../config/supabase.js";
import { STUDY_SET_TABLE } from "../../models/study-set.model.js";
import { PRACTICE_ATTEMPT_TABLE } from "../../models/practice-attempt.model.js";
import { ATTEMPT_ANSWER_TABLE } from "../../models/attempt-answer.model.js";
import { QUESTION_BANK_TABLE } from "../../models/question-bank.model.js";
import { QUESTION_TABLE } from "../../models/question.model.js";
import { ANSWER_OPTION_TABLE } from "../../models/answer-option.model.js";
import { USER_TABLE } from "../../models/user.model.js";
import { STUDY_SET_ASSIGNMENT_TABLE } from "../../models/study-set-assignment.model.js";
import { CLASS_MEMBER_TABLE } from "../../models/join-request.model.js";

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

//List dsach ngân hàng câu hỏi của gvien
export function listQuestionBankByTeacher(teacherId) {
  return supabase.from(QUESTION_BANK_TABLE).select("*").eq("teacher_id", teacherId).is("deleted_at", null).order("created_at", { ascending: false });
}

// List dsach ques và ans trong nghang câu hỏi
export function listQuestionByBank(questionBankId) {
  return supabase
    .from(QUESTION_TABLE)
    .select(`
      *,
      answer_options:${ANSWER_OPTION_TABLE} (
        answer_option_id,
        question_id,
        option_text,
        is_correct,
        display_order
      )
    `)
    .eq("question_bank_id", questionBankId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
}

//Check tkhoan premium
export function checkPremium(userId) {
  return supabase.from(USER_TABLE).select("is_premium").eq("user_id", userId).single();
}

//Thêm câu hỏi
export function creationQuestions(questionPayload) {
  return supabase.from(QUESTION_TABLE).insert(questionPayload).select();
}

//Thêm đáp án
export function createOptions(optionsPayload) {
  return supabase.from(ANSWER_OPTION_TABLE).insert(optionsPayload);
}

//Update slg câu hỏi
export function updateQuestionCount(studysetId, count) {
  return supabase.from(STUDY_SET_TABLE).update({ question_count: count }).eq("study_set_id", studysetId);
}

//Lấy full ques và ans trong study set
export function listQuestionByStudySet(studysetId) {
  return supabase
    .from(QUESTION_TABLE)
    .select(`
      *,
      answer_options:${ANSWER_OPTION_TABLE} (
        answer_option_id,
        question_id,
        option_text,
        is_correct,
        display_order
      )
    `)
    .eq("study_set_id", studysetId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
}

//Lấy dsach lớp của hsinh
export function getLearnerClassMemberships(learnerId) {
  return supabase
    .from(CLASS_MEMBER_TABLE)
    .select("class_id")
    .eq("learner_id", learnerId)
    .eq("status", "active");
}

//Lấy ttin gán với hphan 
export function getAssignmentsByClassIds(classIds) {
  return supabase
    .from(STUDY_SET_ASSIGNMENT_TABLE)
    .select("study_set_id, class_id, classes(class_name)")
    .in("class_id", classIds);
}

//Lấy lsu làm bài
export function getPracticeAttempts(learnerId) {
  return supabase
    .from(PRACTICE_ATTEMPT_TABLE)
    .select("study_set_id, started_at")
    .eq("learner_id", learnerId);
}

//Lấy ttin chi tiết study set
export function getStudySetsByIds(ids) {
  return supabase
    .from(STUDY_SET_TABLE)
    .select("*, teacher:users!teacher_id(full_name, avatar_url)")
    .in("study_set_id", ids)
    .is("deleted_at", null)
    .eq("is_admin_hidden", false);
}
