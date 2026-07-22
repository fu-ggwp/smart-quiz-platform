import * as dao from "./analytics.dao.js";
import { ExamResultVisibility } from "../../models/exam.model.js";

const EXAM_MAX_SCORE = 10;
const DAY_MS = 24 * 60 * 60 * 1000;
const RECENT_PERFORMANCE_LIMIT = 5;
const RECENT_SCORE_DAYS = 7;

function asNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function toDateKey(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function addDays(date, count) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + count);
  return next;
}

function startOfUtcDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function isInRecentScoreDays(value) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const today = startOfUtcDay(new Date());
  const start = addDays(today, -(RECENT_SCORE_DAYS - 1));
  return date >= start;
}

function buildDateRange(days) {
  const today = startOfUtcDay(new Date());
  const start = addDays(today, -(days - 1));

  return Array.from({ length: days }, (_, index) => {
    return addDays(start, index).toISOString().slice(0, 10);
  });
}

function activityDatesFromPractice(attempt) {
  if (attempt.status !== "submitted") return [];
  return [attempt.submitted_at].map(toDateKey).filter(Boolean);
}

function activityDatesFromExam(attempt) {
  if (attempt.status !== "submitted") return [];
  return [attempt.submitted_at || attempt.started_at].map(toDateKey).filter(Boolean);
}

function uniqueActivityDates(practiceAttempts, examAttempts) {
  const dates = new Set();

  practiceAttempts.forEach((attempt) => {
    activityDatesFromPractice(attempt).forEach((date) => dates.add(date));
  });

  examAttempts.forEach((attempt) => {
    activityDatesFromExam(attempt).forEach((date) => dates.add(date));
  });

  return [...dates].sort();
}

function countCurrentStreak(sortedDates) {
  if (!sortedDates.length) return 0;

  const datesDesc = [...sortedDates].sort((left, right) => right.localeCompare(left));
  let expected = new Date(`${datesDesc[0]}T00:00:00.000Z`);
  let streak = 0;

  for (const dateKey of datesDesc) {
    const date = new Date(`${dateKey}T00:00:00.000Z`);
    if (date.getTime() !== expected.getTime()) break;

    streak += 1;
    expected = new Date(expected.getTime() - DAY_MS);
  }

  return streak;
}

function countLongestStreak(sortedDates) {
  if (!sortedDates.length) return 0;

  let longest = 1;
  let current = 1;

  for (let index = 1; index < sortedDates.length; index += 1) {
    const previous = new Date(`${sortedDates[index - 1]}T00:00:00.000Z`);
    const currentDate = new Date(`${sortedDates[index]}T00:00:00.000Z`);
    const diffDays = Math.round((currentDate - previous) / DAY_MS);

    if (diffDays === 1) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  return longest;
}

function buildLearningRhythm(practiceAttempts, examAttempts) {
  const dateKeys = buildDateRange(30);
  const counts = new Map(dateKeys.map((date) => [date, 0]));

  practiceAttempts.forEach((attempt) => {
    activityDatesFromPractice(attempt).forEach((date) => {
      if (counts.has(date)) counts.set(date, counts.get(date) + 1);
    });
  });

  examAttempts.forEach((attempt) => {
    activityDatesFromExam(attempt).forEach((date) => {
      if (counts.has(date)) counts.set(date, counts.get(date) + 1);
    });
  });

  return dateKeys.map((date) => ({ date, activityCount: counts.get(date) || 0 }));
}

function practiceScoreItem(attempt) {
  const score = asNumber(attempt.total_score);
  const maxScore = asNumber(attempt.max_score);
  const completedAt = attempt.submitted_at || attempt.started_at;

  if (attempt.mode !== "quiz" || attempt.status !== "submitted" || maxScore <= 0 || !completedAt) {
    return null;
  }

  return {
    type: "quiz",
    title: attempt.study_sets?.title || "Untitled quiz",
    score,
    maxScore,
    percentage: Math.round((score / maxScore) * 100),
    completedAt,
  };
}

function examScoreItem(attempt) {
  const completedAt = attempt.submitted_at || attempt.started_at;

  if (attempt.status !== "submitted" || !completedAt) return null;
  if (attempt.exam_sessions?.result_visibility === ExamResultVisibility.COMPLETION_ONLY) return null;

  const score = asNumber(attempt.total_score);

  return {
    type: "exam",
    title: attempt.exam_sessions?.title || "Untitled exam",
    score,
    maxScore: EXAM_MAX_SCORE,
    percentage: Math.round((score / EXAM_MAX_SCORE) * 100),
    completedAt,
  };
}

function buildScoredItems(practiceAttempts, examAttempts) {
  return [
    ...practiceAttempts.map(practiceScoreItem),
    ...examAttempts.map(examScoreItem),
  ]
    .filter(Boolean)
    .sort((left, right) => new Date(right.completedAt) - new Date(left.completedAt));
}

function buildQuizScoreItems(practiceAttempts) {
  return practiceAttempts
    .map(practiceScoreItem)
    .filter(Boolean)
    .sort((left, right) => new Date(right.completedAt) - new Date(left.completedAt));
}

function countAnswers(attempts) {
  return attempts.reduce((sum, attempt) => sum + (attempt.attempt_answers?.length || 0), 0);
}

function buildSnapshot({ practiceAttempts, examAttempts, learningRhythm, quizScoreItems }) {
  const activeDaysLast30 = learningRhythm.filter((item) => item.activityCount > 0).length;
  const activityDates = uniqueActivityDates(practiceAttempts, examAttempts);
  const submittedPracticeCount = practiceAttempts.filter((attempt) => attempt.status === "submitted").length;
  const submittedExamAttempts = examAttempts.filter((attempt) => {
    return attempt.status === "submitted";
  });
  const visibleExamAttempts = submittedExamAttempts.filter((attempt) => {
    return attempt.exam_sessions?.result_visibility !== ExamResultVisibility.COMPLETION_ONLY;
  });
  const recentQuizItems = quizScoreItems.filter((item) => isInRecentScoreDays(item.completedAt));
  const recentExamAttempts = visibleExamAttempts.filter((attempt) => {
    return isInRecentScoreDays(attempt.submitted_at || attempt.started_at);
  });
  const recentScoreTotal = recentQuizItems.reduce((sum, item) => sum + item.score, 0);
  const recentMaxTotal = recentQuizItems.reduce((sum, item) => sum + item.maxScore, 0);
  const examScoreTotal = recentExamAttempts.reduce((sum, attempt) => sum + asNumber(attempt.total_score), 0);

  return {
    activeDaysLast30,
    currentStreakDays: countCurrentStreak(activityDates),
    longestStreakDays: countLongestStreak(activityDates),
    completedActivities: submittedPracticeCount + submittedExamAttempts.length,
    questionsAnswered: countAnswers(practiceAttempts) + countAnswers(examAttempts),
    recentAccuracy: recentMaxTotal > 0 ? Math.round((recentScoreTotal / recentMaxTotal) * 100) : null,
    averageExamScore: recentExamAttempts.length > 0
      ? Math.round((examScoreTotal / recentExamAttempts.length) * 10) / 10
      : null,
  };
}

function buildLearningMix(practiceAttempts, examAttempts) {
  return {
    practiceQuizzes: practiceAttempts.filter((attempt) => attempt.mode === "quiz" && attempt.status === "submitted").length,
    flashcards: practiceAttempts.filter((attempt) => attempt.mode === "flashcard" && attempt.status === "submitted").length,
    exams: examAttempts.filter((attempt) => {
      return attempt.status === "submitted";
    }).length,
  };
}

export async function getLearnerProgress(learnerId) {
  const [practiceResult, examResult] = await Promise.all([
    dao.listPracticeAttemptsForProgress(learnerId),
    dao.listExamAttemptsForProgress(learnerId),
  ]);

  if (practiceResult.error) {
    throw Object.assign(new Error(practiceResult.error.message || "Failed to load practice progress"), { status: 500 });
  }

  if (examResult.error) {
    throw Object.assign(new Error(examResult.error.message || "Failed to load exam progress"), { status: 500 });
  }

  const practiceAttempts = practiceResult.data || [];
  const examAttempts = examResult.data || [];
  const learningRhythm = buildLearningRhythm(practiceAttempts, examAttempts);
  const scoredItems = buildScoredItems(practiceAttempts, examAttempts);
  const quizScoreItems = buildQuizScoreItems(practiceAttempts);

  return {
    snapshot: buildSnapshot({ practiceAttempts, examAttempts, learningRhythm, quizScoreItems }),
    learningRhythm,
    recentPerformance: scoredItems.slice(0, RECENT_PERFORMANCE_LIMIT),
    learningMix: buildLearningMix(practiceAttempts, examAttempts),
  };
}
