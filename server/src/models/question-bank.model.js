// Mirrors the `question_banks` table - a teacher's reusable question repository.
// (The earlier scaffold used a `name` column; the real column is `title`.)
export const QUESTION_BANK_TABLE = "question_banks";

export const QuestionBankStatus = Object.freeze({
  PRIVATE: "Private",
  ASSIGNED: "Assigned",
  DELETED: "Deleted",
});

/**
 * @typedef {Object} QuestionBank
 * @property {string} question_bank_id
 * @property {string} teacher_id   - FK -> users.user_id
 * @property {string} title
 * @property {string} [description]
 * @property {string} [topic]
 * @property {"Private"|"Assigned"|"Deleted"} status
 * @property {string} created_at
 * @property {string} updated_at
 * @property {string} [deleted_at]
 */