// Mirrors the `answer_options` table — choices belonging to a question.
// (The earlier scaffold used `content`/`order_index`; real columns are
// `option_text`/`display_order`.)
export const ANSWER_OPTION_TABLE = "answer_options";

/**
 * @typedef {Object} AnswerOption
 * @property {string} answer_option_id
 * @property {string} question_id  - FK -> questions.question_id
 * @property {string} option_text
 * @property {boolean} is_correct
 * @property {number} display_order
 * @property {string} created_at
 */
