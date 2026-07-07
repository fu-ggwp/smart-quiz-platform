import { GoogleGenAI } from "@google/genai";
import { env } from "../../config/env.js";
import { httpError } from "../../utils/api-response.js";

const aiUnavailableMessage = "AI processing is currently unavailable. Please try again later.";

// Gemini is asked for strict JSON so the question-bank editor can consume drafts safely.
const generatedQuestionsSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          question_text: { type: "string" },
          explanation: { type: "string" },
          chapter: { type: "string" },
          options: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                option_text: { type: "string" },
                is_correct: { type: "boolean" },
              },
              required: ["option_text", "is_correct"],
            },
          },
        },
        required: ["question_text", "explanation", "chapter", "options"],
      },
    },
  },
  required: ["questions"],
};

/**
 * Fail fast when Gemini is not configured instead of sending a broken request.
 */
function requireGeminiApiKey() {
  if (!env.geminiApiKey) {
    throw httpError(aiUnavailableMessage, 503);
  }
}

/**
 * Parse Gemini JSON output, tolerating accidental markdown fences.
 */
function parseGeminiJson(text = "") {
  const trimmed = String(text || "").trim();
  const withoutFence = trimmed
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  return JSON.parse(withoutFence);
}

/**
 * Normalize one AI option into the same shape used by the editor draft.
 */
function normalizeGeneratedOption(option = {}) {
  return {
    option_text: option.option_text || "",
    is_correct: Boolean(option.is_correct),
  };
}

/**
 * Normalize one AI question and drop blank option text.
 */
function normalizeGeneratedQuestion(question = {}) {
  const options = Array.isArray(question.options)
    ? question.options.map(normalizeGeneratedOption).filter((option) => option.option_text)
    : [];

  return {
    question_text: question.question_text || "",
    explanation: question.explanation || "",
    chapter: question.chapter || "",
    options,
  };
}

/**
 * Keep only usable generated questions and cap the result to the requested count.
 */
function normalizeGeneratedQuestions(responseBody, requestedCount) {
  const questions = Array.isArray(responseBody?.questions) ? responseBody.questions : [];

  return questions
    .map(normalizeGeneratedQuestion)
    .filter((question) => (
      question.question_text &&
      question.options.length >= 2 &&
      question.options.some((option) => option.is_correct)
    ))
    .slice(0, requestedCount);
}

/**
 * Build the material-to-questions prompt. The schema controls structure;
 * this prompt controls teacher intent and quality rules.
 */
function buildGenerationPrompt({ questionCount, focus }) {
  return [
    "Generate multiple-choice questions from the attached learning material.",
    `Create exactly ${questionCount} questions when the material supports it.`,
    focus ? `Focus on this teacher request: ${focus}` : "Use the most important concepts from the material.",
    "Each question must have at least two answer options and at least one correct answer.",
    "Return JSON only. Do not include markdown or explanations outside JSON.",
  ].join("\n");
}

/**
 * Render options as A/B/C text for explanation prompts.
 */
function formatOptionList(options = []) {
  return options
    .map((option, index) => {
      const letter = String.fromCharCode(65 + index);
      return `${letter}. ${option.option_text}`;
    })
    .join("\n");
}

/**
 * Render the learner's selected options, including empty/invalid selections.
 */
function formatSelectedOptions(options = [], selectedOptionIds = []) {
  if (!selectedOptionIds.length) return "No answer selected.";

  const selected = options.filter((option) => selectedOptionIds.includes(option.answer_option_id));
  if (!selected.length) return "No matching selected answer found.";

  return formatOptionList(selected);
}

/**
 * Build context for an answer explanation without exposing app internals to the model.
 */
function buildAnswerExplanationPrompt({ studySet, question, attemptAnswer }) {
  const options = question.answer_options || [];
  const correctOptions = options.filter((option) => option.is_correct);

  return [
    "You are helping a learner understand a quiz answer.",
    "Explain the answer clearly and briefly. Use the same language as the question or existing explanation.",
    "Do not mention that you are an AI. Do not use markdown tables.",
    "",
    "Study set context:",
    `Title: ${studySet.title || "Untitled"}`,
    `Description: ${studySet.description || "No description"}`,
    `Topic: ${studySet.topic || "Not specified"}`,
    "",
    "Question:",
    question.question_text,
    "",
    "Answer options:",
    formatOptionList(options),
    "",
    "Correct answer:",
    formatOptionList(correctOptions),
    "",
    "Learner selected answer:",
    formatSelectedOptions(options, attemptAnswer?.selected_answer_option_ids || []),
    "",
    "Existing explanation:",
    question.explanation || "No existing explanation.",
    "",
    "Return one concise explanation paragraph plus, if helpful, one short sentence about why the selected answer is right or wrong.",
  ].join("\n");
}

/**
 * Generate reusable multiple-choice question drafts from an uploaded material file.
 */
export async function generateQuestionsFromMaterial({ file, questionCount, focus }) {
  requireGeminiApiKey();

  try {
    const ai = new GoogleGenAI({ apiKey: env.geminiApiKey });
    const response = await ai.models.generateContent({
      model: env.geminiModel,
      contents: [
        {
          inlineData: {
            mimeType: file.mimetype,
            data: file.buffer.toString("base64"),
          },
        },
        { text: buildGenerationPrompt({ questionCount, focus }) },
      ],
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: generatedQuestionsSchema,
        temperature: 0.3,
      },
    });

    const parsed = parseGeminiJson(response.text);
    const questions = normalizeGeneratedQuestions(parsed, questionCount);

    if (!questions.length) {
      throw httpError(aiUnavailableMessage, 502);
    }

    return { questions };
  } catch (error) {
    if (error.statusCode || error.status) throw error;
    throw httpError(aiUnavailableMessage, 502);
  }
}

/**
 * Generate a learner-friendly explanation for one submitted practice answer.
 */
export async function generateAnswerExplanation({ studySet, question, attemptAnswer }) {
  requireGeminiApiKey();

  try {
    const ai = new GoogleGenAI({ apiKey: env.geminiApiKey });
    const response = await ai.models.generateContent({
      model: env.geminiModel,
      contents: [{ text: buildAnswerExplanationPrompt({ studySet, question, attemptAnswer }) }],
      config: {
        temperature: 0.2,
      },
    });

    const aiExplanation = String(response.text || "").trim();
    if (!aiExplanation) {
      throw httpError(aiUnavailableMessage, 502);
    }

    return { aiExplanation };
  } catch (error) {
    if (error.status || error.statusCode) throw error;
    throw httpError(aiUnavailableMessage, 502);
  }
}
