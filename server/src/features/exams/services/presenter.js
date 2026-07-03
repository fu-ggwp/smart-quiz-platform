import { ExamAttemptStatus } from "../../../models/exam-attempt.model.js";
import {
  EXAM_MAX_SCORE,
  attemptDurationSeconds,
  examQuestionScore,
  roundScore,
} from "./utils.js";

export function withExamMaxScore(attempt) {
  return attempt ? { ...attempt, max_score: EXAM_MAX_SCORE } : attempt;
}

export function normalizeTeacherAttempt(attempt) {
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

export function withTeacherAttemptPresentation(attempt) {
  if (!attempt) return attempt;
  const isSubmitted = attempt.status === ExamAttemptStatus.SUBMITTED;

  return {
    ...attempt,
    duration_seconds: isSubmitted ? attemptDurationSeconds(attempt) : null,
    score: isSubmitted ? roundScore(attempt.total_score) : null,
    max_score: EXAM_MAX_SCORE,
  };
}

export function visibleQuestions(questions, attempt) {
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
      score: questionScore,
      display_order: question.display_order,
      answer_options: order.map((optionIndex) => {
        const option = optionsByIndex.get(Number(optionIndex));
        return { index: Number(optionIndex), text: option?.text || "" };
      }),
    };
  });
}

export function resultQuestions(questions, answers, attempt) {
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
