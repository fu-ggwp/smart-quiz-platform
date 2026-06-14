import supabase, { supabaseAdmin } from "../../config/supabase.js";
import { createUserModel } from "../../models/user.model.js";
import * as questionBanksDao from "./question-banks.dao.js";

const db = supabaseAdmin || supabase;
const userModel = createUserModel(db);

const allowedVisibility = new Set(["private", "shared", "archived"]);
const allowedStatus = new Set(["draft", "reviewed", "archived"]);
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function serviceError(message, statusCode = 400, fields) {
  const error = new Error(message);
  error.status = statusCode;
  error.statusCode = statusCode;
  error.fields = fields;
  return error;
}

function requireUserId(userId) {
  if (!userId) {
    throw serviceError("Missing authenticated user.", 401);
  }
}

async function requireActiveTeacher(userId) {
  requireUserId(userId);

  const profile = await userModel.findById(userId);

  if (!profile || profile.deleted_at) {
    throw serviceError("You do not have permission to access or perform this action.", 403);
  }

  if (profile.account_status !== "active" || profile.active_role !== "teacher") {
    throw serviceError("You do not have permission to access or perform this action.", 403);
  }

  return profile;
}

function normalizeText(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return String(value).trim();
}

function validateEnum(value, allowedValues, fieldName, errors) {
  if (value === undefined || value === null || value === "") return undefined;
  const normalized = String(value).trim().toLowerCase();

  if (!allowedValues.has(normalized)) {
    errors[fieldName] = "The information is invalid. Please check and try again.";
  }

  return normalized;
}

function validateQuestionBankId(questionBankId) {
  if (!uuidRegex.test(String(questionBankId || ""))) {
    throw serviceError("The information is invalid. Please check and try again.", 400, {
      id: "Question bank id is invalid.",
    });
  }
}

function buildQuestionBankPayload(payload = {}, { partial = false } = {}) {
  const errors = {};
  const title = normalizeText(payload.title);
  const description = normalizeText(payload.description);
  const subject = normalizeText(payload.subject);
  const topic = normalizeText(payload.topic);
  const visibility = validateEnum(payload.visibility, allowedVisibility, "visibility", errors);
  const status = validateEnum(payload.status, allowedStatus, "status", errors);
  const changes = {};

  if (!partial || title !== undefined) {
    if (!title) {
      errors.title = "Please complete all required information.";
    } else {
      changes.title = title;
    }
  }

  if (description !== undefined) changes.description = description || null;
  if (subject !== undefined) changes.subject = subject || null;
  if (topic !== undefined) changes.topic = topic || null;
  if (visibility !== undefined) changes.visibility = visibility;
  if (status !== undefined) changes.status = status;

  if (!partial) {
    changes.visibility = changes.visibility || "private";
    changes.status = changes.status || "draft";
  }

  if (Object.keys(errors).length > 0) {
    const message = errors.title
      ? "Please complete all required information."
      : "The information is invalid. Please check and try again.";
    throw serviceError(message, 400, errors);
  }

  if (partial && Object.keys(changes).length === 0) {
    throw serviceError("No valid question bank fields were provided.", 400);
  }

  changes.updated_at = new Date().toISOString();
  return changes;
}

function normalizeListFilters(query = {}) {
  const errors = {};
  const visibility = validateEnum(query.visibility, allowedVisibility, "visibility", errors);
  const status = validateEnum(query.status, allowedStatus, "status", errors);

  if (Object.keys(errors).length > 0) {
    throw serviceError("The information is invalid. Please check and try again.", 400, errors);
  }

  return {
    keyword: normalizeText(query.keyword) || "",
    subject: normalizeText(query.subject) || "",
    visibility,
    status,
    page: query.page,
    limit: query.limit,
    sortBy: normalizeText(query.sortBy),
    sortOrder: normalizeText(query.sortOrder) === "asc" ? "asc" : "desc",
  };
}

async function attachQuestionCount(questionBank) {
  return {
    ...questionBank,
    questionCount: await questionBanksDao.countQuestions(questionBank.question_bank_id),
  };
}

function handleLoadError(error) {
  if (error) {
    throw serviceError("Failed to load data. Please check your connection and try again.", 500);
  }
}

export async function listQuestionBanks(userId, query) {
  await requireActiveTeacher(userId);

  const filters = normalizeListFilters(query);
  const { data, error, count, page, limit } = await questionBanksDao.listByTeacher(userId, filters);
  handleLoadError(error);

  const items = await Promise.all((data || []).map(attachQuestionCount));
  const total = count ?? items.length;

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: total > 0 ? Math.ceil(total / limit) : 0,
    },
  };
}

export async function listQuestionBankSubjects(userId) {
  await requireActiveTeacher(userId);

  const { data, error } = await questionBanksDao.listSubjectsByTeacher(userId);
  handleLoadError(error);

  return Array.from(
    new Set(
      (data || [])
        .map((row) => normalizeText(row.subject))
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));
}

export async function getQuestionBank(userId, questionBankId) {
  await requireActiveTeacher(userId);
  validateQuestionBankId(questionBankId);

  const { data, error } = await questionBanksDao.findOwnedById(questionBankId, userId);
  handleLoadError(error);

  if (!data) {
    throw serviceError("Question bank not found.", 404);
  }

  return attachQuestionCount(data);
}

export async function createQuestionBank(userId, payload) {
  await requireActiveTeacher(userId);

  const changes = buildQuestionBankPayload(payload);
  const { data, error } = await questionBanksDao.create({
    ...changes,
    teacher_id: userId,
  });

  if (error) {
    throw serviceError(error.message || "Question bank could not be created.", 400);
  }

  return {
    ...data,
    questionCount: 0,
  };
}

export async function updateQuestionBank(userId, questionBankId, payload) {
  await requireActiveTeacher(userId);
  validateQuestionBankId(questionBankId);

  const changes = buildQuestionBankPayload(payload, { partial: true });
  const { data, error } = await questionBanksDao.update(questionBankId, userId, changes);

  if (error) {
    throw serviceError(error.message || "Question bank could not be updated.", 400);
  }

  if (!data) {
    throw serviceError("Question bank not found.", 404);
  }

  return attachQuestionCount(data);
}

export async function deleteQuestionBank(userId, questionBankId) {
  await requireActiveTeacher(userId);
  validateQuestionBankId(questionBankId);

  const { data, error } = await questionBanksDao.softDelete(questionBankId, userId);

  if (error) {
    throw serviceError(
      error.message ||
        "This question bank cannot be permanently deleted because it is linked to existing records. You may archive or hide it instead.",
      400
    );
  }

  if (!data) {
    throw serviceError("Question bank not found.", 404);
  }

  return data;
}

