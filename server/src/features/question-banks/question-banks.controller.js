import {
  archiveQuestionBank,
  createQuestionBank,
  getQuestionBank,
  listQuestionBanks,
  updateQuestionBank,
} from "./question-banks.service.js";

const savedMessage = "Question bank information has been saved successfully.";
const allowedEditableStatus = new Set(["Private", "Assigned"]);

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