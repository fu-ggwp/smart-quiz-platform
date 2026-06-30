const editableQuestionBankStatuses = new Set(["Draft", "Ready"]);

const supportedMaterialTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export function createValidationError(message, fields) {
  const error = new Error(message);
  error.status = 400;
  error.statusCode = 400;
  error.fields = fields;
  return error;
}

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

function validateEnum(value, allowedValues, fieldName, errors) {
  if (value === undefined || value === null || value === "") return undefined;

  const normalized = String(value).trim();
  if (!allowedValues.has(normalized)) {
    errors[fieldName] = "The information is invalid. Please check and try again.";
  }

  return normalized;
}

function throwIfInvalid(errors) {
  if (Object.keys(errors).length === 0) return;

  const message = errors.title
    ? "Please complete all required information."
    : "The information is invalid. Please check and try again.";

  throw createValidationError(message, errors);
}

function validateStatusFilter(value, errors) {
  return validateEnum(value, editableQuestionBankStatuses, "status", errors);
}

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

export function normalizeListFilters(query = {}) {
  const errors = {};
  const status = validateStatusFilter(query.status, errors);

  throwIfInvalid(errors);

  return {
    keyword: normalizeText(query.keyword) || "",
    status,
    page: query.page,
    limit: query.limit,
    sortBy: normalizeText(query.sortBy),
    sortOrder: normalizeText(query.sortOrder) === "asc" ? "asc" : "desc",
  };
}

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

export function validateGenerateMaterialPayload(body = {}, file) {
  const errors = {};
  const questionCount = Number(body.questionCount);

  if (!file) {
    errors.material = "Please upload a PDF or DOCX learning material file.";
  } else if (!supportedMaterialTypes.has(file.mimetype)) {
    errors.material = "Only PDF or DOCX files are supported.";
  }

  if (!Number.isInteger(questionCount) || questionCount < 1 || questionCount > 30) {
    errors.questionCount = "Question count must be a number from 1 to 30.";
  }

  if (Object.keys(errors).length > 0) {
    throw createValidationError(
      errors.material || errors.questionCount || "The information is invalid. Please check and try again.",
      errors,
    );
  }

  return {
    file,
    questionCount,
    focus: normalizeNullableText(body.focus) || "",
  };
}

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
    throw createValidationError("No valid question bank fields were provided.");
  }

  if (title !== undefined || description !== undefined || topic !== undefined || status !== undefined) {
    changes.updated_at = new Date().toISOString();
  }
  return changes;
}
