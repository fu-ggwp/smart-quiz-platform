import supabase from "../../config/supabase.js";
import { STUDY_SET_TABLE } from "../../models/study-set.model.js";
import { PRACTICE_ATTEMPT_TABLE } from "../../models/practice-attempt.model.js";
import { ATTEMPT_ANSWER_TABLE } from "../../models/attempt-answer.model.js";
import { QUESTION_TABLE } from "../../models/question.model.js";
import { ANSWER_OPTION_TABLE } from "../../models/answer-option.model.js";
import { USER_TABLE } from "../../models/user.model.js";
import { STUDY_SET_ASSIGNMENT_TABLE } from "../../models/study-set-assignment.model.js";
import { CLASS_MEMBER_TABLE } from "../../models/join-request.model.js";
import { getPagination } from "../../utils/pagination.js";

// Tìm theo gv sở hữu là teacher_id, hỗ trợ pagination và filters
export async function findByTeacher(teacherId, filters = {}) {
  const { page, limit, from, to } = getPagination(filters, { defaultLimit: 10 });
  const keyword = filters.keyword ? String(filters.keyword).trim() : "";
  const visibility = filters.visibility && filters.visibility !== "all" ? filters.visibility : null;
  const assignment = filters.assignment && filters.assignment !== "all" ? filters.assignment : null;
  const sortBy = filters.sortBy || "latest";

  let assignedIds = [];
  if (assignment) {
    const { data: assignments } = await supabase
      .from("study_set_assignments")
      .select("study_set_id")
      .eq("assigned_by", teacherId);

    assignedIds = [...new Set((assignments || []).map((a) => a.study_set_id))];
  }

  let query = supabase
    .from(STUDY_SET_TABLE)
    .select(`
      *,
      study_set_assignments (
        class_id,
        classes (
          class_name
        )
      )
    `, { count: "exact" })
    .eq("teacher_id", teacherId)
    .is("deleted_at", null);

  if (keyword) {
    query = query.or(`title.ilike.%${keyword}%,description.ilike.%${keyword}%,topic.ilike.%${keyword}%,subject.ilike.%${keyword}%`);
  }

  if (visibility) {
    query = query.eq("visibility", visibility);
  }

  if (assignment === "assigned") {
    if (assignedIds.length === 0) {
      query = query.eq("study_set_id", "00000000-0000-0000-0000-000000000000");
    } else {
      query = query.in("study_set_id", assignedIds);
    }
  } else if (assignment === "unassigned") {
    if (assignedIds.length > 0) {
      query = query.not("study_set_id", "in", `(${assignedIds.join(",")})`);
    }
  }

  if (sortBy === "name-asc") {
    query = query.order("title", { ascending: true });
  } else if (sortBy === "name-desc") {
    query = query.order("title", { ascending: false });
  } else {
    query = query.order("updated_at", { ascending: false });
  }

  const { data, error, count } = await query.range(from, to);

  return {
    data,
    error,
    count,
    page,
    limit,
  };
}

// Tìm kiếm học phần public hoặc được assign cho lớp học cụ thể
function sanitizeSearchKeyword(value) {
  return String(value || "")
    .trim()
    .replace(/[%,()]/g, " ")
    .replace(/\s+/g, " ");
}

export async function findPublicStudySets(filters = {}) {
  const { page, limit, from, to } = getPagination(filters, { defaultLimit: 10 });
  const keyword = sanitizeSearchKeyword(filters.keyword);

  let query = supabase
    .from(STUDY_SET_TABLE)
    .select("study_set_id, title, description, subject, topic, tags, question_count, created_at, updated_at", { count: "exact" })
    .eq("visibility", "public")
    .is("deleted_at", null)
    .eq("is_admin_hidden", false);

  if (keyword) {
    query = query.or(
      `title.ilike.%${keyword}%,description.ilike.%${keyword}%,subject.ilike.%${keyword}%,topic.ilike.%${keyword}%`,
    );
  }

  const { data, error, count } = await query
    .order("updated_at", { ascending: false })
    .range(from, to);

  return { data, error, count, page, limit };
}

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
  return supabase
    .from(STUDY_SET_TABLE)
    .select(`
      *,
      study_set_assignments (
        class_id,
        classes (
          class_name
        )
      )
    `)
    .eq("study_set_id", id)
    .single();
}

// Tạo mới study set
export function create(payload) {
  return supabase.from(STUDY_SET_TABLE).insert(payload).select().single();
}

// Cập nhật study set
export function update(id, changes) {
  return supabase.from(STUDY_SET_TABLE).update(changes).eq("study_set_id", id).select().single();
}

// Xóa học phần (Soft Delete)
export function remove(id) {
  return supabase
    .from(STUDY_SET_TABLE)
    .update({ deleted_at: new Date().toISOString() })
    .eq("study_set_id", id);
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

//Cập nhật in4 chi tiết 1 câu hỏi
export function updateQuestion(questionId, changes) {
  return supabase
    .from(QUESTION_TABLE)
    .update(changes)
    .eq("question_id", questionId);
}

//Xóa 1 câu hỏi
export function deleteQuestions(questionIds) {
  return supabase
    .from(QUESTION_TABLE)
    .update({ deleted_at: new Date().toISOString() })
    .in("question_id", questionIds);
}

//Cập nhật in4 chi tiết 1 đáp ná
export function updateOption(optionId, changes) {
  return supabase
    .from(ANSWER_OPTION_TABLE)
    .update(changes)
    .eq("answer_option_id", optionId);
}

//Xóa đáp án
export function deleteOptions(optionIds) {
  return supabase
    .from(ANSWER_OPTION_TABLE)
    .delete()
    .in("answer_option_id", optionIds);
}

export function deleteAssignments(studySetId) {
  return supabase
    .from(STUDY_SET_ASSIGNMENT_TABLE)
    .delete()
    .eq("study_set_id", studySetId);
}