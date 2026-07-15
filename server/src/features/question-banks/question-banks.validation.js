import { httpError } from "../../utils/api-response.js";

const editableQuestionBankStatuses = new Set(["Draft", "Ready"]);

export function getUserId(req) {
  return req.user?.id || req.user?.user_id;
}

export function questionBankLoadError() {
  return httpError(
    "Failed to load data. Please check your connection and try again.",
    500,
  );
}

/**
 * Trim text fields but preserve undefined so PATCH requests can skip fields.
 */
function normalizeText(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return String(value).trim();
}

/**
 * Convert empty optional text to null, matching nullable DB columns.
 */
function normalizeNullableText(value) {
  const normalized = normalizeText(value);
  if (normalized === undefined) return undefined;
  return normalized || null;
}

/**
 * Validate enum-like fields and collect field errors instead of throwing early.
 */
function validateEnum(value, allowedValues, fieldName, errors) {
  if (value === undefined || value === null || value === "") return undefined;

  const normalized = String(value).trim();
  if (!allowedValues.has(normalized)) {
    errors[fieldName] = "The information is invalid. Please check and try again.";
  }

  return normalized;
}

/**
 * Throw one API error after all field-level validation has run.
 */
function throwIfInvalid(errors) {
  if (Object.keys(errors).length === 0) return;

  const message = errors.title
    ? "Please complete all required information."
    : "The information is invalid. Please check and try again.";

  throw httpError(message, 400, errors);
}

function validateStatusFilter(value, errors) {
  return validateEnum(value, editableQuestionBankStatuses, "status", errors);
}

/**
 * Normalize answer options and enforce the minimum multiple-choice rules.
 */
function validateAnswerOptions(options, errors) {
  if (!Array.isArray(options)) {
    errors.answer_options = "Please complete all required information.";
    return [];
  }

  const normalizedOptions = options.map((option, index) => {
    const optionText = normalizeText(option?.option_text);

    if (!optionText) {
      errors[`answer_options.${index}.option_text`] =
        "Please complete all required information.";
    }

    return {
      option_text: optionText || "",
      is_correct: Boolean(option?.is_correct),
    };
  });
  const correctCount = normalizedOptions.filter((option) => option.is_correct).length;

  if (normalizedOptions.length < 2) {
    errors.answer_options = "Questions need at least 2 answer options.";
  } else if (correctCount < 1) {
    errors.answer_options = "Select at least one correct answer.";
  }

  return normalizedOptions;
}

/**
 * Validate one question card payload before it reaches the service layer.
 */
function validateQuestionPayload(body = {}) {
  const errors = {};
  const questionText = normalizeText(body.question_text);
  const answerOptions = validateAnswerOptions(body.answer_options, errors);

  if (!questionText) {
    errors.question_text = "Please complete all required information.";
  }

  throwIfInvalid(errors);

  return {
    question_text: questionText,
    explanation: normalizeNullableText(body.explanation),
    chapter: normalizeNullableText(body.chapter),
    answer_options: answerOptions,
  };
}

/**
 * Validate a full question list and rewrite nested errors with question indexes.
 */
function validateQuestionsPayload(questions, errors) {
  if (!Array.isArray(questions)) {
    errors.questions = "The information is invalid. Please check and try again.";
    return [];
  }

  return questions.map((question, index) => {
    try {
      const payload = validateQuestionPayload({
        ...question,
        answer_options: question?.answer_options || question?.options,
      });

      if (question?.question_id) payload.question_id = String(question.question_id).trim();
      if (question?.source_question_id) payload.source_question_id = String(question.source_question_id).trim();

      return payload;
    } catch (error) {
      const fieldErrors = error.fields || {};

      Object.entries(fieldErrors).forEach(([field, message]) => {
        errors[`questions.${index}.${field}`] = message;
      });

      if (Object.keys(fieldErrors).length === 0) {
        errors[`questions.${index}`] = error.message;
      }

      return null;
    }
  }).filter(Boolean);
}

/**
 * Normalize list filters used by the teacher question-bank table.
 */
export function normalizeListFilters(query = {}) {
  const errors = {};
  const status = validateStatusFilter(query.status, errors);

  throwIfInvalid(errors);

  return {
    keyword: normalizeText(query.keyword) || "",
    status,
    page: query.page,
    limit: query.limit,
  };
}

/**
 * Validate create payload: required metadata plus optional question drafts.
 */
export function validateCreatePayload(body = {}) {
  const errors = {};
  const title = normalizeText(body.title);
  const status = validateEnum(body.status, editableQuestionBankStatuses, "status", errors);
  const questions = body.questions === undefined
    ? undefined
    : validateQuestionsPayload(body.questions, errors);

  if (!title) {
    errors.title = "Please complete all required information.";
  }

  throwIfInvalid(errors);

  return {
    title,
    description: normalizeNullableText(body.description),
    topic: normalizeNullableText(body.topic),
    status: status || "Draft",
    updated_at: new Date().toISOString(),
    ...(questions !== undefined ? { questions } : {}),
  };
}

/**
 * Build a PATCH changes object and include questions only when the client sends them.
 */
export function validateUpdatePayload(body = {}) {
  const errors = {};
  const changes = {};
  const title = normalizeText(body.title);
  const description = normalizeNullableText(body.description);
  const topic = normalizeNullableText(body.topic);
  const status = validateEnum(body.status, editableQuestionBankStatuses, "status", errors);

  if (body.title !== undefined) {
    if (!title) {
      errors.title = "Please complete all required information.";
    } else {
      changes.title = title;
    }
  }

  if (description !== undefined) changes.description = description;
  if (topic !== undefined) changes.topic = topic;
  if (status !== undefined) changes.status = status;

  if (body.questions !== undefined) {
    changes.questions = validateQuestionsPayload(body.questions, errors);
  }

  throwIfInvalid(errors);

  if (Object.keys(changes).length === 0) {
    throw httpError("No valid question bank fields were provided.");
  }

  if (title !== undefined || description !== undefined || topic !== undefined || status !== undefined) {
    changes.updated_at = new Date().toISOString();
  }
  return changes;
}
