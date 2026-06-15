import {
  archiveQuestionBank,
  createQuestionBank,
  getQuestion,
  getQuestionBank,
  listQuestionBankQuestions,
  listQuestionBanks,
  updateQuestion as updateQuestionRecord,
  updateQuestionBank,
} from "./question-banks.service.js";
import {
  QuestionType,
} from "../../models/question.model.js";

const savedMessage = "Question bank information has been saved successfully.";
const allowedEditableStatus = new Set(["Private", "Assigned"]);
const allowedQuestionTypes = new Set(Object.values(QuestionType));

function getUserId(req) {
  return req.user?.id || req.user?.user_id;
}

function requestError(message, fields) {
  const error = new Error(message);
  error.status = 400;
  error.statusCode = 400;
  error.fields = fields;
  return error;
}

function sendError(res, error) {
  const statusCode = error.statusCode || error.status || 500;

  return res.status(statusCode).json({
    message: error.message || "Question bank request failed.",
    fields: error.fields,
  });
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

  throw requestError(message, errors);
}

function validateCreatePayload(body = {}) {
  const errors = {};
  const title = normalizeText(body.title);
  const status = validateEnum(body.status, allowedEditableStatus, "status", errors);

  if (!title) {
    errors.title = "Please complete all required information.";
  }

  throwIfInvalid(errors);

  return {
    title,
    description: normalizeNullableText(body.description),
    topic: normalizeNullableText(body.topic),
    status: status || "Private",
    updated_at: new Date().toISOString(),
  };
}

function validateUpdatePayload(body = {}) {
  const errors = {};
  const changes = {};
  const title = normalizeText(body.title);
  const description = normalizeNullableText(body.description);
  const topic = normalizeNullableText(body.topic);
  const status = validateEnum(body.status, allowedEditableStatus, "status", errors);

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

  throwIfInvalid(errors);

  if (Object.keys(changes).length === 0) {
    throw requestError("No valid question bank fields were provided.");
  }

  changes.updated_at = new Date().toISOString();
  return changes;
}

function normalizeScore(value, errors) {
  if (value === undefined || value === null || value === "") return 1;

  const score = Number(value);
  if (!Number.isFinite(score) || score < 0) {
    errors.score = "The information is invalid. Please check and try again.";
  }

  return score;
}

function validateAnswerOptions(options, questionType, errors) {
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

  if (questionType === QuestionType.MULTIPLE_CHOICE) {
    if (normalizedOptions.length < 2) {
      errors.answer_options = "Multiple choice questions need at least 2 answer options.";
    } else if (correctCount < 1) {
      errors.answer_options = "Select at least one correct answer.";
    }
  }

  if (questionType === QuestionType.TRUE_FALSE) {
    if (normalizedOptions.length !== 2) {
      errors.answer_options = "True/false questions need exactly 2 answer options.";
    } else if (correctCount !== 1) {
      errors.answer_options = "True/false questions need exactly one correct answer.";
    }
  }

  return normalizedOptions;
}

function validateQuestionPayload(body = {}) {
  const errors = {};
  const questionText = normalizeText(body.question_text);
  const questionType = validateEnum(
    body.question_type || QuestionType.MULTIPLE_CHOICE,
    allowedQuestionTypes,
    "question_type",
    errors,
  ) || QuestionType.MULTIPLE_CHOICE;
  const score = normalizeScore(body.score, errors);
  const answerOptions = validateAnswerOptions(
    body.answer_options,
    questionType,
    errors,
  );

  if (!questionText) {
    errors.question_text = "Please complete all required information.";
  }

  throwIfInvalid(errors);

  return {
    question_text: questionText,
    question_type: questionType,
    score,
    explanation: normalizeNullableText(body.explanation),
    subject: normalizeNullableText(body.subject),
    topic: normalizeNullableText(body.topic),
    chapter: normalizeNullableText(body.chapter),
    answer_options: answerOptions,
  };
}

export async function list(req, res) {
  try {
    const data = await listQuestionBanks(getUserId(req), req.query);
    return res.status(200).json({ data });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function getById(req, res) {
  try {
    const data = await getQuestionBank(getUserId(req), req.params.id);
    return res.status(200).json({ data });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function listQuestions(req, res) {
  try {
    const data = await listQuestionBankQuestions(getUserId(req), req.params.id);
    return res.status(200).json({ data });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function getQuestionById(req, res) {
  try {
    const data = await getQuestion(getUserId(req), req.params.questionId);
    return res.status(200).json({ data });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function create(req, res) {
  try {
    const payload = validateCreatePayload(req.body);
    const data = await createQuestionBank(getUserId(req), payload);
    return res.status(201).json({ message: savedMessage, data });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function update(req, res) {
  try {
    const changes = validateUpdatePayload(req.body);
    const data = await updateQuestionBank(getUserId(req), req.params.id, changes);
    return res.status(200).json({ message: savedMessage, data });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function updateQuestion(req, res) {
  try {
    const payload = validateQuestionPayload(req.body);
    const data = await updateQuestionRecord(
      getUserId(req),
      req.params.questionId,
      payload,
    );
    return res.status(200).json({ message: savedMessage, data });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function remove(req, res) {
  try {
    const data = await archiveQuestionBank(getUserId(req), req.params.id);
    return res.status(200).json({
      message: "Question bank delete completed successfully.",
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
}
