// Mirrors the `attempt_answers` table — shared between practice attempts and
// exam attempts via nullable FKs (each row belongs to exactly one of the two,
// and to exactly one of `questions`/`exam_questions`). The earlier scaffold
// guessed a `learner_answers` table — it doesn't exist. Consider renaming
// this file to attempt-answer.model.js to match the real table name.
export const ATTEMPT_ANSWER_TABLE = "attempt_answers";

export const AttemptAnswerReviewStatus = Object.freeze({
  UNREVIEWED: "unreviewed",
  REVIEWED: "reviewed",
  MARKED_FOR_RETRY: "marked_for_retry",
  MASTERED: "mastered",
});

/**
 * @typedef {Object} AttemptAnswer
 * @property {string} attempt_answer_id
 * @property {string} [practice_attempt_id]  - FK -> practice_attempts.practice_attempt_id (nullable)
 * @property {string} [exam_attempt_id]      - FK -> exam_attempts.exam_attempt_id (nullable)
 * @property {string} [question_id]          - FK -> questions.question_id (nullable)
 * @property {string} [exam_question_id]     - FK -> exam_questions.exam_question_id (nullable)
 * @property {string[]} selected_answer_option_ids   - uuid[], default []
 * @property {number[]} selected_exam_option_indexes - integer[], default []
 * @property {boolean|null} is_correct
 * @property {number} score_awarded
 * @property {"unreviewed"|"reviewed"|"marked_for_retry"|"mastered"} review_status
 * @property {string} answered_at
 */
