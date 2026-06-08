// Mirrors the `ai_interactions` table — logs of Gemini-API-assisted features
// (answer explanations, question generation).
// (Corrects the FK from the nonexistent `profiles.id` to `users.user_id`,
// and the enum value from "explanation" to the real "answer_explanation".)
export const AI_INTERACTION_TABLE = "ai_interactions";

export const AiInteractionType = Object.freeze({
  ANSWER_EXPLANATION: "answer_explanation",
  QUESTION_GENERATION: "question_generation",
});

export const AiInteractionStatus = Object.freeze({
  SUCCESSFUL: "successful",
  FAILED: "failed",
  BLOCKED: "blocked",
});

/**
 * @typedef {Object} AiInteraction
 * @property {string} ai_interaction_id
 * @property {string} user_id        - FK -> users.user_id
 * @property {string} [question_id]  - FK -> questions.question_id (nullable)
 * @property {"answer_explanation"|"question_generation"} interaction_type
 * @property {string} [prompt_summary]
 * @property {string} [response_summary]
 * @property {"successful"|"failed"|"blocked"} status
 * @property {string} provider       - default "Gemini API"
 * @property {string} created_at
 */
