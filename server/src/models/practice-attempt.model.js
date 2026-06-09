// Mirrors the `practice_attempts` table — a learner's flashcard/quiz study run
// on a study set. (The earlier scaffold guessed a `practice_sessions` table —
// it doesn't exist; the real name is `practice_attempts`. Consider renaming
// this file to practice-attempt.model.js to match.)
export const PRACTICE_ATTEMPT_TABLE = "practice_attempts";

export const PracticeAttemptMode = Object.freeze({
  FLASHCARD: "flashcard",
  QUIZ: "quiz",
});

export const PracticeAttemptStatus = Object.freeze({
  IN_PROGRESS: "in_progress",
  SUBMITTED: "submitted",
  ABANDONED: "abandoned",
});

/**
 * @typedef {Object} PracticeAttempt
 * @property {string} practice_attempt_id
 * @property {string} learner_id     - FK -> users.user_id
 * @property {string} study_set_id   - FK -> study_sets.study_set_id
 * @property {"flashcard"|"quiz"} mode
 * @property {string} started_at
 * @property {string} [submitted_at]
 * @property {"in_progress"|"submitted"|"abandoned"} status
 * @property {number} total_score
 * @property {number} max_score
 * @property {string} created_at
 */
