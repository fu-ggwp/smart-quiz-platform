// Mirrors the `questions` table. A question can belong to a question bank
// AND/OR a study set (both FKs nullable), and can be cloned from another
// question via the self-referencing `source_question_id`.
// (The earlier scaffold used `content`/`type`; real columns are
// `question_text`/`question_type`.)
export const QUESTION_TABLE = "questions";

export const QuestionType = Object.freeze({
  MULTIPLE_CHOICE: "multiple_choice",
  TRUE_FALSE: "true_false",
});

export const QuestionDifficulty = Object.freeze({
  EASY: "easy",
  MEDIUM: "medium",
  HARD: "hard",
});

export const QuestionStatus = Object.freeze({
  ACTIVE: "active",
  HIDDEN: "hidden",
  ARCHIVED: "archived",
});

/**
 * @typedef {Object} Question
 * @property {string} question_id
 * @property {string} [question_bank_id]    - FK -> question_banks.question_bank_id (nullable)
 * @property {string} [study_set_id]        - FK -> study_sets.study_set_id (nullable)
 * @property {string} [source_question_id]  - FK -> questions.question_id (self, nullable)
 * @property {string} owner_id              - FK -> users.user_id
 * @property {string} question_text
 * @property {"multiple_choice"|"true_false"} question_type
 * @property {number} score
 * @property {string} [explanation]
 * @property {string} [subject]
 * @property {string} [topic]
 * @property {string} [chapter]
 * @property {string} [lesson]
 * @property {"easy"|"medium"|"hard"} difficulty
 * @property {"active"|"hidden"|"archived"} status
 * @property {string} created_at
 * @property {string} updated_at
 * @property {string} [deleted_at]
 */
