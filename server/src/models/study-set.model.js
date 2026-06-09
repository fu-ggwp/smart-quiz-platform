export const STUDY_SET_TABLE = "study_sets";

export const StudySetVisibility = Object.freeze({
  PUBLIC: "public",
  CLASS: "class",
  PRIVATE: "private",
  CLASS_ONLY: "class-only",
  HIDDEN: "hidden",
  ARCHIVED: "archived"
});

export const StudySetCreation = Object.freeze({
  MANUAL: "manual",
  IMPORT: "import",
  AI_GENERATED: "ai_generated",
  FROM_QUESTION_BANK: "from_question_bank"
});

export const StudySetCardPracticeMode = Object.freeze({
  FLASHCARD: "flashcard",
  QUIZ: "quiz",
  FLASHCARD_AND_QUIZ: "flashcard_and_quiz"
});

export const StudySetCardOrder = Object.freeze({
  DEFAULT: "default",
  RANDOM: "random",
  DIFFICULTY_ASC: "difficulty_asc",
  DIFFICULTY_DESC: "difficulty_desc",
})
/**
 * @typedef {Object} StudySet
 * @property {string} id
 * @property {string} owner_id
 * @property {string} title
 * @property {string} description
 * @property {"public"|"class"|"private"} visibility
 * @property {string} class_id  
 * @property {string} question_bank_id
 * @property {string} created_at
 * @property {string} updated_at
 */
