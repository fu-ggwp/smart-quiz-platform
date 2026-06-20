// Mirrors the `questions` table. A question can belong to a question bank
// AND/OR a study set (both FKs nullable), and can be cloned from another
// question via the self-referencing `source_question_id`.
// (The earlier scaffold used `content`/`type`; the real prompt column is
// `question_text`.)
export const QUESTION_TABLE = "questions";

/**
 * @typedef {Object} Question
 * @property {string} question_id
 * @property {string} [question_bank_id]    - FK -> question_banks.question_bank_id (nullable)
 * @property {string} [study_set_id]        - FK -> study_sets.study_set_id (nullable)
 * @property {string} [source_question_id]  - FK -> questions.question_id (self, nullable)
 * @property {string} owner_id              - FK -> users.user_id
 * @property {string} question_text
 * @property {string} [explanation]
 * @property {string} [topic]
 * @property {string} [chapter]
 * @property {string} created_at
 * @property {string} updated_at
 * @property {string} [deleted_at]
 */
