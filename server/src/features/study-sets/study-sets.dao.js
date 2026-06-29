import { supabase } from "../../config/supabase.js";
import { STUDY_SET_TABLE } from "../../models/study-set.model.js";
import { PRACTICE_ATTEMPT_TABLE } from "../../models/practice-attempt.model.js";
import { ATTEMPT_ANSWER_TABLE } from "../../models/attempt-answer.model.js";
import { QUESTION_TABLE } from "../../models/question.model.js";
import { ANSWER_OPTION_TABLE } from "../../models/answer-option.model.js";
import { STUDY_SET_ASSIGNMENT_TABLE } from "../../models/study-set-assignment.model.js";
import { CLASS_MEMBER_TABLE } from "../../models/join-request.model.js";
import { getPagination } from "../../utils/pagination.js";
import { CLASS_TABLE } from "../../models/class.model.js";

const db = supabase;

// Tìm theo gv sở hữu là teacher_id, hỗ trợ pagination và filters
export function getAssignmentsByTeacher(teacherId) {
  return db
    .from("study_set_assignments")
    .select("study_set_id")
    .eq("assigned_by", teacherId);
}

export function findByTeacher(teacherId) {
  return db
    .from(STUDY_SET_TABLE)
    .select(`
      *,
      study_set_assignments (
        class_id,
        classes (
          class_name
        )
      ),
      practice_attempts (
        learner_id
      )
    `, { count: "exact" })
    .eq("teacher_id", teacherId)
    .is("deleted_at", null);
}

export function findPublicStudySets() {
  return db
    .from(STUDY_SET_TABLE)
    .select(
      "study_set_id, title, description, topic, tags, question_count, created_at, updated_at, teacher:users!teacher_id(full_name, username, avatar_url)",
      { count: "exact" },
    )
    .eq("visibility", "public")
    .is("deleted_at", null)
    .eq("is_admin_hidden", false);
}

export function findPublic() {
  return db.from(STUDY_SET_TABLE).select("*");
}

// Tìm study set theo id
export function findById(id) {
  return db
    .from(STUDY_SET_TABLE)
    .select(`
      *,
      study_set_assignments (
        class_id,
        classes (
          class_name,
          teacher_id
        )
      ),
      teacher:users!teacher_id (
        full_name,
        avatar_url
      )
    `)
    .eq("study_set_id", id)
    .single();
}

// Tạo mới study set
export function create(payload) {
  return db.from(STUDY_SET_TABLE).insert(payload).select().single();
}

// Cập nhật study set
export function update(id, changes) {
  return db.from(STUDY_SET_TABLE).update(changes).eq("study_set_id", id).select().single();
}

// Xóa học phần (Soft Delete)
export function remove(id) {
  return db
    .from(STUDY_SET_TABLE)
    .update({ deleted_at: new Date().toISOString() })
    .eq("study_set_id", id);
}

// Gán study set cho lớp học
export function assignToClass(payload) {
  return db.from("study_set_assignments").insert(payload);
}

// Tạo attempt mới
export function createAttempt(payload) {
  return db.from(PRACTICE_ATTEMPT_TABLE).insert(payload).select().single();
}

// Tìm thông tin attempt theo id
export function findAttemptById(id) {
  return db.from(PRACTICE_ATTEMPT_TABLE).select("*").eq("practice_attempt_id", id).single();
}

// Cập nhật info attempt
export function updateAttempt(id, changes) {
  return db.from(PRACTICE_ATTEMPT_TABLE).update(changes).eq("practice_attempt_id", id).select().single();
}

// List toàn bộ attempts của học sinh
export function listAttemptsByLearner(learnerId) {
  return db
    .from(PRACTICE_ATTEMPT_TABLE)
    .select("*")
    .eq("learner_id", learnerId)
    .order("started_at", { ascending: false });
}

// Lưu các câu trả lời của học sinh
export function findAttemptAnswer(attemptId, questionId) {
  return db
    .from(ATTEMPT_ANSWER_TABLE)
    .select("attempt_answer_id")
    .eq("practice_attempt_id", attemptId)
    .eq("question_id", questionId)
    .maybeSingle();
}

export function updateAttemptAnswer(id, payload) {
  return db
    .from(ATTEMPT_ANSWER_TABLE)
    .update(payload)
    .eq("attempt_answer_id", id)
    .select()
    .single();
}

export function insertAttemptAnswer(payload) {
  return db.from(ATTEMPT_ANSWER_TABLE).insert(payload).select().single();
}

// List toàn bộ câu trả lời của 1 attempt
export function listAnswersByAttempt(attemptId) {
  return db.from(ATTEMPT_ANSWER_TABLE).select("*").eq("practice_attempt_id", attemptId);
}


//Thêm câu hỏi
export function creationQuestions(questionPayload) {
  return db.from(QUESTION_TABLE).insert(questionPayload).select();
}

//Thêm đáp án
export function createOptions(optionsPayload) {
  return db.from(ANSWER_OPTION_TABLE).insert(optionsPayload);
}

//Update slg câu hỏi
export function updateQuestionCount(studysetId, count) {
  return db.from(STUDY_SET_TABLE).update({ question_count: count }).eq("study_set_id", studysetId);
}

//Lấy full ques và ans trong study set
export function listQuestionByStudySet(studysetId) {
  return db
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
    .order("created_at", { ascending: true })
    .order("display_order", { foreignTable: "answer_options", ascending: true })
    .order("answer_option_id", { foreignTable: "answer_options", ascending: true });
}

//Lấy dsach lớp của hsinh
export function getLearnerClassMemberships(learnerId) {
  return db
    .from(CLASS_MEMBER_TABLE)
    .select("class_id")
    .eq("learner_id", learnerId)
    .eq("status", "active");
}

//Lấy ttin gán với hphan 
export function getAssignmentsByClassIds(classIds) {
  return db
    .from(STUDY_SET_ASSIGNMENT_TABLE)
    .select("study_set_id, class_id, classes(class_name, teacher_id)")
    .in("class_id", classIds);
}

//Lấy lsu làm bài
export function getPracticeAttempts(learnerId) {
  return db
    .from(PRACTICE_ATTEMPT_TABLE)
    .select("study_set_id, started_at, status")
    .eq("learner_id", learnerId);
}

//Lấy ttin chi tiết study set
export function getStudySetsByIds(ids) {
  return db
    .from(STUDY_SET_TABLE)
    .select("*, teacher:users!teacher_id(full_name, avatar_url)")
    .in("study_set_id", ids)
    .is("deleted_at", null)
    .eq("is_admin_hidden", false);
}

//Cập nhật in4 chi tiết 1 câu hỏi
export function updateQuestion(questionId, changes) {
  return db
    .from(QUESTION_TABLE)
    .update(changes)
    .eq("question_id", questionId);
}

//Xóa 1 câu hỏi
export function deleteQuestions(questionIds) {
  return db
    .from(QUESTION_TABLE)
    .update({ deleted_at: new Date().toISOString() })
    .in("question_id", questionIds);
}

//Cập nhật in4 chi tiết 1 đáp ná
export function updateOption(optionId, changes) {
  return db
    .from(ANSWER_OPTION_TABLE)
    .update(changes)
    .eq("answer_option_id", optionId);
}

//Xóa đáp án
export function deleteOptions(optionIds) {
  return db
    .from(ANSWER_OPTION_TABLE)
    .delete()
    .in("answer_option_id", optionIds);
}

export function deleteAssignments(studySetId) {
  return db
    .from(STUDY_SET_ASSIGNMENT_TABLE)
    .delete()
    .eq("study_set_id", studySetId);
}

// Lấy email thành viên lớp học đang hoạt động 
export function getActiveClassMemberEmails(classIds) {
  return db
    .from(CLASS_MEMBER_TABLE)
    .select("learner:users!learner_id(email, full_name)")
    .in("class_id", classIds)
    .eq("status", "active");
}

// Lấy danh sách tên lớp học theo ID
export function getClassNamesByIds(classIds) {
  return db
    .from(CLASS_TABLE)
    .select("class_id, class_name")
    .in("class_id", classIds);
}

export function checkAssignmentMatch(studySetId, classIds) {
  return db
    .from(STUDY_SET_ASSIGNMENT_TABLE)
    .select("assignment_id")
    .eq("study_set_id", studySetId)
    .in("class_id", classIds)
    .limit(1);
}

export function getCorrectOptions(questionId) {
  return db
    .from(ANSWER_OPTION_TABLE)
    .select("answer_option_id")
    .eq("question_id", questionId)
    .eq("is_correct", true);
}

export function getOwnedStudySetIds(teacherId) {
  return db
    .from(STUDY_SET_TABLE)
    .select("study_set_id")
    .eq("teacher_id", teacherId)
    .is("deleted_at", null);
}

const ADMIN_MODERATION_SELECT =
  "study_set_id, title, description, topic, visibility, is_admin_hidden, question_count, created_at, updated_at, " +
  "teacher:users!teacher_id(user_id, full_name, username)";

export function adminListPublicStudySets() {
  return db
    .from(STUDY_SET_TABLE)
    .select(ADMIN_MODERATION_SELECT, { count: "exact" })
    .eq("visibility", "public")
    .is("deleted_at", null);
}

export function adminFindStudySetById(studySetId) {
  return db
    .from(STUDY_SET_TABLE)
    .select("study_set_id")
    .eq("study_set_id", studySetId)
    .is("deleted_at", null)
    .maybeSingle();
}

export function adminSetHidden(studySetId, hidden) {
  return db
    .from(STUDY_SET_TABLE)
    .update({ is_admin_hidden: hidden, updated_at: new Date().toISOString() })
    .eq("study_set_id", studySetId)
    .is("deleted_at", null)
    .select(ADMIN_MODERATION_SELECT)
    .single();
}
