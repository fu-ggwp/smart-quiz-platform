import { randomBytes } from "crypto";

import {
  ExamResultVisibility,
  ExamSessionStatus,
  EXAM_SESSION_CONFIG_COLUMNS,
} from "../../models/exam.model.js";
import { ExamAttemptStatus } from "../../models/exam-attempt.model.js";
import {
  getReadyQuestionBank,
  listReadyQuestionBankQuestions,
} from "../question-banks/question-banks.service.js";
import * as dao from "./exams.dao.js";
import { notifyExamPublished } from "../../utils/notification.service.js";
import { logger } from "../../utils/logger.js";

const createSavedMessage = "Exam session has been created successfully.";
const settingsSavedMessage = "Exam settings have been updated successfully.";
const EXAM_MAX_SCORE = 10;

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

function roundScore(value) {
  return Number(Number(value || 0).toFixed(2));
}

function examQuestionScore(questionCount) {
  const count = Number(questionCount || 0);
  return count > 0 ? EXAM_MAX_SCORE / count : 0;
}

function withExamMaxScore(attempt) {
  return attempt ? { ...attempt, max_score: EXAM_MAX_SCORE } : attempt;
}

function attemptDurationSeconds(attempt) {
  if (!attempt?.started_at || !attempt?.submitted_at) return null;

  const started = new Date(attempt.started_at).getTime();
  const submitted = new Date(attempt.submitted_at).getTime();
  if (!Number.isFinite(started) || !Number.isFinite(submitted) || submitted < started) return null;

  return Math.round((submitted - started) / 1000);
}

function normalizeTeacherAttempt(attempt) {
  const isSubmitted = attempt.status === ExamAttemptStatus.SUBMITTED;

  return {
    exam_attempt_id: attempt.exam_attempt_id,
    exam_session_id: attempt.exam_session_id,
    learner_id: attempt.learner_id,
    learner: attempt.learner ?? null,
    attempt_number: attempt.attempt_number,
    status: attempt.status,
    started_at: attempt.started_at,
    submitted_at: attempt.submitted_at,
    expires_at: attempt.expires_at,
    duration_seconds: isSubmitted ? attemptDurationSeconds(attempt) : null,
    score: isSubmitted ? roundScore(attempt.total_score) : null,
    max_score: EXAM_MAX_SCORE,
    warning_count: attempt.warning_count ?? 0,
    is_auto_submitted: Boolean(attempt.is_auto_submitted),
  };
}

function toScore(value) {
  const score = Number(value || 0);
  return Number.isFinite(score) ? score : 0;
}

function learnerDisplayName(learner = {}) {
  return text(learner.full_name) || text(learner.username) || text(learner.email) || "Learner";
}

function optionLabel(index) {
  return String.fromCharCode(65 + Number(index || 0));
}

function selectedOptionLabels(answer) {
  const indexes = answer?.selected_exam_option_indexes ?? [];
  return indexes.map(optionLabel).join(", ");
}

function scoreBucketFor(score) {
  const thresholds = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const value = toScore(score);
  const threshold = thresholds.find((item) => value < item);
  return threshold ? `< ${threshold}` : "<= 10";
}

function buildDistribution(scores) {
  const labels = ["< 1", "< 2", "< 3", "< 4", "< 5", "< 6", "< 7", "< 8", "< 9", "<= 10"];
  const buckets = labels.map((label) => ({ label, count: 0, percentage: 0 }));
  const byLabel = new Map(buckets.map((bucket) => [bucket.label, bucket]));

  scores.forEach((score) => {
    const bucket = byLabel.get(scoreBucketFor(score));
    if (bucket) bucket.count += 1;
  });

  buckets.forEach((bucket) => {
    bucket.percentage = scores.length ? roundScore((bucket.count / scores.length) * 100) : 0;
  });

  return buckets;
}

function bestSubmittedAttemptsByLearner(attempts = []) {
  const bestByLearner = new Map();

  attempts
    .filter((attempt) => attempt.status === ExamAttemptStatus.SUBMITTED)
    .forEach((attempt) => {
      const current = bestByLearner.get(attempt.learner_id);
      const attemptScore = toScore(attempt.total_score);
      const currentScore = toScore(current?.total_score);
      const attemptSubmittedAt = attempt.submitted_at ? new Date(attempt.submitted_at).getTime() : 0;
      const currentSubmittedAt = current?.submitted_at ? new Date(current.submitted_at).getTime() : 0;

      if (!current || attemptScore > currentScore || (attemptScore === currentScore && attemptSubmittedAt > currentSubmittedAt)) {
        bestByLearner.set(attempt.learner_id, attempt);
      }
    });

  return Array.from(bestByLearner.values());
}

function buildQuestionStatistics(questions = [], attempts = [], answers = []) {
  const answersByAttemptQuestion = new Map();

  answers.forEach((answer) => {
    answersByAttemptQuestion.set(`${answer.exam_attempt_id}:${answer.exam_question_id}`, answer);
  });

  return questions.map((question, index) => {
    const options = Array.isArray(question.answer_options_json) ? question.answer_options_json : [];
    const optionStats = options.map((option, optionIndex) => ({
      index: Number(option.index ?? optionIndex),
      label: optionLabel(option.index ?? optionIndex),
      text: option.text || "",
      correctStudents: [],
      wrongStudents: [],
    }));
    const optionStatsByIndex = new Map(optionStats.map((item) => [item.index, item]));
    const correctStudents = [];
    const wrongStudents = [];
    const unansweredStudents = [];

    attempts.forEach((attempt) => {
      const learnerName = learnerDisplayName(attempt.learner);
      const answer = answersByAttemptQuestion.get(`${attempt.exam_attempt_id}:${question.exam_question_id}`);

      if (!answer || !(answer.selected_exam_option_indexes ?? []).length) {
        unansweredStudents.push(learnerName);
        return;
      }

      const selectedLabels = selectedOptionLabels(answer);
      if (answer.is_correct) {
        correctStudents.push(learnerName);
      } else {
        wrongStudents.push(selectedLabels ? `${learnerName} (${selectedLabels})` : learnerName);
      }

      (answer.selected_exam_option_indexes ?? []).forEach((selectedIndex) => {
        const optionStat = optionStatsByIndex.get(Number(selectedIndex));
        if (!optionStat) return;
        if (answer.is_correct) optionStat.correctStudents.push(learnerName);
        else optionStat.wrongStudents.push(learnerName);
      });
    });

    return {
      exam_question_id: question.exam_question_id,
      label: `Question ${String(index + 1).padStart(2, "0")}`,
      question_text: question.question_text,
      totalStudents: attempts.length,
      answeredCount: attempts.length - unansweredStudents.length,
      unansweredCount: unansweredStudents.length,
      correctCount: correctStudents.length,
      wrongCount: wrongStudents.length,
      incompleteRate: attempts.length ? roundScore((unansweredStudents.length / attempts.length) * 100) : 0,
      correctStudents,
      wrongStudents,
      unansweredStudents,
      optionStats,
    };
  });
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

function isStartedActiveExam(exam, now = Date.now()) {
  if (exam?.status !== ExamSessionStatus.ACTIVE || !exam.start_at) return false;
  const startTime = new Date(exam.start_at).getTime();
  return Number.isFinite(startTime) && startTime <= now;
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

function normalizeStatus(value, fallback = ExamSessionStatus.ACTIVE) {
  const rawStatus = text(value);
  if (!rawStatus) return fallback;

  const status = rawStatus.toLowerCase();
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

  return options.length >= 2 && correctCount >= 1;
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

// Store a frozen copy so later bank edits do not change this exam.
function toExamQuestionRows(examSessionId, questions) {
  const questionScore = examQuestionScore(questions.length);

  return questions.map((question, index) => {
    const options = [...(question.answer_options ?? [])].sort(
      (left, right) => left.display_order - right.display_order
    );
    const orderedOptions = options;

    return {
      exam_session_id: examSessionId,
      source_question_id: question.question_id,
      question_text: question.question_text,
      question_type: question.question_type || "multiple_choice",
      score: questionScore,
      explanation: question.explanation || null,
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

// Notify all active learners in the exam's class that it was published (UC-46).
// Non-blocking + guarded so a notification failure never breaks publish.
async function notifyExamSessionPublished(exam) {
  try {
    if (!exam?.class_id) return;
    const { data: members, error } = await dao.listActiveClassMemberEmails(exam.class_id);
    if (error) {
      logger.error("Failed to load exam class members for notification:", error.message);
      return;
    }
    const learners = (members || []).map((member) => member.learner).filter(Boolean);
    if (learners.length === 0) return;
    await notifyExamPublished({
      learners,
      examTitle: exam.title,
      className: exam.classes?.class_name,
      startAt: exam.start_at,
    });
  } catch (err) {
    logger.error("Failed to notify learners of exam publish:", err.message);
  }
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

export async function getExamStatistics(examSessionId, teacherId) {
  const exam = await getExamDetail(examSessionId, teacherId);

  const [attemptsResult, questionsResult] = await Promise.all([
    dao.listTeacherExamAttempts(examSessionId),
    dao.listExamQuestions(examSessionId),
  ]);

  if (attemptsResult.error) throw dbError(attemptsResult.error, 500);
  if (questionsResult.error) throw dbError(questionsResult.error, 500);

  const attempts = (attemptsResult.data ?? []).map(withExamMaxScore);
  const questions = questionsResult.data ?? [];
  const bestAttempts = bestSubmittedAttemptsByLearner(attempts);
  const answerAttemptIds = bestAttempts.map((attempt) => attempt.exam_attempt_id);
  const { data: answers, error: answersError } = await dao.listExamAttemptAnswersByAttemptIds(answerAttemptIds);
  if (answersError) throw dbError(answersError, 500);

  const answersByAttemptQuestion = new Map();
  (answers ?? []).forEach((answer) => {
    answersByAttemptQuestion.set(`${answer.exam_attempt_id}:${answer.exam_question_id}`, answer);
  });

  const scoreRows = bestAttempts
    .sort((left, right) => learnerDisplayName(left.learner).localeCompare(learnerDisplayName(right.learner)))
    .map((attempt, index) => ({
      index: index + 1,
      learner_id: attempt.learner_id,
      name: learnerDisplayName(attempt.learner),
      email: attempt.learner?.email || "",
      birthdate: "Not provided",
      className: exam.classes?.class_name || "Free",
      groupName: exam.classes?.class_name || "Free",
      gender: "Not provided",
      score: roundScore(attempt.total_score),
      submitted_at: attempt.submitted_at,
      attempt_number: attempt.attempt_number,
      warning_count: attempt.warning_count ?? 0,
      answers: questions.map((question, questionIndex) => {
        const answer = answersByAttemptQuestion.get(`${attempt.exam_attempt_id}:${question.exam_question_id}`);
        return {
          exam_question_id: question.exam_question_id,
          label: `Question ${String(questionIndex + 1).padStart(2, "0")}`,
          status: !answer || !(answer.selected_exam_option_indexes ?? []).length
            ? "Not answered"
            : answer.is_correct
              ? "Correct"
              : "Wrong",
          selected: selectedOptionLabels(answer),
        };
      }),
    }));

  const scores = scoreRows.map((row) => row.score);
  const distribution = buildDistribution(scores);
  const averageScore = scores.length
    ? roundScore(scores.reduce((sum, score) => sum + score, 0) / scores.length)
    : 0;
  const mostCommonBucket = [...distribution].sort((left, right) => right.count - left.count)[0] ?? distribution[0];
  const submittedLearnerIds = new Set(bestAttempts.map((attempt) => attempt.learner_id));
  const registeredLearnerIds = new Set(attempts.map((attempt) => attempt.learner_id));
  const inProgressLearnerIds = new Set(
    attempts
      .filter((attempt) => attempt.status === ExamAttemptStatus.IN_PROGRESS)
      .map((attempt) => attempt.learner_id)
  );
  const notSubmittedOrInProgress = Array.from(registeredLearnerIds)
    .filter((learnerId) => !submittedLearnerIds.has(learnerId)).length;

  return {
    exam,
    summary: {
      registeredCount: registeredLearnerIds.size,
      totalAttempts: attempts.length,
      submittedLearners: submittedLearnerIds.size,
      inProgressLearners: inProgressLearnerIds.size,
      notSubmittedOrInProgress,
      belowOneCount: scores.filter((score) => score < 1).length,
      atLeastFiveCount: scores.filter((score) => score >= 5).length,
      averageScore,
      mostCommonScoreBucket: mostCommonBucket?.label || "-",
      maxScore: EXAM_MAX_SCORE,
    },
    distribution,
    scoreRows,
    questionStats: buildQuestionStatistics(questions, bestAttempts, answers ?? []),
    questions: questions.map((question, index) => ({
      exam_question_id: question.exam_question_id,
      label: `Question ${String(index + 1).padStart(2, "0")}`,
      question_text: question.question_text,
      display_order: question.display_order,
    })),
  };
}

export async function getExamAttempts(examSessionId, teacherId) {
  const exam = await getExamDetail(examSessionId, teacherId);
  const { data, error } = await dao.listTeacherExamAttempts(examSessionId);
  if (error) throw dbError(error, 500);

  const attempts = (data ?? []).map(normalizeTeacherAttempt);
  const uniqueLearners = new Set(attempts.map((attempt) => attempt.learner_id).filter(Boolean));

  return {
    exam,
    summary: {
      totalAttempts: attempts.length,
      inProgressCount: attempts.filter((attempt) => attempt.status === ExamAttemptStatus.IN_PROGRESS).length,
      submittedCount: attempts.filter((attempt) => attempt.status === ExamAttemptStatus.SUBMITTED).length,
      uniqueLearners: uniqueLearners.size,
      maxScore: EXAM_MAX_SCORE,
    },
    attempts,
  };
}

// Update the configurable fields from the settings screen.
export async function updateExamSettings(examSessionId, teacherId, payload = {}) {
  const exam = await getExamDetail(examSessionId, teacherId);

  if ([ExamSessionStatus.CLOSED, ExamSessionStatus.ARCHIVED].includes(exam.status)) {
    throw fail("You do not have permission to access or perform this action.", 409);
  }

  if (isStartedActiveExam(exam)) {
    throw fail("Active exam sessions cannot be configured after their start time.", 409);
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
    const sourceQuestions = await listReadyQuestionBankQuestions(teacherId, exam.question_bank_id);
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

  // Publishing = transitioning draft -> active. Notify class learners (UC-46).
  if (isActivating) {
    notifyExamSessionPublished(data);
  }

  return { message: settingsSavedMessage, exam: data };
}

// Create an exam and snapshot selected questions into exam_questions.
export async function createExamSession(teacherId, payload = {}) {
  requireUser(teacherId);

  const normalized = normalizeCreatePayload(payload);
  const [classResult, questionBank, sourceQuestions] = await Promise.all([
    dao.findManagedActiveClass(normalized.class_id, teacherId),
    getReadyQuestionBank(teacherId, normalized.question_bank_id),
    listReadyQuestionBankQuestions(teacherId, normalized.question_bank_id),
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

  const selectedQuestions = shuffle(questions).slice(0, normalized.question_count);
  const { data: examQuestions, error: questionError } = await dao.insertExamQuestions(
    toExamQuestionRows(examSession.exam_session_id, selectedQuestions)
  );

  if (questionError) {
    await dao.deleteExamSession(examSession.exam_session_id);
    throw dbError(questionError);
  }

  // If the exam is created already published (active), notify class learners.
  if (examSession.status === ExamSessionStatus.ACTIVE) {
    notifyExamSessionPublished(examSession);
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
    attempts: (attempts ?? []).map(withExamMaxScore),
    attempts_used: attempts?.length ?? 0,
    attempts_remaining: Math.max(Number(data.attempt_limit || 0) - (attempts?.length ?? 0), 0),
  };
}

function nowMs() {
  return Date.now();
}

function isWithinExamWindow(exam, now = nowMs()) {
  const start = exam.start_at ? new Date(exam.start_at).getTime() : null;
  const end = exam.end_at ? new Date(exam.end_at).getTime() : null;
  return (!start || start <= now) && (!end || now <= end);
}

function expiresAtForAttempt(exam, startedAt) {
  const started = new Date(startedAt).getTime();
  const durationEnd = started + Number(exam.duration_minutes || 0) * 60 * 1000;
  const sessionEnd = exam.end_at ? new Date(exam.end_at).getTime() : durationEnd;
  return new Date(Math.min(durationEnd, sessionEnd)).toISOString();
}

function remainingSeconds(attempt) {
  const expires = new Date(attempt.expires_at).getTime();
  if (!Number.isFinite(expires)) return 0;
  return Math.max(Math.ceil((expires - nowMs()) / 1000), 0);
}

function sameIndexes(left = [], right = []) {
  if (left.length !== right.length) return false;
  const sortedLeft = [...left].map(Number).sort((a, b) => a - b);
  const sortedRight = [...right].map(Number).sort((a, b) => a - b);
  return sortedLeft.every((value, index) => value === sortedRight[index]);
}

function buildAttemptOrder(exam, questions) {
  const orderedQuestions = exam.randomize_questions ? shuffle(questions) : [...questions];
  const questionOrder = orderedQuestions.map((question) => question.exam_question_id);
  const answerOrder = {};

  questions.forEach((question) => {
    const options = Array.isArray(question.answer_options_json) ? question.answer_options_json : [];
    const indexes = options.map((option, index) => Number(option.index ?? index));
    answerOrder[question.exam_question_id] = exam.randomize_answers ? shuffle(indexes) : indexes;
  });

  return { questionOrder, answerOrder };
}

function visibleQuestions(questions, attempt) {
  const byId = new Map(questions.map((question) => [question.exam_question_id, question]));
  const questionScore = examQuestionScore(questions.length);
  const orderedIds = attempt.question_order?.length
    ? attempt.question_order
    : questions.map((question) => question.exam_question_id);

  return orderedIds.map((id) => byId.get(id)).filter(Boolean).map((question) => {
    const options = Array.isArray(question.answer_options_json) ? question.answer_options_json : [];
    const optionsByIndex = new Map(options.map((option, index) => [Number(option.index ?? index), option]));
    const order = attempt.answer_order?.[question.exam_question_id] ?? options.map((option, index) => Number(option.index ?? index));

    return {
      exam_question_id: question.exam_question_id,
      question_text: question.question_text,
      question_type: question.question_type,
      score: questionScore,
      display_order: question.display_order,
      answer_options: order.map((optionIndex) => {
        const option = optionsByIndex.get(Number(optionIndex));
        return { index: Number(optionIndex), text: option?.text || "" };
      }),
    };
  });
}

function resultQuestions(questions, answers, attempt) {
  const answersByQuestion = new Map(
    (answers ?? []).map((answer) => [answer.exam_question_id, answer])
  );
  const questionScore = examQuestionScore(questions.length);

  return visibleQuestions(questions, attempt).map((question) => {
    const source = (questions ?? []).find((item) => item.exam_question_id === question.exam_question_id) || {};
    const answer = answersByQuestion.get(question.exam_question_id);
    const selectedIndexes = answer?.selected_exam_option_indexes ?? [];
    const correctIndexes = source.correct_option_indexes ?? [];

    return {
      ...question,
      explanation: source.explanation || null,
      selected_exam_option_indexes: selectedIndexes,
      correct_option_indexes: correctIndexes,
      is_correct: Boolean(answer?.is_correct),
      score_awarded: answer?.is_correct ? questionScore : 0,
      answer_options: question.answer_options.map((option) => ({
        ...option,
        is_selected: selectedIndexes.map(Number).includes(Number(option.index)),
        is_correct: correctIndexes.map(Number).includes(Number(option.index)),
      })),
    };
  });
}

async function getLearnerClassIds(learnerId) {
  const { data, error } = await dao.listActiveClassMemberships(learnerId);
  if (error) throw dbError(error, 500);
  return (data ?? []).map((item) => item.class_id).filter(Boolean);
}

async function getLearnerExamOrFail(examSessionId, learnerId) {
  const classIds = await getLearnerClassIds(learnerId);
  const { data, error } = await dao.findLearnerExamSession(examSessionId, classIds);
  if (error) throw dbError(error, 500);
  if (!data) throw fail("This exam is not available to you at this time.", 403);
  return data;
}

async function buildAttemptPayload(attempt, exam) {
  const { data: questions, error: questionError } = await dao.listExamQuestions(attempt.exam_session_id);
  if (questionError) throw dbError(questionError, 500);

  const { data: answers, error: answerError } = await dao.listExamAttemptAnswers(attempt.exam_attempt_id);
  if (answerError) throw dbError(answerError, 500);

  return {
    exam,
    attempt: {
      ...attempt,
      max_score: EXAM_MAX_SCORE,
      remaining_seconds: remainingSeconds(attempt),
    },
    questions: visibleQuestions(questions ?? [], attempt),
    answers: answers ?? [],
  };
}

async function autoSubmitIfExpired(attempt, exam) {
  if (attempt.status !== ExamAttemptStatus.IN_PROGRESS || remainingSeconds(attempt) > 0) return attempt;
  return submitLearnerExamAttempt(attempt.exam_attempt_id, attempt.learner_id, true, exam);
}

export async function startLearnerExamAttempt(examSessionId, learnerId, payload = {}) {
  requireUser(learnerId);
  const exam = await getLearnerExamOrFail(examSessionId, learnerId);

  if (!isWithinExamWindow(exam)) throw fail("This exam is not available to you at this time.", 403);
  if (exam.access_code && text(payload.access_code).toUpperCase() !== exam.access_code.toUpperCase()) {
    throw fail("The exam access code is invalid.", 403);
  }

  const { data: existingAttempt, error: existingError } = await dao.findInProgressExamAttempt(examSessionId, learnerId);
  if (existingError) throw dbError(existingError, 500);
  if (existingAttempt) {
    const current = await autoSubmitIfExpired(existingAttempt, exam);
    if (current.status === ExamAttemptStatus.IN_PROGRESS) return buildAttemptPayload(current, exam);
  }

  const { data: attempts, error: attemptError } = await dao.listLearnerExamAttempts(examSessionId, learnerId);
  if (attemptError) throw dbError(attemptError, 500);
  if ((attempts?.length ?? 0) >= Number(exam.attempt_limit || 1)) {
    throw fail("This exam is not available to you at this time.", 403);
  }

  const { data: questions, error: questionError } = await dao.listExamQuestions(examSessionId);
  if (questionError) throw dbError(questionError, 500);
  if (!questions?.length) throw fail("No exam questions are available.", 400);

  const startedAt = new Date().toISOString();
  const { questionOrder, answerOrder } = buildAttemptOrder(exam, questions);
  const { data: attempt, error } = await dao.insertExamAttempt({
    exam_session_id: examSessionId,
    learner_id: learnerId,
    attempt_number: (attempts?.length ?? 0) + 1,
    started_at: startedAt,
    expires_at: expiresAtForAttempt(exam, startedAt),
    status: ExamAttemptStatus.IN_PROGRESS,
    is_auto_submitted: false,
    question_order: questionOrder,
    answer_order: answerOrder,
    warning_count: 0,
    total_score: 0,
  });
  if (error) throw dbError(error);

  return buildAttemptPayload(attempt, exam);
}

export async function getLearnerExamAttempt(examAttemptId, learnerId) {
  requireUser(learnerId);
  const { data: attempt, error } = await dao.findLearnerExamAttempt(examAttemptId, learnerId);
  if (error) throw dbError(error, 500);
  if (!attempt) throw notFound("Exam attempt not found");

  const exam = await getLearnerExamOrFail(attempt.exam_session_id, learnerId);
  const current = await autoSubmitIfExpired(attempt, exam);
  return buildAttemptPayload(current, exam);
}

export async function saveLearnerExamAnswer(examAttemptId, learnerId, payload = {}) {
  requireUser(learnerId);
  const { data: attempt, error } = await dao.findLearnerExamAttempt(examAttemptId, learnerId);
  if (error) throw dbError(error, 500);
  if (!attempt) throw notFound("Exam attempt not found");
  if (attempt.status !== ExamAttemptStatus.IN_PROGRESS) throw fail("This attempt has already been submitted.", 409);
  if (remainingSeconds(attempt) <= 0) throw fail("Time is up.", 409);

  const { data: questions, error: questionError } = await dao.listExamQuestions(attempt.exam_session_id);
  if (questionError) throw dbError(questionError, 500);
  const question = (questions ?? []).find((item) => item.exam_question_id === payload.exam_question_id);
  if (!question) throw fail("Question is not part of this attempt.", 400);

  const selected = Array.isArray(payload.selected_exam_option_indexes)
    ? payload.selected_exam_option_indexes.map(Number).filter(Number.isFinite)
    : [];
  const isCorrect = sameIndexes(selected, question.correct_option_indexes ?? []);
  const scoreAwarded = isCorrect ? examQuestionScore(questions.length) : 0;
  const { data, error: answerError } = await dao.upsertExamAttemptAnswer({
    exam_attempt_id: examAttemptId,
    exam_question_id: question.exam_question_id,
    selected_exam_option_indexes: selected,
    is_correct: isCorrect,
    score_awarded: scoreAwarded,
    review_status: "unreviewed",
    answered_at: new Date().toISOString(),
  });
  if (answerError) throw dbError(answerError);
  return data;
}

export async function submitLearnerExamAttempt(examAttemptId, learnerId, auto = false, knownExam = null) {
  requireUser(learnerId);
  const { data: attempt, error } = await dao.findLearnerExamAttempt(examAttemptId, learnerId);
  if (error) throw dbError(error, 500);
  if (!attempt) throw notFound("Exam attempt not found");
  const exam = knownExam || await getLearnerExamOrFail(attempt.exam_session_id, learnerId);
  if (attempt.status === ExamAttemptStatus.SUBMITTED) {
    return { ...withExamMaxScore(attempt), result_visibility: exam.result_visibility };
  }
  const { data: answers, error: answerError } = await dao.listExamAttemptAnswers(examAttemptId);
  if (answerError) throw dbError(answerError, 500);

  const { data: questions, error: questionError } = await dao.listExamQuestions(attempt.exam_session_id);
  if (questionError) throw dbError(questionError, 500);

  const questionScore = examQuestionScore(questions?.length ?? 0);
  const totalScore = roundScore((answers ?? []).reduce(
    (sum, answer) => sum + (answer.is_correct ? questionScore : 0),
    0
  ));

  const { data, error: updateError } = await dao.updateExamAttempt(examAttemptId, {
    status: ExamAttemptStatus.SUBMITTED,
    is_auto_submitted: Boolean(auto),
    submitted_at: new Date().toISOString(),
    total_score: totalScore,
    updated_at: new Date().toISOString(),
  });
  if (updateError) throw dbError(updateError);

  return {
    ...data,
    max_score: EXAM_MAX_SCORE,
    result_visibility: exam.result_visibility,
  };
}

export async function getLearnerExamAttemptResults(examAttemptId, learnerId) {
  requireUser(learnerId);

  const { data: attempt, error: attemptError } = await dao.findLearnerExamAttempt(examAttemptId, learnerId);
  if (attemptError) throw dbError(attemptError, 500);
  if (!attempt) throw notFound("Exam attempt not found");
  if (attempt.status !== ExamAttemptStatus.SUBMITTED) {
    throw fail("Submit this exam before viewing detailed results.", 409);
  }

  const { data: exam, error: examError } = await dao.findExamSessionById(attempt.exam_session_id);
  if (examError) throw dbError(examError, 500);
  if (!exam) throw notFound("Exam session not found");
  if (exam.result_visibility !== ExamResultVisibility.QUESTION_ANSWER) {
    throw fail("Detailed question answers are not available for this exam.", 403);
  }

  const { data: questions, error: questionError } = await dao.listExamQuestions(attempt.exam_session_id);
  if (questionError) throw dbError(questionError, 500);

  const { data: answers, error: answerError } = await dao.listExamAttemptAnswers(examAttemptId);
  if (answerError) throw dbError(answerError, 500);

  return {
    exam,
    attempt: withExamMaxScore(attempt),
    questions: resultQuestions(questions ?? [], answers ?? [], attempt),
  };
}

export async function recordLearnerExamEvent(examAttemptId, learnerId, payload = {}) {
  requireUser(learnerId);
  const eventType = text(payload.event_type);
  const eventTypes = new Set(["tab_hidden", "tab_visible", "window_blur", "window_focus", "fullscreen_exit", "zoom_changed"]);
  const warningTypes = new Set(["tab_hidden", "window_blur", "fullscreen_exit", "zoom_changed"]);
  if (!eventTypes.has(eventType)) throw fail("Invalid exam event type.", 400);

  const { data: attempt, error } = await dao.findLearnerExamAttempt(examAttemptId, learnerId);
  if (error) throw dbError(error, 500);
  if (!attempt) throw notFound("Exam attempt not found");
  if (attempt.status !== ExamAttemptStatus.IN_PROGRESS) return attempt;

  if (!warningTypes.has(eventType)) return attempt;

  const { data, error: updateError } = await dao.updateExamAttempt(examAttemptId, {
    warning_count: Number(attempt.warning_count || 0) + 1,
    updated_at: new Date().toISOString(),
  });
  if (updateError) throw dbError(updateError);
  return data;
}
