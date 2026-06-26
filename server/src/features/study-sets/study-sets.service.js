import { GoogleGenAI } from "@google/genai";
import * as dao from "./study-sets.dao.js";
import { env } from "../../config/env.js";
import { buildPaginatedResponse } from "../../utils/pagination.js";
import { notifyStudySetAssigned } from "../../utils/notification.service.js";
import { logger } from "../../utils/logger.js";

const premiumRequiredMessage = "AI explanations are available for Premium accounts only. Please upgrade to continue.";
const aiUnavailableMessage = "AI processing is currently unavailable. Please try again later.";

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
async function notifyAssignment(targetClassIds, studySetTitle, options = {}) {
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
      studySetTitle,
      className,
      instructions: options.instructions,
      dueAt: options.dueAt,
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

function formatOptionList(options = []) {
  return options
    .map((option, index) => {
      const letter = String.fromCharCode(65 + index);
      return `${letter}. ${option.option_text}`;
    })
    .join("\n");
}

function formatSelectedOptions(options = [], selectedOptionIds = []) {
  if (!selectedOptionIds.length) return "No answer selected.";

  const selected = options.filter((option) => selectedOptionIds.includes(option.answer_option_id));
  if (!selected.length) return "No matching selected answer found.";

  return formatOptionList(selected);
}

function buildAnswerExplanationPrompt({ studySet, question, attemptAnswer }) {
  const options = question.answer_options || [];
  const correctOptions = options.filter((option) => option.is_correct);

  return [
    "You are helping a learner understand a quiz answer.",
    "Explain the answer clearly and briefly. Use the same language as the question or existing explanation.",
    "Do not mention that you are an AI. Do not use markdown tables.",
    "",
    "Study set context:",
    `Title: ${studySet.title || "Untitled"}`,
    `Description: ${studySet.description || "No description"}`,
    `Subject: ${studySet.subject || "Not specified"}`,
    `Topic: ${studySet.topic || "Not specified"}`,
    `Tags: ${(studySet.tags || []).join(", ") || "None"}`,
    "",
    "Question:",
    question.question_text,
    "",
    "Answer options:",
    formatOptionList(options),
    "",
    "Correct answer:",
    formatOptionList(correctOptions),
    "",
    "Learner selected answer:",
    formatSelectedOptions(options, attemptAnswer?.selected_answer_option_ids || []),
    "",
    "Existing explanation:",
    question.explanation || "No existing explanation.",
    "",
    "Return one concise explanation paragraph plus, if helpful, one short sentence about why the selected answer is right or wrong.",
  ].join("\n");
}

async function requirePremiumLearner(userId) {
  const { data, error } = await dao.getUserPremiumStatus(userId);
  if (error) {
    throw dbError(error, 500);
  }

  if (!data?.is_premium) {
    throw serviceError(premiumRequiredMessage, 403);
  }
}

async function callGeminiForAnswerExplanation(prompt) {
  if (!env.geminiApiKey) {
    throw serviceError(aiUnavailableMessage, 503);
  }

  try {
    const ai = new GoogleGenAI({ apiKey: env.geminiApiKey });
    const response = await ai.models.generateContent({
      model: env.geminiModel,
      contents: [{ text: prompt }],
      config: {
        temperature: 0.2,
      },
    });

    const aiExplanation = String(response.text || "").trim();
    if (!aiExplanation) {
      throw serviceError(aiUnavailableMessage, 502);
    }

    return aiExplanation;
  } catch (error) {
    if (error.status || error.statusCode) throw error;
    throw serviceError(aiUnavailableMessage, 502);
  }
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

  const { data, error, count, page, limit } = await dao.findByTeacher(teacherId, filters);
  if (error) {
    throw dbError(error, 500);
  }

  const items = (data || []).map((set) => {
    const assignedClassIds = (set.study_set_assignments || [])
      .map((a) => a.classes?.class_name)
      .filter(Boolean);

    const setCopy = { ...set };
    delete setCopy.study_set_assignments;

    return {
      ...setCopy,
      assigned_class_ids: assignedClassIds,
      assignedClassIds: assignedClassIds,
    };
  });

  return {
    items,
    pagination: {
      page,
      limit,
      total: count ?? items.length,
      totalPages: count ? Math.ceil(count / limit) : 1,
    },
  };
}

// List study set public hoặc thuộc 1 lớp
export async function listAvailable(classId) {
  const { data, error } = await dao.findPublic({ classId });
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

  const { data, error, count, page, limit } = await dao.findPublicStudySets(filters);
  if (error) {
    throw dbError(error, 500);
  }

  return buildPaginatedResponse({
    items: data || [],
    count,
    page,
    limit,
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
  }
  const { data: questions, error: qError } =
    await dao.listQuestionByStudySet(id);
  if (qError) {
    throw dbError(qError, 500);
  }
  return {
    ...studySet,
    questions: questions || [],
  };
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

  if (questions && questions.length > 0) {
    const questionsPayload = questions.map((q) => ({
      study_set_id: studySet.study_set_id,
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
      studySet.study_set_id,
      insertedQuestions.length,
    );
    studySet.question_count = insertedQuestions.length;
  }

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

    notifyAssignment(targetClassIds, studySet.title, {
      notify: shouldNotify(payload),
      instructions: payload.instructions,
      dueAt: payload.dueAt ?? payload.due_at,
    });
  }

  return studySet;
}

// Cập nhật study set
export async function update(id, teacherId, changes) {
  const set = await getOne(id);
  if (set.teacher_id !== teacherId) {
    throw Object.assign(new Error("Forbidden"), { status: 403 });
  }

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
  if (changes.visibility === "class_only" || classId) {
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
      if (assignError) {
        throw dbError(assignError);
      }

      notifyAssignment(targetClassIds, set.title, {
        notify: shouldNotify({ notifyLearners, notify_learners }),
        instructions: assignInstructions,
        dueAt: assignDueAt ?? assignDueAtSnake,
      });
    }
  } else if (changes.visibility && changes.visibility !== "class_only") {
    const { error: delAssignError } = await dao.deleteAssignments(id);
    if (delAssignError) throw dbError(delAssignError);
  }
  if (questions) {
    const existingQuestions = set.questions || [];
    const existingQuestionIds = existingQuestions.map((q) => q.question_id);
    const payloadQuestionIds = questions.map((q) => q.question_id).filter(Boolean);
    const questionIdsToDelete = existingQuestionIds.filter(
      (qid) => !payloadQuestionIds.includes(qid)
    );
    if (questionIdsToDelete.length > 0) {
      const { error: delQError } = await dao.deleteQuestions(questionIdsToDelete);
      if (delQError) throw dbError(delQError);
    }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const qPayload = {
        question_text: q.question_text,
        explanation: q.explanation || null,
        chapter: q.chapter || null,
        score: q.score ?? 1,
      };
      if (q.question_id) {
        const { error: upQError } = await dao.updateQuestion(q.question_id, qPayload);
        if (upQError) throw dbError(upQError);
        const existingQ = existingQuestions.find((eq) => eq.question_id === q.question_id);
        const existingOptions = existingQ?.answer_options || [];
        const existingOptionIds = existingOptions.map((o) => o.answer_option_id);
        const payloadOptionIds = (q.options || []).map((o) => o.answer_option_id).filter(Boolean);
        const optionIdsToDelete = existingOptionIds.filter(
          (oid) => !payloadOptionIds.includes(oid)
        );
        if (optionIdsToDelete.length > 0) {
          const { error: delOptError } = await dao.deleteOptions(optionIdsToDelete);
          if (delOptError) throw dbError(delOptError);
        }
        const optionsToInsert = [];
        for (let idx = 0; idx < (q.options || []).length; idx++) {
          const opt = q.options[idx];
          const optPayload = {
            option_text: opt.option_text,
            is_correct: !!opt.is_correct,
            display_order: opt.display_order ?? idx + 1,
          };
          if (opt.answer_option_id) {
            const { error: upOptError } = await dao.updateOption(opt.answer_option_id, optPayload);
            if (upOptError) throw dbError(upOptError);
          } else {
            optionsToInsert.push({
              ...optPayload,
              question_id: q.question_id,
            });
          }
        }
        if (optionsToInsert.length > 0) {
          const { error: insOptError } = await dao.createOptions(optionsToInsert);
          if (insOptError) throw dbError(insOptError);
        }
      } else {
        const { data: newQ, error: insQError } = await dao.creationQuestions([
          {
            study_set_id: id,
            owner_id: teacherId,
            ...qPayload,
          },
        ]);
        if (insQError) throw dbError(insQError);
        const insertedQuestionId = newQ[0].question_id;
        if (q.options && q.options.length > 0) {
          const optionsPayload = q.options.map((opt, idx) => ({
            question_id: insertedQuestionId,
            option_text: opt.option_text,
            is_correct: !!opt.is_correct,
            display_order: opt.display_order ?? idx + 1,
          }));
          const { error: insOptError } = await dao.createOptions(optionsPayload);
          if (insOptError) throw dbError(insOptError);
        }
      }
    }
    const activeQuestions = questions.length;
    await dao.updateQuestionCount(id, activeQuestions);
    data.question_count = activeQuestions;
  }
  return data;
}

// Xóa
export async function remove(id, teacherId) {
  const set = await getOne(id);
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
  const maxScore = questions.reduce((sum, q) => sum + (parseFloat(q.score) || 1), 0);
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

    scoreAwarded = isCorrect ? (payload.score_awarded ?? 1) : 0;
    reviewStatus = isCorrect ? "mastered" : "marked_for_retry";
  }
  const { data, error } = await dao.recordAnswer({
    practice_attempt_id: sessionId,
    question_id: payload.question_id,
    selected_answer_option_ids: selectedIds,
    selected_exam_option_indexes: payload.selected_exam_option_indexes || [],
    is_correct: isCorrect,
    score_awarded: scoreAwarded,
    review_status: reviewStatus,
    answered_at: new Date().toISOString(),
  });
  if (error) {
    throw dbError(error);
  }
  return data;
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
  const prompt = buildAnswerExplanationPrompt({
    studySet,
    question: sortedQuestion,
    attemptAnswer,
  });
  const aiExplanation = await callGeminiForAnswerExplanation(prompt);

  return { aiExplanation };
}

export async function listLearnerStudySets(learnerId) {
  const { data: memberships, error: memberError } =
    await dao.getLearnerClassMemberships(learnerId);
  if (memberError) throw dbError(memberError, 500);
  let assignedStudySets = [];
  if (memberships && memberships.length > 0) {
    const classIds = memberships.map((m) => m.class_id);

    const { data: assignments, error: assignError } =
      await dao.getAssignmentsByClassIds(classIds);
    if (assignError) throw dbError(assignError, 500);
    assignedStudySets = assignments || [];
  }
  const { data: attempts, error: attemptError } =
    await dao.getPracticeAttempts(learnerId);
  if (attemptError) throw dbError(attemptError, 500);

  const { data: ownedSets, error: ownedError } =
    await dao.getOwnedStudySetIds(learnerId);
  if (ownedError) throw dbError(ownedError, 500);

  const assignedMap = new Map();
  assignedStudySets.forEach((a) => {
    assignedMap.set(a.study_set_id, {
      class_id: a.class_id,
      class_name: a.classes?.class_name || "Lớp học",
    });
  });
  const startedMap = new Map();
  (attempts || []).forEach((att) => {
    const current = startedMap.get(att.study_set_id);
    if (!current || new Date(att.started_at) > new Date(current.started_at)) {
      startedMap.set(att.study_set_id, { started_at: att.started_at });
    }
  });

  const ownedIds = (ownedSets || []).map((o) => o.study_set_id);

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
      source_type: sourceType,
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
    studySet.is_admin_hidden ||
    studySet.visibility === "hidden" ||
    studySet.visibility === "archived"
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
