// Mirrors the `study_sets` table — flashcard/quiz sets created by teachers.
// NOTE: the link to classes is via the separate `study_set_assignments` join
// table (see study-set-assignment.model.js) — there is no class_id column here.
export const STUDY_SET_TABLE = "study_sets";

export const StudySetVisibility = Object.freeze({
  PUBLIC: "public",
  PRIVATE: "private",
  CLASS_ONLY: "class_only",
  HIDDEN: "hidden",
  ARCHIVED: "archived",
});

export const StudySetCreationMethod = Object.freeze({
  MANUAL: "manual",
  IMPORT: "import",
  AI_GENERATED: "ai_generated",
  FROM_QUESTION_BANK: "from_question_bank",
});

export const StudySetPracticeMode = Object.freeze({
  FLASHCARD: "flashcard",
  QUIZ: "quiz",
  FLASHCARD_AND_QUIZ: "flashcard_and_quiz",
});

export const StudySetCardOrder = Object.freeze({
  DEFAULT: "default",
  RANDOM: "random",
  DIFFICULTY_ASC: "difficulty_asc",
  DIFFICULTY_DESC: "difficulty_desc",
});

/**
 * @typedef {Object} StudySet
 * @property {string} study_set_id
 * @property {string} teacher_id                  - FK -> users.user_id
 * @property {string} [source_question_bank_id]   - FK -> question_banks.question_bank_id
 * @property {string} title
 * @property {string} [description]
 * @property {string} [subject]
 * @property {string} [topic]
 * @property {"public"|"private"|"class_only"|"hidden"|"archived"} visibility
 * @property {boolean} is_admin_hidden
 * @property {"manual"|"import"|"ai_generated"|"from_question_bank"} creation_method
 * @property {number} [target_accuracy]           - 0–100
 * @property {"flashcard"|"quiz"|"flashcard_and_quiz"} practice_mode
 * @property {number} [estimated_study_minutes]
 * @property {"default"|"random"|"difficulty_asc"|"difficulty_desc"} card_order
 * @property {string[]} tags
 * @property {boolean} include_explanations
 * @property {boolean} allow_copy_by_other_teachers
 * @property {boolean} track_learner_progress
 * @property {number} question_count
 * @property {string} created_at
 * @property {string} updated_at
 * @property {string} [deleted_at]
 */
