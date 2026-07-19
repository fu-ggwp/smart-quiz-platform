// The earlier scaffold assumed a single `exams` table - the real schema splits
// this into `exam_sessions` (the scheduled exam) and `exam_questions` (a frozen
// snapshot of each question used in that session, including the answer options
// as JSON so edits to the source question don't change an existing exam).
// Learner attempts live in `exam_attempts` - see exam-attempt.model.js.
export const EXAM_SESSION_TABLE = "exam_sessions";
export const EXAM_QUESTION_TABLE = "exam_questions";

export const ExamSessionStatus = Object.freeze({
  DRAFT: "draft",
  ACTIVE: "active",
  CLOSED: "closed",
  ARCHIVED: "archived",
});

export const ExamResultVisibility = Object.freeze({
  COMPLETION_ONLY: "completion_only",
  SCORE_ONLY: "score_only",
  QUESTION_ANSWER: "question_answer",
});

export const ExamSessionConfigFields = Object.freeze({
  TITLE: "title",
  DESCRIPTION: "description",
  STATUS: "status",
  START_AT: "start_at",
  END_AT: "end_at",
  DURATION_MINUTES: "duration_minutes",
  ATTEMPT_LIMIT: "attempt_limit",
  QUESTION_COUNT: "question_count",
  RANDOMIZE_QUESTIONS: "randomize_questions",
  RANDOMIZE_ANSWERS: "randomize_answers",
  RESULT_VISIBILITY: "result_visibility",
  ACCESS_CODE: "access_code",
});

export const EXAM_SESSION_CONFIG_COLUMNS = Object.freeze(
  Object.values(ExamSessionConfigFields)
);

/**
 * @typedef {Object} ExamSession
 * @property {string} exam_session_id
 * @property {string} class_id           - FK -> classes.class_id
 * @property {string} teacher_id         - FK -> users.user_id
 * @property {string} question_bank_id   - FK -> question_banks.question_bank_id
 * @property {string} title
 * @property {string} [description]
 * @property {"draft"|"active"|"closed"|"archived"} status
 * @property {string} [start_at]
 * @property {string} [end_at]
 * @property {number} duration_minutes
 * @property {number} attempt_limit          - default 1
 * @property {number} question_count
 * @property {boolean} randomize_questions
 * @property {boolean} randomize_answers
 * @property {"completion_only"|"score_only"|"question_answer"} result_visibility
 * @property {string} [access_code]
 * @property {string} created_at
 * @property {string} updated_at
 * @property {string} [deleted_at]
 */

/**
 * @typedef {Object} ExamQuestion
 * @property {string} exam_question_id
 * @property {string} exam_session_id        - FK -> exam_sessions.exam_session_id
 * @property {string} [source_question_id]   - FK -> questions.question_id (nullable)
 * @property {string} question_text
 * @property {string} [explanation]
 * @property {string} [chapter]
 * @property {Object} answer_options_json    - jsonb snapshot of the options
 * @property {number[]} correct_option_indexes
 * @property {number} display_order
 * @property {string} created_at
 */
