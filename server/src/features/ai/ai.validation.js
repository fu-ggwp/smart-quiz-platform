import { httpError } from "../../utils/api-response.js";

const supportedMaterialType = "application/pdf";
const maxQuestionCount = 20;

function normalizeText(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return String(value).trim();
}

function normalizeNullableText(value) {
  const normalized = normalizeText(value);
  if (normalized === undefined) return undefined;
  return normalized || null;
}

export function getUserId(req) {
  return req.user?.id || req.user?.user_id;
}

/**
 * Validate the multipart AI generation request before sending any file to Gemini.
 */
export function validateGenerateMaterialPayload(body = {}, file) {
  const errors = {};
  const questionCount = Number(body.questionCount);

  if (!file) {
    errors.material = "Please upload a PDF learning material file.";
  } else if (file.mimetype !== supportedMaterialType) {
    errors.material = "Only PDF files are supported.";
  }

  if (!Number.isInteger(questionCount) || questionCount < 1) {
    errors.questionCount = "Desired question count must be at least 1.";
  } else if (questionCount > maxQuestionCount) {
    errors.questionCount = `The system limits generation to ${maxQuestionCount} questions to ensure question quality.`;
  }

  if (Object.keys(errors).length > 0) {
    throw httpError(
      errors.material || errors.questionCount || "The information is invalid. Please check and try again.",
      400,
      errors,
    );
  }

  return {
    file,
    questionCount,
    focus: normalizeNullableText(body.focus) || "",
  };
}
