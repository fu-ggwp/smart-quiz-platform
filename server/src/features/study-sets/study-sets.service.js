import * as dao from "./study-sets.dao.js";
import { buildPaginatedResponse, getPagination } from "../../utils/pagination.js";
import { notifyStudySetAssigned } from "../../utils/notification.service.js";
import { notifyLearnersOfStudySetAssignment } from "./study-sets.notifications.js";
import { logger } from "../../utils/logger.js";
import { requirePremiumFeature } from "../../utils/premium-access.js";
import * as aiService from "../ai/ai.service.js";
const aiStudySetQaFeature = "ai_study_set_qa";
const premiumRequiredMessage = "AI explanations are available for Premium accounts only. Please upgrade to continue.";

function shouldNotify(payload = {}) {
  const flag = payload.notifyLearners ?? payload.notify_learners;
  return flag === undefined ? true : Boolean(flag);
}
function notAvailable(message = "This study set is not available to you.") {
  return Object.assign(new Error(message), { status: 403 });
}
function accessDenied(message = "You do not have permission to access or perform this action.") {
  return Object.assign(new Error(message), { status: 403 });
}
async function notifyAssignment(targetClassIds, studySet, options = {}) {
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

function dbError(error, status = 400) {
  return Object.assign(new Error(error.message), { status });
}

function serviceError(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

// Thông báo study set này không tìm thấy
function notFound(message = "Study set not found") {
  return Object.assign(new Error(message), { status: 404 });
}

// Làm sạch keyword tìm kiếm trước khi đưa vào câu .or() ilike.
function sanitizeSearchKeyword(value) {
  return String(value || "")
    .trim()
    .replace(/[%,()]/g, " ")
    .replace(/\s+/g, " ");
}

async function requirePremiumLearner(userId) {
  await requirePremiumFeature(userId, aiStudySetQaFeature, premiumRequiredMessage);
}

function buildQuery(teacherId, filters, assignedIds) {
  let dbQuery = dao.findByTeacher(teacherId);

  const keyword = filters.keyword ? String(filters.keyword).trim() : "";
  if (keyword) {
    dbQuery = dbQuery.or(`title.ilike.%${keyword}%,description.ilike.%${keyword}%,topic.ilike.%${keyword}%`);
  }

  if (filters.visibility && filters.visibility !== "all") {
    dbQuery = dbQuery.eq("visibility", filters.visibility);
  }

  if (filters.assignment === "assigned") {
    if (assignedIds.length === 0) {
      dbQuery = dbQuery.eq("study_set_id", "00000000-0000-0000-0000-000000000000");
    } else {
      dbQuery = dbQuery.in("study_set_id", assignedIds);
    }
  } else if (filters.assignment === "unassigned") {
    if (assignedIds.length > 0) {
      dbQuery = dbQuery.not("study_set_id", "in", `(${assignedIds.join(",")})`);
    }
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

function formatItems(items) {
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

// List toàn bộ study set của giáo viên
export async function listMine(teacherId, query = {}) {
  const filters = {
    page: parseInt(query.page, 10) || 1,
    limit: parseInt(query.limit, 10) || 10,
    keyword: query.keyword || "",
    visibility: query.visibility || "all",
    assignment: query.assignment || "all",
    sortBy: query.sortBy || "latest",
  };

  let assignedIds = [];
  if (filters.assignment && filters.assignment !== "all") {
    const { data: assignments, error: assignError } = await dao.getAssignmentsByTeacher(teacherId);
    if (assignError) {
      throw dbError(assignError, 500);
    }
    assignedIds = [...new Set((assignments || []).map((a) => a.study_set_id))];
  }

  const dbQuery = buildQuery(teacherId, filters, assignedIds);

  const { from, to } = getPagination(filters, { defaultLimit: 10 });
  const { data, error, count } = await dbQuery.range(from, to);
  if (error) {
    throw dbError(error, 500);
  }

  const items = formatItems(data);

  return {
    items,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total: count ?? items.length,
      totalPages: count ? Math.ceil(count / filters.limit) : 1,
    },
  };
}

// List study set public hoặc thuộc 1 lớp
export async function listAvailable(classId) {
  let assignedIds = [];
  if (classId) {
    const { data: assignments, error: assignError } = await dao.getAssignmentsByClassIds([classId]);
    if (assignError) {
      throw dbError(assignError, 500);
    }
    assignedIds = (assignments || []).map((a) => a.study_set_id);
  }

  let dbQuery = dao.findPublic();
  if (assignedIds.length > 0) {
    dbQuery = dbQuery.or(`visibility.eq.public,study_set_id.in.(${assignedIds.join(",")})`);
  } else {
    dbQuery = dbQuery.eq("visibility", "public");
  }

  const { data, error } = await dbQuery;
  if (error) {
    throw dbError(error, 500);
  }
  return data;
}

// Lấy chi tiết 1 study set kèm danh sách câu hỏi
export async function listPublic(query = {}) {
  const filters = {
    page: parseInt(query.page, 10) || 1,
    limit: parseInt(query.limit, 10) || 10,
    keyword: query.q || query.keyword || "",
  };

  let dbQuery = dao.findPublicStudySets();

  const keyword = sanitizeSearchKeyword(filters.keyword);
  if (keyword) {
    dbQuery = dbQuery.or(
      `title.ilike.%${keyword}%,description.ilike.%${keyword}%,topic.ilike.%${keyword}%`,
    );
  }

  const { from, to } = getPagination(filters, { defaultLimit: 10 });
  const { data, error, count } = await dbQuery
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw dbError(error, 500);
  }

  return buildPaginatedResponse({
    items: data || [],
    count,
    page: filters.page,
    limit: filters.limit,
  });
}

export async function getOne(id, user = null) {
  const { data: studySet, error } = await dao.findById(id);
  if (error || !studySet) {
    throw notFound();
  }
  if (user) {
    const userId = user.user_id || user.id;
    const userRole = user.role;
    await validateStudySetAccess(studySet, userId, userRole);
  } else {
    if (
      studySet.deleted_at ||
      studySet.is_admin_hidden ||
      studySet.visibility === "private" ||
      studySet.visibility === "class_only"
    ) {
      throw accessDenied("Please log in to access this study set.");
    }
  }
  const { data: questions, error: qError } =
    await dao.listQuestionByStudySet(id);
  if (qError) {
    throw dbError(qError, 500);
  }

  let setCopy = { ...studySet };
  if (user && user.role === "learner") {
    const userId = user.user_id || user.id;
    const { data: memberships } = await dao.getLearnerClassMemberships(userId);
    const enrolledClassIds = (memberships || []).map((m) => m.class_id);
    
    if (setCopy.study_set_assignments) {
      setCopy.study_set_assignments = setCopy.study_set_assignments.filter((a) => {
        return enrolledClassIds.includes(a.class_id) && a.classes?.teacher_id !== userId;
      });
    }
  }

  return {
    ...setCopy,
    questions: questions || [],
  };
}

async function createQuestionsAndOptions(studySetId, teacherId, questions) {
  if (!questions || questions.length === 0) return;

  const questionsPayload = questions.map((q) => ({
    study_set_id: studySetId,
    owner_id: teacherId,
    question_text: q.question_text,
    explanation: q.explanation || null,
    chapter: q.chapter || null,
    source_question_id: q.source_question_id || null,
  }));

  const { data: insertedQuestions, error: qError } =
    await dao.creationQuestions(questionsPayload);
  if (qError) {
    throw dbError(qError);
  }

  const optionsPayload = [];
  for (let i = 0; i < insertedQuestions.length; i++) {
    const insertedQ = insertedQuestions[i];
    const originalQ = questions[i];

    if (originalQ.options && originalQ.options.length > 0) {
      originalQ.options.forEach((opt, idx) => {
        optionsPayload.push({
          question_id: insertedQ.question_id,
          option_text: opt.option_text,
          is_correct: !!opt.is_correct,
          display_order: opt.display_order ?? idx + 1,
        });
      });
    }
  }

  if (optionsPayload.length > 0) {
    const { error: optError } = await dao.createOptions(optionsPayload);
    if (optError) {
      throw dbError(optError);
    }
  }

  await dao.updateQuestionCount(
    studySetId,
    insertedQuestions.length,
  );
}

async function assignAndNotify(studySet, teacherId, classId, payload) {
  const targetClassIds = Array.isArray(classId)
    ? classId
    : classId
      ? [classId]
      : [];

  if (targetClassIds.length > 0) {
    const assignments = targetClassIds.map((cid) => ({
      study_set_id: studySet.study_set_id,
      class_id: cid,
      assigned_by: teacherId,
    }));
    const { error: assignError } = await dao.assignToClass(assignments);
    if (assignError) {
      throw dbError(assignError);
    }

    notifyAssignment(targetClassIds, studySet, {
      notify: shouldNotify(payload),
    });
  }
}

// Tạo mới 1 study set
export async function create(
  teacherId,
  payload,
) {
  const { title, description, visibility, classId, questionBankId, questions } = payload;
  if (!title?.trim()) {
    throw Object.assign(new Error("Title is required"), { status: 422 });
  }

  const { data: studySet, error } = await dao.create({
    teacher_id: teacherId,
    title,
    description,
    visibility: visibility || "private",
    source_question_bank_id: questionBankId || null,
  });

  if (error) {
    throw dbError(error);
  }

  await createQuestionsAndOptions(studySet.study_set_id, teacherId, questions);
  if (questions && questions.length > 0) {
    studySet.question_count = questions.length;
  }

  await assignAndNotify(studySet, teacherId, classId, payload);

  return studySet;
}

async function updateSingleQuestion(existingQ, payloadQ) {
  const qPayload = {
    question_text: payloadQ.question_text,
    explanation: payloadQ.explanation || null,
    chapter: payloadQ.chapter || null,
  };

  const { error: upQError } = await dao.updateQuestion(payloadQ.question_id, qPayload);
  if (upQError) throw dbError(upQError);

  const existingOptions = existingQ?.answer_options || [];
  const existingOptionIds = existingOptions.map((o) => o.answer_option_id);
  const payloadOptionIds = (payloadQ.options || []).map((o) => o.answer_option_id).filter(Boolean);

  const optionIdsToDelete = existingOptionIds.filter(
    (oid) => !payloadOptionIds.includes(oid)
  );
  if (optionIdsToDelete.length > 0) {
    const { error: delOptError } = await dao.deleteOptions(optionIdsToDelete);
    if (delOptError) throw dbError(delOptError);
  }

  const optionsToInsert = [];
  for (let idx = 0; idx < (payloadQ.options || []).length; idx++) {
    const opt = payloadQ.options[idx];
    const optPayload = {
      option_text: opt.option_text,
      is_correct: !!opt.is_correct,
      display_order: opt.display_order ?? idx + 1,
    };

    if (opt.answer_option_id) {
      const existingOpt = existingOptions.find((eo) => eo.answer_option_id === opt.answer_option_id);
      const hasChanged = !existingOpt ||
        existingOpt.option_text !== optPayload.option_text ||
        !!existingOpt.is_correct !== !!optPayload.is_correct ||
        existingOpt.display_order !== optPayload.display_order;

      if (hasChanged) {
        const { error: upOptError } = await dao.updateOption(opt.answer_option_id, optPayload);
        if (upOptError) throw dbError(upOptError);
      }
    } else {
      optionsToInsert.push({
        ...optPayload,
        question_id: payloadQ.question_id,
      });
    }
  }
  if (optionsToInsert.length > 0) {
    const { error: insOptError } = await dao.createOptions(optionsToInsert);
    if (insOptError) throw dbError(insOptError);
  }
}

async function insertNewQuestion(studySetId, teacherId, payloadQ) {
  const qPayload = {
    question_text: payloadQ.question_text,
    explanation: payloadQ.explanation || null,
    chapter: payloadQ.chapter || null,
  };

  const { data: newQ, error: insQError } = await dao.creationQuestions([
    {
      study_set_id: studySetId,
      owner_id: teacherId,
      ...qPayload,
    },
  ]);
  if (insQError) throw dbError(insQError);

  const insertedQuestionId = newQ[0].question_id;
  if (payloadQ.options && payloadQ.options.length > 0) {
    const optionsPayload = payloadQ.options.map((opt, idx) => ({
      question_id: insertedQuestionId,
      option_text: opt.option_text,
      is_correct: !!opt.is_correct,
      display_order: opt.display_order ?? idx + 1,
    }));
    const { error: insOptError } = await dao.createOptions(optionsPayload);
    if (insOptError) throw dbError(insOptError);
  }
}

async function syncQuestions(id, teacherId, existingQuestions, payloadQuestions) {
  const existingQuestionIds = existingQuestions.map((q) => q.question_id);
  const payloadQuestionIds = payloadQuestions.map((q) => q.question_id).filter(Boolean);

  const questionIdsToDelete = existingQuestionIds.filter(
    (qid) => !payloadQuestionIds.includes(qid)
  );
  if (questionIdsToDelete.length > 0) {
    const { error: delQError } = await dao.deleteQuestions(questionIdsToDelete);
    if (delQError) throw dbError(delQError);
  }

  for (let i = 0; i < payloadQuestions.length; i++) {
    const q = payloadQuestions[i];
    if (q.question_id) {
      const existingQ = existingQuestions.find((eq) => eq.question_id === q.question_id);
      await updateSingleQuestion(existingQ, q);
    } else {
      await insertNewQuestion(id, teacherId, q);
    }
  }

  const activeQuestions = payloadQuestions.length;
  await dao.updateQuestionCount(id, activeQuestions);
}

async function updateAssignments(id, teacherId, classId, changes, currentTitle) {
  const { visibility, notifyLearners, notify_learners } = changes;

  if (visibility === "class_only" || classId) {
    const { error: delAssignError } = await dao.deleteAssignments(id);
    if (delAssignError) throw dbError(delAssignError);

    const targetClassIds = Array.isArray(classId)
      ? classId
      : classId
        ? [classId]
        : [];

    if (targetClassIds.length > 0) {
      const assignments = targetClassIds.map((cid) => ({
        study_set_id: id,
        class_id: cid,
        assigned_by: teacherId,
      }));
      const { error: assignError } = await dao.assignToClass(assignments);
      if (assignError) throw dbError(assignError);

      notifyAssignment(targetClassIds, { study_set_id: id, title: currentTitle }, {
        notify: shouldNotify({ notifyLearners, notify_learners }),
      });
    }
  } else if (visibility && visibility !== "class_only") {
    const { error: delAssignError } = await dao.deleteAssignments(id);
    if (delAssignError) throw dbError(delAssignError);
  }
}

// Cập nhật study set
export async function update(id, teacherId, changes) {
  const { data: studySet, error: fetchError } = await dao.findById(id);
  if (fetchError || !studySet) {
    throw notFound();
  }
  if (studySet.teacher_id !== teacherId) {
    throw Object.assign(new Error("Forbidden"), { status: 403 });
  }

  // Load questions for the study set to support question/option diff updates
  const { data: questionsData, error: qError } = await dao.listQuestionByStudySet(id);
  if (qError) {
    throw dbError(qError, 500);
  }
  const set = {
    ...studySet,
    questions: questionsData || [],
  };

  // Pull notification-only fields out of `changes` so they are never written
  // to study_sets columns (they are not columns) in metadataChanges below.
  const {
    questions,
    classId,
    questionBankId,
    notifyLearners,
    notify_learners,
    instructions: assignInstructions,
    dueAt: assignDueAt,
    due_at: assignDueAtSnake,
    ...metadataChanges
  } = changes;

  if (questionBankId !== undefined) {
    metadataChanges.source_question_bank_id = questionBankId;
  }

  let data = set;
  if (Object.keys(metadataChanges).length > 0) {
    const { data: updatedData, error } = await dao.update(id, metadataChanges);
    if (error) {
      throw dbError(error);
    }
    data = updatedData;
  }

  // 1. Update classroom assignments and send notifications
  await updateAssignments(id, teacherId, classId, {
    visibility: changes.visibility,
    notifyLearners,
    notify_learners,
  }, data.title || set.title);

  // 2. Synchronize questions and options if provided in the changes payload
  if (questions) {
    await syncQuestions(id, teacherId, set.questions || [], questions);
    data.question_count = questions.length;
  }

  return data;
}

// Xóa
export async function remove(id, teacherId) {
  const { data: set, error: fetchError } = await dao.findById(id);
  if (fetchError || !set) {
    throw notFound();
  }
  if (set.teacher_id !== teacherId) {
    throw Object.assign(new Error("Forbidden"), { status: 403 });
  }

  const { error } = await dao.remove(id);
  if (error) {
    throw dbError(error);
  }
}

// Bắt đầu session
export async function startSession(user, studySetId, mode) {
  const userId = user.user_id || user.id;

  const studySet = await getOne(studySetId, user);
  const normalizedMode =
    mode === "flashcards" || mode === "flashcard" ? "flashcard" : "quiz";
  const questions = studySet.questions || [];
  if (questions.length === 0) {
    throw Object.assign(new Error("No questions available for quiz mode."), { status: 400 });
  }
  const maxScore = questions.length;
  const { data, error } = await dao.createAttempt({
    learner_id: userId,
    study_set_id: studySetId,
    mode: normalizedMode,
    status: "in_progress",
    total_score: 0,
    max_score: normalizedMode === "quiz" ? maxScore : 0,
    started_at: new Date().toISOString(),
  });
  if (error) {
    throw dbError(error);
  }
  return data;
}


// List lịch sử làm của học sinh nào đó
export async function listMySessions(learnerId) {
  const { data, error } = await dao.listAttemptsByLearner(learnerId);

  if (error) {
    throw dbError(error, 500);
  }
  return data;
}

// Nộp câu trả lời
export async function submitAnswer(sessionId, payload) {
  const session = await dao.findAttemptById(sessionId);
  if (session.error || !session.data) {
    throw notFound("Practice session not found");
  }
  let isCorrect = payload.is_correct ?? false;
  let scoreAwarded = payload.score_awarded ?? 0;
  let reviewStatus = payload.review_status || "unreviewed";
  const selectedIds = payload.selected_answer_option_ids || [];
  if (session.data.mode === "quiz") {
    const { data: correctOpts, error: optErr } = await dao.getCorrectOptions(payload.question_id);
    if (optErr) {
      throw dbError(optErr);
    }
    const correctIds = (correctOpts || []).map((o) => o.answer_option_id);

    isCorrect =
      selectedIds.length === correctIds.length &&
      selectedIds.every((id) => correctIds.includes(id));

    scoreAwarded = isCorrect ? 1 : 0;
    reviewStatus = isCorrect ? "mastered" : "marked_for_retry";
  }
  const answerPayload = {
    practice_attempt_id: sessionId,
    question_id: payload.question_id,
    selected_answer_option_ids: selectedIds,
    selected_exam_option_indexes: payload.selected_exam_option_indexes || [],
    is_correct: isCorrect,
    score_awarded: scoreAwarded,
    review_status: reviewStatus,
    answered_at: new Date().toISOString(),
  };

  const { data: existing, error: existingError } = await dao.findAttemptAnswer(sessionId, payload.question_id);
  if (existingError) {
    throw dbError(existingError);
  }

  let result;
  if (existing) {
    const { data, error } = await dao.updateAttemptAnswer(existing.attempt_answer_id, answerPayload);
    if (error) throw dbError(error);
    result = data;
  } else {
    const { data, error } = await dao.insertAttemptAnswer(answerPayload);
    if (error) {
      // If a concurrent request inserted the row in the meantime, retry by updating it
      if (error.code === "23505") {
        const { data: existingRetry, error: retryFetchError } = await dao.findAttemptAnswer(sessionId, payload.question_id);
        if (!retryFetchError && existingRetry) {
          const { data: updateData, error: updateError } = await dao.updateAttemptAnswer(existingRetry.attempt_answer_id, answerPayload);
          if (!updateError) {
            return updateData;
          }
        }
      }
      throw dbError(error);
    }
    result = data;
  }
  return result;
}

// Hoàn thành session
export async function completeSession(sessionId) {
  const { data: answers, error: answersErr } = await dao.listAnswersByAttempt(sessionId);
  if (answersErr) {
    throw dbError(answersErr, 500);
  }
  const totalScore = (answers || []).reduce((sum, ans) => {
    return sum + (ans.is_correct ? (parseFloat(ans.score_awarded) || 0) : 0);
  }, 0);
  const { data, error } = await dao.updateAttempt(sessionId, {
    total_score: totalScore,
    submitted_at: new Date().toISOString(),
    status: "submitted",
  });
  if (error) {
    throw dbError(error);
  }
  return data;
}

// Xem kết quả
export async function getSessionResults(sessionId) {
  const session = await dao.findAttemptById(sessionId);
  if (session.error || !session.data) {
    throw notFound("Practice session not found");
  }

  const { data, error } = await dao.listAnswersByAttempt(sessionId);
  if (error) {
    throw dbError(error, 500);
  }
  return { session: session.data, answers: data };
}


// ── Admin moderation (UC-53 / §3.9.3) ──────────────────────────────────────

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
      `title.ilike.%${keyword}%,description.ilike.%${keyword}%,topic.ilike.%${keyword}%`,
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

export async function generateAnswerExplanation(user, sessionId, questionId) {
  const learnerId = user.user_id || user.id;

  const session = await dao.findAttemptById(sessionId);
  if (session.error || !session.data) {
    throw notFound("Practice session not found");
  }

  if (session.data.learner_id !== learnerId) {
    throw accessDenied("You do not have permission to access this practice session.");
  }

  if (session.data.mode !== "quiz") {
    throw serviceError("AI explanations are only available for quiz results.", 400);
  }

  const { data: answers, error: answersErr } = await dao.listAnswersByAttempt(sessionId);
  if (answersErr) {
    throw dbError(answersErr, 500);
  }

  if (session.data.status !== "submitted" && !(answers || []).length) {
    throw serviceError("Complete the quiz before requesting AI explanations.", 400);
  }

  await requirePremiumLearner(learnerId);

  const studySet = await getOne(session.data.study_set_id, user);
  const question = (studySet.questions || []).find((item) => item.question_id === questionId);
  if (!question) {
    throw notFound("Question not found in this quiz session");
  }

  const sortedQuestion = {
    ...question,
    answer_options: [...(question.answer_options || [])].sort(
      (left, right) => (left.display_order || 0) - (right.display_order || 0),
    ),
  };
  const attemptAnswer = (answers || []).find((answer) => answer.question_id === questionId);
  const { aiExplanation } = await aiService.generateAnswerExplanation({
    studySet,
    question: sortedQuestion,
    attemptAnswer,
  });

  return { aiExplanation };
}

async function getLearnerRelations(learnerId) {
  const [membershipsRes, attemptsRes, ownedRes] = await Promise.all([
    dao.getLearnerClassMemberships(learnerId),
    dao.getPracticeAttempts(learnerId),
    dao.getOwnedStudySetIds(learnerId)
  ]);

  if (membershipsRes.error) throw dbError(membershipsRes.error, 500);
  if (attemptsRes.error) throw dbError(attemptsRes.error, 500);
  if (ownedRes.error) throw dbError(ownedRes.error, 500);

  let assignedStudySets = [];
  const memberships = membershipsRes.data;
  if (memberships && memberships.length > 0) {
    const classIds = memberships.map((m) => m.class_id);
    const { data: assignments, error: assignError } = await dao.getAssignmentsByClassIds(classIds);
    if (assignError) throw dbError(assignError, 500);
    assignedStudySets = (assignments || []).filter(
      (a) => a.classes?.teacher_id !== learnerId
    );
  }

  return {
    assignedStudySets,
    attempts: attemptsRes.data || [],
    ownedIds: (ownedRes.data || []).map((o) => o.study_set_id)
  };
}

function buildLearnerMaps(assignedStudySets, attempts) {
  const assignedMap = new Map();
  assignedStudySets.forEach((a) => {
    assignedMap.set(a.study_set_id, {
      class_id: a.class_id,
      class_name: a.classes?.class_name || "Class",
    });
  });

  const startedMap = new Map();
  (attempts || []).forEach((att) => {
    const current = startedMap.get(att.study_set_id);
    if (!current || new Date(att.started_at) > new Date(current.started_at)) {
      startedMap.set(att.study_set_id, { 
        started_at: att.started_at,
        status: att.status
      });
    }
  });

  return { assignedMap, startedMap };
}

function formatLearnerSets(studySets, learnerId, assignedMap, startedMap) {
  return studySets.map((set) => {
    const assignment = assignedMap.get(set.study_set_id);
    const attempt = startedMap.get(set.study_set_id);
    const isOwned = set.teacher_id === learnerId;

    let sourceType = "public-started";
    if (assignment) {
      sourceType = "assigned";
    } else if (isOwned) {
      sourceType = "owned";
    }

    return {
      ...set,
      is_assigned: !!assignment,
      assigned_class: assignment || null,
      is_started: !!attempt,
      is_owned: isOwned,
      last_studied_at: attempt ? attempt.started_at : null,
      study_status: attempt ? attempt.status : null,
      source_type: sourceType,
    };
  });
}

export async function listLearnerStudySets(learnerId) {
  const { assignedStudySets, attempts, ownedIds } = await getLearnerRelations(learnerId);

  const { assignedMap, startedMap } = buildLearnerMaps(assignedStudySets, attempts);

  const allIds = [
    ...new Set([
      ...assignedMap.keys(),
      ...startedMap.keys(),
      ...ownedIds,
    ]),
  ];

  if (allIds.length === 0) return [];
  const { data: studySets, error: fetchError } =
    await dao.getStudySetsByIds(allIds);
  if (fetchError) throw dbError(fetchError, 500);

  return formatLearnerSets(studySets, learnerId, assignedMap, startedMap);
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
  if (studySet.visibility === "private" || studySet.visibility === "class_only") {
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
