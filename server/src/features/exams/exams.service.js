import { randomBytes } from "crypto";

import supabase, { supabaseAdmin } from "../../config/supabase.js";
import { createUserModel } from "../../models/user.model.js";
import { ExamResultVisibility, ExamSessionStatus } from "../../models/exam.model.js";
import {
  deleteExamSession,
  findManagedActiveClass,
  findOwnedQuestionBank,
  insertExamQuestions,
  insertExamSession,
  listQuestionBankSourceQuestions,
  listTeacherExamSessions,
} from "./exams.dao.js";

const db = supabaseAdmin ?? supabase;
const userModel = createUserModel(db);

const allowedStatuses = new Set([ExamSessionStatus.DRAFT, ExamSessionStatus.PUBLISHED]);
const allowedResultVisibility = new Set([
  ExamResultVisibility.COMPLETION_ONLY,
  ExamResultVisibility.SCORE_ONLY,
]);

function serviceError(message, statusCode = 400, fields) {
  const error = new Error(message);
  error.status = statusCode;
  error.statusCode = statusCode;
  error.fields = fields;
  return error;
}

function requireUserId(userId) {
  if (!userId) {
    throw serviceError("Authenticated teacher is required", 401);
  }
}

async function requireActiveTeacher(userId) {
  requireUserId(userId);

  const profile = await userModel.findById(userId);

  if (!profile || profile.deleted_at) {
    throw serviceError("You do not have permission to access or perform this action.", 403);
  }

  if (profile.account_status !== "active" || profile.active_role !== "teacher") {
    throw serviceError("You do not have permission to access or perform this action.", 403);
  }

  return profile;
}

function normalizeText(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function normalizeNullableText(value) {
  const normalized = normalizeText(value);
  return normalized || null;
}

function normalizePositiveInteger(value, fieldName, errors) {
  const number = Number(value);

  if (!Number.isInteger(number) || number <= 0) {
    errors[fieldName] = "Please enter a positive whole number.";
    return null;
  }

  return number;
}

function normalizeOptionalDate(value, fieldName, errors) {
  const normalized = normalizeText(value);
  if (!normalized) return null;

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    errors[fieldName] = "Please enter a valid date and time.";
    return null;
  }

  return parsed.toISOString();
}

function normalizeStatus(value, errors) {
  const normalized = normalizeText(value || ExamSessionStatus.DRAFT).toLowerCase();

  if (!allowedStatuses.has(normalized)) {
    errors.status = "Status must be draft or published.";
    return ExamSessionStatus.DRAFT;
  }

  return normalized;
}

function normalizeResultVisibility(value, errors) {
  const normalized = normalizeText(value || ExamResultVisibility.SCORE_ONLY).toLowerCase();

  if (!allowedResultVisibility.has(normalized)) {
    errors.result_visibility = "Result visibility is invalid.";
    return ExamResultVisibility.SCORE_ONLY;
  }

  return normalized;
}

function buildAccessCode(value) {
  const normalized = normalizeText(value).toUpperCase().replace(/[^A-Z0-9-]/g, "");
  return normalized || `EXAM-${randomBytes(4).toString("hex").toUpperCase()}`;
}

function assertValidTimeWindow({ status, startAt, endAt, errors }) {
  if (status === ExamSessionStatus.PUBLISHED && (!startAt || !endAt)) {
    errors.start_at = errors.start_at || "Start time is required to publish an exam.";
    errors.end_at = errors.end_at || "End time is required to publish an exam.";
    return;
  }

  if (!startAt && !endAt) return;

  if (!startAt || !endAt) {
    errors.start_at = errors.start_at || "Start and end time must be provided together.";
    errors.end_at = errors.end_at || "Start and end time must be provided together.";
    return;
  }

  const startTime = new Date(startAt).getTime();
  const endTime = new Date(endAt).getTime();

  if (endTime <= startTime) {
    errors.end_at = "End time must be later than start time.";
  }

  if (status === ExamSessionStatus.PUBLISHED && startTime < Date.now()) {
    errors.start_at = "Start time cannot be in the past.";
  }
}

function validateSourceQuestion(question) {
  const options = [...(question.answer_options ?? [])].sort(
    (left, right) => left.display_order - right.display_order
  );
  const correctCount = options.filter((option) => option.is_correct).length;

  if (question.question_type === "multiple_choice") {
    return options.length >= 2 && correctCount >= 1;
  }

  if (question.question_type === "true_false") {
    return options.length === 2 && correctCount === 1;
  }

  return false;
}

function shuffleItems(items) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

function getOrderedAnswerOptions(question, shouldRandomizeAnswers) {
  const orderedOptions = [...(question.answer_options ?? [])].sort(
    (left, right) => left.display_order - right.display_order
  );

  return shouldRandomizeAnswers ? shuffleItems(orderedOptions) : orderedOptions;
}

function toExamQuestionRows(examSessionId, sourceQuestions, shouldRandomizeAnswers) {
  return sourceQuestions.map((question, index) => {
    const orderedOptions = getOrderedAnswerOptions(question, shouldRandomizeAnswers);
    const answerOptions = orderedOptions.map((option, optionIndex) => ({
      index: optionIndex,
      text: option.option_text,
    }));

    const correctOptionIndexes = orderedOptions
      .map((option, optionIndex) => (option.is_correct ? optionIndex : null))
      .filter((optionIndex) => optionIndex !== null);

    return {
      exam_session_id: examSessionId,
      source_question_id: question.question_id,
      question_text: question.question_text,
      question_type: question.question_type,
      score: question.score,
      explanation: question.explanation || null,
      subject: question.subject || null,
      topic: question.topic || null,
      chapter: question.chapter || null,
      lesson: question.lesson || null,
      difficulty: question.difficulty || null,
      answer_options_json: answerOptions,
      correct_option_indexes: correctOptionIndexes,
      display_order: index + 1,
    };
  });
}

function selectSourceQuestions(questions, requestedCount, shouldRandomize) {
  const candidates = shouldRandomize ? shuffleItems(questions) : questions;
  return candidates.slice(0, requestedCount);
}

function normalizeCreatePayload(payload = {}) {
  const errors = {};
  const title = normalizeText(payload.title);
  const classId = normalizeText(payload.class_id);
  const questionBankId = normalizeText(payload.question_bank_id);
  const status = normalizeStatus(payload.status, errors);
  const startAt = normalizeOptionalDate(payload.start_at, "start_at", errors);
  const endAt = normalizeOptionalDate(payload.end_at, "end_at", errors);
  const durationMinutes = normalizePositiveInteger(payload.duration_minutes, "duration_minutes", errors);
  const attemptLimit = normalizePositiveInteger(payload.attempt_limit ?? 1, "attempt_limit", errors);
  const questionCount = normalizePositiveInteger(payload.question_count, "question_count", errors);
  const resultVisibility = normalizeResultVisibility(payload.result_visibility, errors);

  if (!title) errors.title = "Exam title is required.";
  if (!classId) errors.class_id = "Class is required.";
  if (!questionBankId) errors.question_bank_id = "Question bank is required.";

  assertValidTimeWindow({ status, startAt, endAt, errors });

  if (Object.keys(errors).length > 0) {
    throw serviceError("The information is invalid. Please check and try again.", 400, errors);
  }

  return {
    class_id: classId,
    question_bank_id: questionBankId,
    title,
    description: normalizeNullableText(payload.description),
    status,
    start_at: startAt,
    end_at: endAt,
    duration_minutes: durationMinutes,
    attempt_limit: attemptLimit,
    question_count: questionCount,
    randomize_questions: payload.randomize_questions === undefined ? true : Boolean(payload.randomize_questions),
    randomize_answers: payload.randomize_answers === undefined ? true : Boolean(payload.randomize_answers),
    result_visibility: resultVisibility,
    access_code: normalizeNullableText(payload.access_code),
  };
}

export async function listMine(teacherId, filters = {}) {
  if (!teacherId) {
    const error = new Error("Authenticated teacher is required");
    error.status = 401;
    throw error;
  }

  return listTeacherExamSessions(teacherId, filters);
}

export async function createExamSession(teacherId, payload = {}) {
  await requireActiveTeacher(teacherId);

  const normalized = normalizeCreatePayload(payload);
  const [managedClass, questionBank] = await Promise.all([
    findManagedActiveClass(normalized.class_id, teacherId),
    findOwnedQuestionBank(normalized.question_bank_id, teacherId),
  ]);

  const errors = {};

  if (!managedClass) {
    errors.class_id = "Select one of your active classes.";
  }

  if (!questionBank) {
    errors.question_bank_id = "Select one of your available question banks.";
  }

  if (Object.keys(errors).length > 0) {
    throw serviceError("The information is invalid. Please check and try again.", 400, errors);
  }

  const sourceQuestions = await listQuestionBankSourceQuestions(normalized.question_bank_id);
  const validQuestions = sourceQuestions.filter(validateSourceQuestion);

  if (validQuestions.length === 0) {
    errors.question_bank_id = "The selected question bank does not contain valid active questions.";
  }

  if (normalized.question_count > validQuestions.length) {
    errors.question_count = `Only ${validQuestions.length} valid questions are available in this question bank.`;
  }

  if (Object.keys(errors).length > 0) {
    throw serviceError("The information is invalid. Please check and try again.", 400, errors);
  }

  const shouldCreateAccessCode = normalized.access_code || normalized.status === ExamSessionStatus.PUBLISHED;
  const accessCode = shouldCreateAccessCode ? buildAccessCode(normalized.access_code) : null;

  const examSession = await insertExamSession({
    ...normalized,
    access_code: accessCode,
    teacher_id: teacherId,
  });

  try {
    const selectedQuestions = selectSourceQuestions(
      validQuestions,
      normalized.question_count,
      normalized.randomize_questions
    );
    const examQuestions = await insertExamQuestions(
      toExamQuestionRows(examSession.exam_session_id, selectedQuestions, normalized.randomize_answers)
    );

    return {
      ...examSession,
      question_bank: questionBank,
      classes: managedClass,
      exam_questions_count: examQuestions.length,
    };
  } catch (error) {
    await deleteExamSession(examSession.exam_session_id);
    throw error;
  }
}
