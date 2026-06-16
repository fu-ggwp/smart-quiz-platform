import { randomBytes } from "crypto";

import {
  ExamResultVisibility,
  ExamSessionStatus,
  EXAM_SESSION_CONFIG_COLUMNS,
} from "../../models/exam.model.js";
import {
  getAssignedQuestionBank,
  listAssignedQuestionBankQuestions,
} from "../question-banks/question-banks.service.js";
import * as dao from "./exams.dao.js";

const createSavedMessage = "Exam session has been created successfully.";
const settingsSavedMessage = "Exam settings have been updated successfully.";

// Small error helpers keep controller responses consistent.
function dbError(error, status = 400) {
  return Object.assign(new Error(error.message || "Database request failed"), { status });
}

function fail(message, status = 400, fields) {
  return Object.assign(new Error(message), { status, statusCode: status, fields });
}

function notFound(message = "Exam session not found") {
  return fail(message, 404);
}

function requireUser(userId) {
  if (!userId) throw fail("Missing authenticated user.", 401);
}

function text(value) {
  return value === undefined || value === null ? "" : String(value).trim();
}

function nullableText(value) {
  return text(value) || null;
}

function toIso(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toPositiveInt(value, fallback = null) {
  const number = Number(value ?? fallback);
  return Number.isInteger(number) && number > 0 ? number : null;
}

function toBoolean(value, fallback = false) {
  if (value === undefined || value === null) return fallback;
  if (value === "true") return true;
  if (value === "false") return false;
  return Boolean(value);
}

// Teacher can type a code, otherwise generate a short readable one.
function buildAccessCode(value) {
  return text(value).toUpperCase().replace(/[^A-Z0-9-]/g, "") ||
    `EXAM-${randomBytes(4).toString("hex").toUpperCase()}`;
}

// Expired active exams are closed lazily when teacher opens list/detail.
function isExpiredActiveExam(exam, now = Date.now()) {
  if (exam?.status !== ExamSessionStatus.ACTIVE || !exam.end_at) return false;
  const endTime = new Date(exam.end_at).getTime();
  return Number.isFinite(endTime) && endTime <= now;
}

function getNext(exam, changes, field) {
  return Object.prototype.hasOwnProperty.call(changes, field) ? changes[field] : exam[field];
}

function assertTimeWindow(startAt, endAt) {
  if (startAt && endAt && new Date(endAt).getTime() <= new Date(startAt).getTime()) {
    throw fail("End time must be later than start time.", 400, {
      start_at: "End time must be later than start time.",
      end_at: "End time must be later than start time.",
    });
  }
}

// Active exams need the minimum config learners need to start safely.
function assertActivatable(exam, changes) {
  const status = getNext(exam, changes, "status");
  if (status !== ExamSessionStatus.ACTIVE) return;

  const fields = {};
  if (!text(getNext(exam, changes, "title"))) fields.title = "Exam title is required.";
  if (!getNext(exam, changes, "class_id")) fields.class_id = "Class is required.";
  if (!getNext(exam, changes, "question_bank_id")) fields.question_bank_id = "Question bank is required.";
  if (!getNext(exam, changes, "start_at")) fields.start_at = "Start time is required before activating.";
  if (!getNext(exam, changes, "end_at")) fields.end_at = "End time is required before activating.";
  if (!toPositiveInt(getNext(exam, changes, "duration_minutes"))) fields.duration_minutes = "Duration is required.";
  if (!toPositiveInt(getNext(exam, changes, "attempt_limit"))) fields.attempt_limit = "Attempt limit is required.";
  if (!toPositiveInt(getNext(exam, changes, "question_count"))) fields.question_count = "Question count is required.";

  if (Object.keys(fields).length) {
    throw fail("The exam session cannot be activated. Please complete the required configuration.", 400, fields);
  }
}

function normalizeStatus(value, fallback = ExamSessionStatus.DRAFT) {
  const status = text(value || fallback).toLowerCase();
  return [ExamSessionStatus.DRAFT, ExamSessionStatus.ACTIVE].includes(status)
    ? status
    : ExamSessionStatus.DRAFT;
}

function normalizeVisibility(value) {
  const visibility = text(value || ExamResultVisibility.SCORE_ONLY).toLowerCase();
  return Object.values(ExamResultVisibility).includes(visibility)
    ? visibility
    : ExamResultVisibility.SCORE_ONLY;
}

// Only allow columns declared in the exam model to be updated from settings.
function pickConfigChanges(payload = {}) {
  const changes = {};

  for (const field of EXAM_SESSION_CONFIG_COLUMNS) {
    if (payload[field] !== undefined) changes[field] = payload[field];
  }

  if (changes.title !== undefined) changes.title = text(changes.title);
  if (changes.description !== undefined) changes.description = nullableText(changes.description);
  if (changes.access_code !== undefined) changes.access_code = nullableText(changes.access_code);
  if (changes.start_at !== undefined) changes.start_at = toIso(changes.start_at);
  if (changes.end_at !== undefined) changes.end_at = toIso(changes.end_at);
  if (changes.duration_minutes !== undefined) changes.duration_minutes = toPositiveInt(changes.duration_minutes);
  if (changes.attempt_limit !== undefined) changes.attempt_limit = toPositiveInt(changes.attempt_limit);
  if (changes.question_count !== undefined) changes.question_count = toPositiveInt(changes.question_count);
  if (changes.randomize_questions !== undefined) changes.randomize_questions = toBoolean(changes.randomize_questions);
  if (changes.randomize_answers !== undefined) changes.randomize_answers = toBoolean(changes.randomize_answers);
  if (changes.result_visibility !== undefined) changes.result_visibility = normalizeVisibility(changes.result_visibility);
  if (changes.status !== undefined) changes.status = normalizeStatus(changes.status);

  return changes;
}

// Create uses light validation because the frontend already checks most fields.
function normalizeCreatePayload(payload = {}) {
  const normalized = {
    class_id: text(payload.class_id),
    question_bank_id: text(payload.question_bank_id),
    title: text(payload.title),
    description: nullableText(payload.description),
    status: normalizeStatus(payload.status),
    start_at: toIso(payload.start_at),
    end_at: toIso(payload.end_at),
    duration_minutes: toPositiveInt(payload.duration_minutes),
    attempt_limit: toPositiveInt(payload.attempt_limit, 1),
    question_count: toPositiveInt(payload.question_count),
    randomize_questions: toBoolean(payload.randomize_questions, true),
    randomize_answers: toBoolean(payload.randomize_answers, true),
    result_visibility: normalizeVisibility(payload.result_visibility),
    access_code: nullableText(payload.access_code),
  };

  const fields = {};
  if (!normalized.title) fields.title = "Exam title is required.";
  if (!normalized.class_id) fields.class_id = "Class is required.";
  if (!normalized.question_bank_id) fields.question_bank_id = "Question bank is required.";
  if (!normalized.duration_minutes) fields.duration_minutes = "Duration is required.";
  if (!normalized.attempt_limit) fields.attempt_limit = "Attempt limit is required.";
  if (!normalized.question_count) fields.question_count = "Question count is required.";
  if (normalized.status === ExamSessionStatus.ACTIVE && !normalized.start_at) fields.start_at = "Start time is required.";
  if (normalized.status === ExamSessionStatus.ACTIVE && !normalized.end_at) fields.end_at = "End time is required.";

  assertTimeWindow(normalized.start_at, normalized.end_at);
  if (Object.keys(fields).length) throw fail("The information is invalid. Please check and try again.", 400, fields);

  return normalized;
}

// Only snapshot questions that have enough answer data for an exam.
function validQuestion(question) {
  const options = question.answer_options ?? [];
  const correctCount = options.filter((option) => option.is_correct).length;

  if (question.question_type === "multiple_choice") return options.length >= 2 && correctCount >= 1;
  if (question.question_type === "true_false") return options.length === 2 && correctCount === 1;
  return false;
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

// Store a frozen copy so later bank edits do not change this exam.
function toExamQuestionRows(examSessionId, questions, randomizeAnswers) {
  return questions.map((question, index) => {
    const options = [...(question.answer_options ?? [])].sort(
      (left, right) => left.display_order - right.display_order
    );
    const orderedOptions = randomizeAnswers ? shuffle(options) : options;

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
      answer_options_json: orderedOptions.map((option, optionIndex) => ({
        index: optionIndex,
        text: option.option_text,
      })),
      correct_option_indexes: orderedOptions
        .map((option, optionIndex) => (option.is_correct ? optionIndex : null))
        .filter((optionIndex) => optionIndex !== null),
      display_order: index + 1,
    };
  });
}

// List teacher exams and close old active sessions before returning them.
export async function listTeacherExamSessions(teacherId, filters = {}) {
  requireUser(teacherId);

  const { error: closeError } = await dao.closeExpiredTeacherExamSessions(
    teacherId,
    new Date().toISOString()
  );
  if (closeError) throw dbError(closeError, 500);

  const { data, error } = await dao.listTeacherExamSessions(teacherId, filters);
  if (error) throw dbError(error, 500);
  return data;
}

export async function getExamDetail(examSessionId, teacherId) {
  requireUser(teacherId);

  const { data, error } = await dao.findTeacherExamSession(examSessionId, teacherId);
  if (error) throw dbError(error, 500);
  if (!data) throw notFound();

  if (isExpiredActiveExam(data)) {
    const { data: closedExam, error: closeError } = await dao.closeTeacherExamSession(
      examSessionId,
      teacherId,
      new Date().toISOString()
    );
    if (closeError) throw dbError(closeError, 500);
    return closedExam || { ...data, status: ExamSessionStatus.CLOSED };
  }

  return data;
}

// Update the configurable fields from the settings screen.
export async function updateExamSettings(examSessionId, teacherId, payload = {}) {
  const exam = await getExamDetail(examSessionId, teacherId);

  if ([ExamSessionStatus.CLOSED, ExamSessionStatus.ARCHIVED].includes(exam.status)) {
    throw fail("You do not have permission to access or perform this action.", 409);
  }

  const changes = pickConfigChanges(payload);
  if (!Object.keys(changes).length) throw fail("No valid exam settings were provided.", 400);

  assertTimeWindow(getNext(exam, changes, "start_at"), getNext(exam, changes, "end_at"));
  assertActivatable(exam, changes);

  const isActivating = changes.status === ExamSessionStatus.ACTIVE && exam.status !== ExamSessionStatus.ACTIVE;
  if (isActivating && !text(getNext(exam, changes, "access_code"))) {
    changes.access_code = buildAccessCode();
  }

  if (changes.question_count || isActivating) {
    const sourceQuestions = await listAssignedQuestionBankQuestions(teacherId, exam.question_bank_id);
    const count = sourceQuestions.filter(validQuestion).length;

    const nextQuestionCount = Number(getNext(exam, changes, "question_count"));
    if (nextQuestionCount > count) {
      throw fail(`Only ${count} valid questions are available in the selected question bank.`, 400, {
        question_count: `Only ${count} valid questions are available in the selected question bank.`,
      });
    }
  }

  const { data, error } = await dao.updateTeacherExamSessionConfig(examSessionId, teacherId, {
    ...changes,
    updated_at: new Date().toISOString(),
  });

  if (error) throw dbError(error);
  if (!data) throw notFound();
  return { message: settingsSavedMessage, exam: data };
}

// Create an exam and snapshot selected questions into exam_questions.
export async function createExamSession(teacherId, payload = {}) {
  requireUser(teacherId);

  const normalized = normalizeCreatePayload(payload);
  const [classResult, questionBank, sourceQuestions] = await Promise.all([
    dao.findManagedActiveClass(normalized.class_id, teacherId),
    getAssignedQuestionBank(teacherId, normalized.question_bank_id),
    listAssignedQuestionBankQuestions(teacherId, normalized.question_bank_id),
  ]);

  if (classResult.error) throw dbError(classResult.error, 500);
  if (!classResult.data) throw fail("Select one of your active classes.", 400, { class_id: "Select one of your active classes." });

  const questions = (sourceQuestions ?? []).filter(validQuestion);
  if (normalized.question_count > questions.length) {
    throw fail(`Only ${questions.length} valid questions are available in this question bank.`, 400, {
      question_count: `Only ${questions.length} valid questions are available in this question bank.`,
    });
  }

  const accessCode =
    normalized.access_code || normalized.status === ExamSessionStatus.ACTIVE
      ? buildAccessCode(normalized.access_code)
      : null;

  const { data: examSession, error: examError } = await dao.insertExamSession({
    ...normalized,
    access_code: accessCode,
    teacher_id: teacherId,
  });
  if (examError) throw dbError(examError);

  const orderedQuestions = normalized.randomize_questions ? shuffle(questions) : questions;
  const selectedQuestions = orderedQuestions.slice(0, normalized.question_count);
  const { data: examQuestions, error: questionError } = await dao.insertExamQuestions(
    toExamQuestionRows(examSession.exam_session_id, selectedQuestions, normalized.randomize_answers)
  );

  if (questionError) {
    await dao.deleteExamSession(examSession.exam_session_id);
    throw dbError(questionError);
  }

  return {
    ...examSession,
    message: createSavedMessage,
    question_bank: questionBank,
    classes: classResult.data,
    exam_questions_count: examQuestions?.length ?? 0,
  };
}
function filterLearnerExams(items, filters = {}) {
  const search = text(filters.search).toLowerCase();
  const classId = text(filters.classId);

  return items.filter((exam) => {
    const matchesSearch =
      !search ||
      text(exam.title).toLowerCase().includes(search) ||
      text(exam.description).toLowerCase().includes(search) ||
      text(exam.classes?.class_name).toLowerCase().includes(search);

    return (
      matchesSearch &&
      (!classId || exam.class_id === classId)
    );
  });
}

function sortLearnerExams(items, sortBy) {
  if (sortBy === "title_asc") return [...items].sort((a, b) => text(a.title).localeCompare(text(b.title)));
  if (sortBy === "start_asc" || sortBy === "start_desc") {
    const direction = sortBy === "start_asc" ? 1 : -1;
    return [...items].sort((a, b) => ((new Date(a.start_at).getTime() || 0) - (new Date(b.start_at).getTime() || 0)) * direction);
  }
  return [...items].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
}

function learnerClassOptions(items) {
  const classes = new Map();
  items.forEach((exam) => {
    if (exam.classes?.class_id) classes.set(exam.classes.class_id, exam.classes);
  });
  return Array.from(classes.values()).sort((a, b) => text(a.class_name).localeCompare(text(b.class_name)));
}

function paginateLearnerExams(items, filters = {}) {
  const page = Math.max(Number(filters.page) || 1, 1);
  const pageSize = Math.min(Math.max(Number(filters.pageSize) || 5, 1), 50);
  const filtered = sortLearnerExams(filterLearnerExams(items, filters), filters.sortBy);
  const total = filtered.length;
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: filtered.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages,
    classes: learnerClassOptions(items),
  };
}

// List exams assigned to classes the learner has joined.
export async function listLearnerExamSessions(learnerId, filters = {}) {
  requireUser(learnerId);

  const { data: memberships, error: memberError } = await dao.listActiveClassMemberships(learnerId);
  if (memberError) throw dbError(memberError, 500);

  const classIds = (memberships ?? []).map((item) => item.class_id).filter(Boolean);
  const { error: closeError } = await dao.closeExpiredLearnerExamSessions(
    classIds,
    new Date().toISOString()
  );
  if (closeError) throw dbError(closeError, 500);

  const { data, error } = await dao.listLearnerExamSessions(classIds);
  if (error) throw dbError(error, 500);

  return paginateLearnerExams(data ?? [], filters);
}

// Learner detail includes attempt history so the next attempt can be calculated.
export async function getLearnerExamDetail(examSessionId, learnerId) {
  requireUser(learnerId);

  const { data: memberships, error: memberError } = await dao.listActiveClassMemberships(learnerId);
  if (memberError) throw dbError(memberError, 500);

  const classIds = (memberships ?? []).map((item) => item.class_id).filter(Boolean);
  const { error: closeError } = await dao.closeExpiredLearnerExamSessions(
    classIds,
    new Date().toISOString()
  );
  if (closeError) throw dbError(closeError, 500);

  const { data, error } = await dao.findLearnerExamSession(examSessionId, classIds);
  if (error) throw dbError(error, 500);
  if (!data) throw notFound();

  const { data: attempts, error: attemptError } = await dao.listLearnerExamAttempts(examSessionId, learnerId);
  if (attemptError) throw dbError(attemptError, 500);

  return {
    ...data,
    attempts: attempts ?? [],
    attempts_used: attempts?.length ?? 0,
    attempts_remaining: Math.max(Number(data.attempt_limit || 0) - (attempts?.length ?? 0), 0),
  };
}
