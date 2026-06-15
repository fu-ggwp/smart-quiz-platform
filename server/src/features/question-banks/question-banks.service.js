import supabase, { supabaseAdmin } from "../../config/supabase.js";
import { createUserModel } from "../../models/user.model.js";
import * as questionBanksDao from "./question-banks.dao.js";

const db = supabaseAdmin || supabase;
const userModel = createUserModel(db);

const allowedStatus = new Set(["Private", "Assigned"]);

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
    throw serviceError(
      "You do not have permission to access or perform this action.",
      403,
    );
  }

  if (
    profile.account_status !== "active" ||
    profile.active_role !== "teacher"
  ) {
    throw serviceError(
      "You do not have permission to access or perform this action.",
      403,
    );
  }

  return profile;
}

function normalizeText(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return String(value).trim();
}

function validateStatusFilter(value, errors) {
  if (value === undefined || value === null || value === "") return undefined;

  const normalized = String(value).trim();
  if (!allowedStatus.has(normalized)) {
    errors.status = "The information is invalid. Please check and try again.";
  }

  return normalized;
}

function normalizeListFilters(query = {}) {
  const errors = {};
  const status = validateStatusFilter(query.status, errors);

  if (Object.keys(errors).length > 0) {
    throw serviceError(
      "The information is invalid. Please check and try again.",
      400,
      errors,
    );
  }

  return {
    keyword: normalizeText(query.keyword) || "",
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
    questionCount: await questionBanksDao.countQuestions(
      questionBank.question_bank_id,
    ),
  };
}

function sortQuestionAnswerOptions(question) {
  return {
    ...question,
    answer_options: [...(question.answer_options || [])].sort(
      (left, right) => left.display_order - right.display_order,
    ),
  };
}

function optionUpdateError(error) {
  if (!error) return;

  throw serviceError(
    error.message || "Question answer options could not be updated.",
    400,
  );
}

function buildQuestionChanges(changes) {
  return {
    ...changes,
    updated_at: new Date().toISOString(),
  };
}

function normalizeDesiredAnswerOptions(answerOptions) {
  return answerOptions.map((option, index) => ({
    option_text: option.option_text,
    is_correct: option.is_correct,
    display_order: index + 1,
  }));
}

async function syncQuestionAnswerOptions(questionId, currentOptions, answerOptions) {
  const current = [...(currentOptions || [])].sort(
    (left, right) => left.display_order - right.display_order,
  );
  const desired = normalizeDesiredAnswerOptions(answerOptions);
  const missingRows = desired.slice(current.length).map((option) => ({
    question_id: questionId,
    ...option,
  }));

  const insertResult = await questionBanksDao.insertAnswerOptions(missingRows);
  optionUpdateError(insertResult.error);

  const available = [...current, ...(insertResult.data || [])].sort(
    (left, right) => left.display_order - right.display_order,
  );
  const retained = available.slice(0, desired.length);

  for (let index = 0; index < retained.length; index += 1) {
    const updateResult = await questionBanksDao.updateAnswerOption(
      retained[index].answer_option_id,
      questionId,
      desired[index],
    );

    optionUpdateError(updateResult.error);
  }

  const surplusIds = available
    .slice(desired.length)
    .map((option) => option.answer_option_id);
  const deleteResult = await questionBanksDao.deleteAnswerOptionsByIds(
    questionId,
    surplusIds,
  );
  optionUpdateError(deleteResult.error);
}

function handleLoadError(error) {
  if (error) {
    throw serviceError(
      "Failed to load data. Please check your connection and try again.",
      500,
    );
  }
}

export async function listQuestionBanks(userId, query) {
  await requireActiveTeacher(userId);

  const filters = normalizeListFilters(query);
  const { data, error, count, page, limit } =
    await questionBanksDao.listByTeacher(userId, filters);
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

export async function getQuestionBank(userId, questionBankId) {
  await requireActiveTeacher(userId);

  const { data, error } = await questionBanksDao.findOwnedById(
    questionBankId,
    userId,
  );
  handleLoadError(error);

  if (!data) {
    throw serviceError("Question bank not found.", 404);
  }

  return attachQuestionCount(data);
}

export async function listQuestionBankQuestions(userId, questionBankId) {
  await requireActiveTeacher(userId);

  const bankResult = await questionBanksDao.findOwnedById(
    questionBankId,
    userId,
  );
  handleLoadError(bankResult.error);

  if (!bankResult.data) {
    throw serviceError("Question bank not found.", 404);
  }

  const { data, error } = await questionBanksDao.listQuestionsByBank(
    questionBankId,
    userId,
  );
  handleLoadError(error);

  return (data || []).map(sortQuestionAnswerOptions);
}

export async function getQuestion(userId, questionId) {
  await requireActiveTeacher(userId);

  const { data, error } = await questionBanksDao.findOwnedQuestionById(
    questionId,
    userId,
  );
  handleLoadError(error);

  if (!data) {
    throw serviceError("Question not found.", 404);
  }

  return sortQuestionAnswerOptions(data);
}

export async function updateQuestion(userId, questionId, payload) {
  await requireActiveTeacher(userId);

  const current = await questionBanksDao.findOwnedQuestionById(
    questionId,
    userId,
  );
  handleLoadError(current.error);

  if (!current.data) {
    throw serviceError("Question not found.", 404);
  }

  const { answer_options: answerOptions, ...changes } = payload;
  const questionChanges = buildQuestionChanges(changes);
  const currentQuestionType = current.data.question_type;
  const nextQuestionType = questionChanges.question_type;
  const shouldUpdateTypeBeforeOptions =
    currentQuestionType === "true_false" &&
    nextQuestionType === "multiple_choice";

  async function updateQuestionFields(changesToApply = questionChanges) {
    const { data, error } = await questionBanksDao.updateQuestion(
      questionId,
      userId,
      changesToApply,
    );

    if (error) {
      throw serviceError(error.message || "Question could not be updated.", 400);
    }

    if (!data) {
      throw serviceError("Question not found.", 404);
    }
  }

  if (shouldUpdateTypeBeforeOptions) {
    await updateQuestionFields({
      question_type: nextQuestionType,
      updated_at: new Date().toISOString(),
    });
  }

  await syncQuestionAnswerOptions(
    questionId,
    current.data.answer_options,
    answerOptions,
  );

  await updateQuestionFields();

  return getQuestion(userId, questionId);
}

export async function createQuestionBank(userId, payload) {
  await requireActiveTeacher(userId);

  const { data, error } = await questionBanksDao.create({
    ...payload,
    teacher_id: userId,
  });

  if (error) {
    throw serviceError(
      error.message || "Question bank could not be created.",
      400,
    );
  }

  return {
    ...data,
    questionCount: 0,
  };
}

export async function updateQuestionBank(userId, questionBankId, changes) {
  await requireActiveTeacher(userId);

  const { data, error } = await questionBanksDao.update(
    questionBankId,
    userId,
    changes,
  );

  if (error) {
    throw serviceError(
      error.message || "Question bank could not be updated.",
      400,
    );
  }

  if (!data) {
    throw serviceError("Question bank not found.", 404);
  }

  return attachQuestionCount(data);
}

export async function archiveQuestionBank(userId, questionBankId) {
  await requireActiveTeacher(userId);

  const { data, error } = await questionBanksDao.archive(
    questionBankId,
    userId,
  );

  if (error) {
    throw serviceError(error.message || "Question bank delete failed.", 400);
  }

  if (!data) {
    throw serviceError("Question bank not found.", 404);
  }

  return data;
}

export const deleteQuestionBank = archiveQuestionBank;
