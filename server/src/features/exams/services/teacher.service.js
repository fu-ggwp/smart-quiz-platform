import { randomBytes } from "crypto";

import { ExamSessionStatus } from "../../../models/exam.model.js";
import { ExamAttemptStatus } from "../../../models/exam-attempt.model.js";
import {
  getReadyQuestionBank,
  listReadyQuestionBankQuestions,
} from "../../question-banks/question-banks.service.js";
import * as dao from "../exams.dao.js";
import { notifyExamPublished } from "../../../utils/notification.service.js";
import { notifyLearnersOfExamPublished } from "../exams.notifications.js";
import { logger } from "../../../utils/logger.js";
import {
  createSavedMessage,
  dbError,
  EXAM_MAX_SCORE,
  fail,
  notFound,
  requireUser,
  settingsSavedMessage,
  shuffle,
  text,
} from "./utils.js";
import {
  assertActivatable,
  assertDurationFitsWindow,
  assertStartNotPast,
  assertTimeWindow,
  getNext,
  normalizeCreatePayload,
  normalizeQuestionIds,
  pickConfigChanges,
} from "./validation.js";
import { normalizeTeacherAttempt } from "./presenter.js";

function buildAccessCode(value) {
  return text(value).toUpperCase().replace(/[^A-Z0-9-]/g, "") ||
    `EXAM-${randomBytes(4).toString("hex").toUpperCase()}`;
}

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

function validQuestion(question) {
  const options = question.answer_options ?? [];
  const correctCount = options.filter((option) => option.is_correct).length;

  return options.length >= 2 && correctCount >= 1;
}

function selectQuestionsByIds(questions, questionIds) {
  const byId = new Map(questions.map((question) => [question.question_id, question]));
  return questionIds.map((questionId) => byId.get(questionId)).filter(Boolean);
}

function assertSelectedQuestions(questionIds, selectedQuestions) {
  if (!questionIds.length) return;

  if (selectedQuestions.length !== questionIds.length) {
    throw fail("Some selected questions are not available in the selected question bank.", 400, {
      question_ids: "Some selected questions are not available in the selected question bank.",
      question_count: "Please review the selected questions.",
    });
  }
}

function examSessionInsertError(error) {
  if (error?.code === "23505" && String(error.message || "").includes("exam_sessions_access_code_key")) {
    throw fail(
      "Exam access codes can be reused, but the database still has the old unique access-code constraint. Please run docs/exam-access-code-non-unique.sql.",
      500
    );
  }

  throw dbError(error);
}

function toExamQuestionRows(examSessionId, questions) {
  return questions.map((question, index) => {
    const options = [...(question.answer_options ?? [])].sort(
      (left, right) => left.display_order - right.display_order
    );

    return {
      exam_session_id: examSessionId,
      source_question_id: question.question_id,
      question_text: question.question_text,
      explanation: question.explanation || null,
      chapter: question.chapter || null,
      answer_options_json: options.map((option, optionIndex) => ({
        index: optionIndex,
        text: option.option_text,
      })),
      correct_option_indexes: options
        .map((option, optionIndex) => (option.is_correct ? optionIndex : null))
        .filter((optionIndex) => optionIndex !== null),
      display_order: index + 1,
    };
  });
}

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
    await notifyLearnersOfExamPublished({
      learners,
      examId: exam.exam_session_id,
      examTitle: exam.title,
      className: exam.classes?.class_name,
    });
  } catch (err) {
    logger.error("Failed to notify learners of exam publish:", err.message);
  }
}

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

  const { data, error } = await dao.findTeacherExamSessionWithQuestions(examSessionId, teacherId);
  if (error) throw dbError(error, 500);
  if (!data) throw notFound();

  if (isExpiredActiveExam(data)) {
    const { data: closedExam, error: closeError } = await dao.closeTeacherExamSession(
      examSessionId,
      teacherId,
      new Date().toISOString()
    );
    if (closeError) throw dbError(closeError, 500);
    return {
      ...data,
      ...(closedExam || {}),
      status: ExamSessionStatus.CLOSED,
      exam_questions: data.exam_questions ?? [],
    };
  }

  const { count: attemptCount, error: attemptCountError } = await dao.countExamAttempts(examSessionId);
  if (attemptCountError) throw dbError(attemptCountError, 500);

  return {
    ...data,
    exam_attempts_count: attemptCount ?? 0,
  };
}

export async function getExamAttempts(examSessionId, teacherId) {
  const exam = await getExamDetail(examSessionId, teacherId);
  const [attemptsResult, classMembersResult] = await Promise.all([
    dao.listTeacherExamAttempts(examSessionId),
    dao.countActiveClassMembers(exam.class_id),
  ]);

  if (attemptsResult.error) throw dbError(attemptsResult.error, 500);
  if (classMembersResult.error) throw dbError(classMembersResult.error, 500);

  const attempts = (attemptsResult.data ?? []).map(normalizeTeacherAttempt);
  const uniqueLearners = new Set(attempts.map((attempt) => attempt.learner_id).filter(Boolean));

  return {
    exam,
    summary: {
      totalAttempts: attempts.length,
      inProgressCount: attempts.filter((attempt) => attempt.status === ExamAttemptStatus.IN_PROGRESS).length,
      submittedCount: attempts.filter((attempt) => attempt.status === ExamAttemptStatus.SUBMITTED).length,
      uniqueLearners: uniqueLearners.size,
      classLearnersCount: classMembersResult.count ?? 0,
      maxScore: EXAM_MAX_SCORE,
    },
    attempts,
  };
}

export async function updateExamSettings(examSessionId, teacherId, payload = {}) {
  const exam = await getExamDetail(examSessionId, teacherId);

  if (exam.status === ExamSessionStatus.CLOSED) {
    throw fail("You do not have permission to access or perform this action.", 409);
  }

  if (isStartedActiveExam(exam)) {
    throw fail("Active exam sessions cannot be configured after their start time.", 409);
  }

  const questionIds = normalizeQuestionIds(payload.question_ids);
  const changes = pickConfigChanges(payload);
  if (questionIds.length) changes.question_count = questionIds.length;
  if (!Object.keys(changes).length) throw fail("No valid exam settings were provided.", 400);

  const isActivating = changes.status === ExamSessionStatus.ACTIVE && exam.status !== ExamSessionStatus.ACTIVE;
  if (changes.start_at !== undefined || isActivating) {
    assertStartNotPast(getNext(exam, changes, "start_at"));
  }
  assertTimeWindow(getNext(exam, changes, "start_at"), getNext(exam, changes, "end_at"));
  assertDurationFitsWindow(
    getNext(exam, changes, "start_at"),
    getNext(exam, changes, "end_at"),
    getNext(exam, changes, "duration_minutes")
  );
  assertActivatable(exam, changes);

  if (isActivating && !text(getNext(exam, changes, "access_code"))) {
    changes.access_code = buildAccessCode();
  }

  let selectedQuestions = null;
  if (questionIds.length) {
    const { count: attemptCount, error: attemptCountError } = await dao.countExamAttempts(examSessionId);
    if (attemptCountError) throw dbError(attemptCountError, 500);
    if (Number(attemptCount || 0) > 0) {
      throw fail("Exam questions cannot be changed after learners have started attempts.", 409);
    }

    const sourceQuestions = await listReadyQuestionBankQuestions(teacherId, exam.question_bank_id);
    const questions = sourceQuestions.filter(validQuestion);
    selectedQuestions = selectQuestionsByIds(questions, questionIds);
    assertSelectedQuestions(questionIds, selectedQuestions);
  } else if (changes.question_count || isActivating) {
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

  if (selectedQuestions) {
    const { error: deleteError } = await dao.deleteExamQuestions(examSessionId);
    if (deleteError) throw dbError(deleteError);

    const { error: insertError } = await dao.insertExamQuestions(
      toExamQuestionRows(examSessionId, selectedQuestions)
    );
    if (insertError) throw dbError(insertError);
  }

  if (isActivating) {
    notifyExamSessionPublished(data);
  }

  const updatedExam = selectedQuestions
    ? await getExamDetail(examSessionId, teacherId)
    : data;

  return { message: settingsSavedMessage, exam: updatedExam };
}

export async function createExamSession(teacherId, payload = {}) {
  requireUser(teacherId);

  const normalized = normalizeCreatePayload(payload);
  const { question_ids: requestedQuestionIds = [], ...examPayload } = normalized;
  const [classResult, questionBank, sourceQuestions] = await Promise.all([
    dao.findManagedActiveClass(normalized.class_id, teacherId),
    getReadyQuestionBank(teacherId, normalized.question_bank_id),
    listReadyQuestionBankQuestions(teacherId, normalized.question_bank_id),
  ]);

  if (classResult.error) throw dbError(classResult.error, 500);
  if (!classResult.data) throw fail("Select one of your active classes.", 400, { class_id: "Select one of your active classes." });

  const questions = (sourceQuestions ?? []).filter(validQuestion);
  const selectedByIds = selectQuestionsByIds(questions, requestedQuestionIds);
  assertSelectedQuestions(requestedQuestionIds, selectedByIds);

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
    ...examPayload,
    access_code: accessCode,
    teacher_id: teacherId,
  });
  if (examError) examSessionInsertError(examError);

  const selectedQuestions = selectedByIds.length
    ? selectedByIds
    : shuffle(questions).slice(0, normalized.question_count);
  const { data: examQuestions, error: questionError } = await dao.insertExamQuestions(
    toExamQuestionRows(examSession.exam_session_id, selectedQuestions)
  );

  if (questionError) {
    await dao.deleteExamSession(examSession.exam_session_id);
    throw dbError(questionError);
  }

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
