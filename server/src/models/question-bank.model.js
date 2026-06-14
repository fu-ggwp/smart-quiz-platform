// Mirrors the `question_banks` table — a teacher's reusable question repository.
// (The earlier scaffold used a `name` column; the real column is `title`.)
export const QUESTION_BANK_TABLE = "question_banks";

export const QuestionBankVisibility = Object.freeze({
  PRIVATE: "private",
  SHARED: "shared",
  ARCHIVED: "archived",
});

export const QuestionBankStatus = Object.freeze({
  DRAFT: "draft",
  REVIEWED: "reviewed",
  ARCHIVED: "archived",
});

/**
 * @typedef {Object} QuestionBank
 * @property {string} question_bank_id
 * @property {string} teacher_id   - FK -> users.user_id
 * @property {string} title
 * @property {string} [description]
 * @property {string} [topic]
 * @property {"private"|"shared"|"archived"} visibility
 * @property {"draft"|"reviewed"|"archived"} status
 * @property {string} created_at
 * @property {string} updated_at
 * @property {string} [deleted_at]
 */
