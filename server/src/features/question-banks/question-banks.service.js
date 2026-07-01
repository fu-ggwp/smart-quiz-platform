import { supabase } from "../../config/supabase.js";
import { createUserModel } from "../../models/user.model.js";
import { httpError } from "../../utils/api-response.js";
import { requirePremiumFeature } from "../../utils/premium-access.js";
import * as aiService from "../ai/ai.service.js";
import * as questionBanksDao from "./question-banks.dao.js";
import { normalizeListFilters } from "./question-banks.validation.js";

const db = supabase;
const userModel = createUserModel(db);

const materialQuestionGenerationFeature = "ai_generate_from_material";
const premiumRequiredMessage = "This feature is available for Premium accounts only. Please upgrade to continue.";

function requireUserId(userId) {
  if (!userId) {
    throw httpError("Missing authenticated user.", 401);
  }
}

async function requireActiveTeacher(userId) {
  requireUserId(userId);

  const profile = await userModel.findById(userId);

  if (!profile || profile.deleted_at) {
    throw httpError(
      "You do not have permission to access or perform this action.",
      403,
    );
  }

  if (
    profile.account_status !== "active" ||
    profile.active_role !== "teacher"
  ) {
    throw httpError(
      "You do not have permission to access or perform this action.",
      403,
    );
  }

  return profile;
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

  throw httpError(
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

function buildNewQuestion(questionBankId, teacherId, payload) {
  return {
    question_bank_id: questionBankId,
    study_set_id: null,
    source_question_id: payload.source_question_id || null,
    owner_id: teacherId,
    question_text: payload.question_text,
    explanation: payload.explanation,
    chapter: payload.chapter,
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
    throw httpError(
      "Failed to load data. Please check your connection and try again.",
      500,
    );
  }
}

export async function generateQuestionsFromMaterial(userId, { file, questionCount, focus }) {
  await requireActiveTeacher(userId);
  await requirePremiumFeature(userId, materialQuestionGenerationFeature, premiumRequiredMessage);

  return aiService.generateQuestionsFromMaterial({ file, questionCount, focus });
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

export async function listReadyQuestionBanks(userId) {
  await requireActiveTeacher(userId);

  const { data, error } = await questionBanksDao.listReadyByTeacher(userId);
  handleLoadError(error);

  return Promise.all((data || []).map(attachQuestionCount));
}

export async function getQuestionBank(userId, questionBankId) {
  await requireActiveTeacher(userId);

  const { data, error } = await questionBanksDao.findOwnedById(
    questionBankId,
    userId,
  );
  handleLoadError(error);

  if (!data) {
    throw httpError("Question bank not found.", 404);
  }

  return attachQuestionCount(data);
}

export async function getReadyQuestionBank(userId, questionBankId) {
  await requireActiveTeacher(userId);

  const { data, error } = await questionBanksDao.findReadyOwnedById(
    questionBankId,
    userId,
  );
  handleLoadError(error);

  if (!data) {
    throw httpError("Select one of your ready question banks.", 400, {
      questionBankId: "Select one of your ready question banks.",
      question_bank_id: "Select one of your ready question banks.",
    });
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
    throw httpError("Question bank not found.", 404);
  }

  const { data, error } = await questionBanksDao.listQuestionsByBank(
    questionBankId,
    userId,
  );
  handleLoadError(error);

  return (data || []).map(sortQuestionAnswerOptions);
}

export async function listReadyQuestionBankQuestions(userId, questionBankId) {
  await getReadyQuestionBank(userId, questionBankId);

  const { data, error } = await questionBanksDao.listQuestionsByBank(
    questionBankId,
    userId,
  );
  handleLoadError(error);

  return (data || []).map(sortQuestionAnswerOptions);
}

async function getQuestion(userId, questionId) {
  await requireActiveTeacher(userId);

  const { data, error } = await questionBanksDao.findOwnedQuestionById(
    questionId,
    userId,
  );
  handleLoadError(error);

  if (!data) {
    throw httpError("Question not found.", 404);
  }

  return sortQuestionAnswerOptions(data);
}

async function updateQuestion(userId, questionId, payload) {
  await requireActiveTeacher(userId);

  const current = await questionBanksDao.findOwnedQuestionById(
    questionId,
    userId,
  );
  handleLoadError(current.error);

  if (!current.data) {
    throw httpError("Question not found.", 404);
  }

  const { answer_options: answerOptions, ...changes } = payload;
  const questionChanges = buildQuestionChanges(changes);

  async function updateQuestionFields(changesToApply = questionChanges) {
    const { data, error } = await questionBanksDao.updateQuestion(
      questionId,
      userId,
      changesToApply,
    );

    if (error) {
      throw httpError(error.message || "Question could not be updated.", 400);
    }

    if (!data) {
      throw httpError("Question not found.", 404);
    }
  }

  await syncQuestionAnswerOptions(
    questionId,
    current.data.answer_options,
    answerOptions,
  );

  await updateQuestionFields();

  return getQuestion(userId, questionId);
}

async function createQuestionInBank(userId, questionBankId, payload) {
  const { answer_options: answerOptions, ...questionFields } = payload;
  const { data, error } = await questionBanksDao.createQuestion(
    buildNewQuestion(questionBankId, userId, questionFields),
  );

  if (error) {
    throw httpError(error.message || "Question could not be created.", 400);
  }

  await syncQuestionAnswerOptions(data.question_id, [], answerOptions);
  return getQuestion(userId, data.question_id);
}

async function updateQuestionInBank(userId, questionBankId, payload) {
  const { question_id: questionId, ...questionPayload } = payload;
  const current = await questionBanksDao.findOwnedQuestionById(
    questionId,
    userId,
  );
  handleLoadError(current.error);

  if (!current.data || current.data.question_bank_id !== questionBankId) {
    throw httpError("Question not found.", 404);
  }

  return updateQuestion(userId, questionId, questionPayload);
}

async function syncQuestionBankQuestions(userId, questionBankId, questions) {
  if (!Array.isArray(questions)) return;

  const existingResult = await questionBanksDao.listQuestionsByBank(
    questionBankId,
    userId,
  );
  handleLoadError(existingResult.error);

  const existingIds = new Set(
    (existingResult.data || []).map((question) => question.question_id),
  );
  const retainedIds = new Set();

  for (const question of questions) {
    if (question.question_id) {
      const updated = await updateQuestionInBank(userId, questionBankId, question);
      retainedIds.add(updated.question_id);
      continue;
    }

    const created = await createQuestionInBank(userId, questionBankId, question);
    retainedIds.add(created.question_id);
  }

  const removedIds = [...existingIds].filter((questionId) => !retainedIds.has(questionId));
  const deleteResult = await questionBanksDao.archiveQuestionsByIds(
    questionBankId,
    userId,
    removedIds,
  );

  if (deleteResult.error) {
    throw httpError(deleteResult.error.message || "Questions could not be deleted.", 400);
  }
}

export async function createQuestionBank(userId, payload) {
  await requireActiveTeacher(userId);
  const { questions, ...bankPayload } = payload;

  const { data, error } = await questionBanksDao.create({
    ...bankPayload,
    teacher_id: userId,
  });

  if (error) {
    throw httpError(
      error.message || "Question bank could not be created.",
      400,
    );
  }

  await syncQuestionBankQuestions(userId, data.question_bank_id, questions);

  return attachQuestionCount(data);
}

export async function updateQuestionBank(userId, questionBankId, changes) {
  await requireActiveTeacher(userId);

  const { questions, ...metadataChanges } = changes;
  let data;

  if (Object.keys(metadataChanges).length > 0) {
    const updateResult = await questionBanksDao.update(
      questionBankId,
      userId,
      metadataChanges,
    );

    if (updateResult.error) {
      throw httpError(
        updateResult.error.message || "Question bank could not be updated.",
        400,
      );
    }

    data = updateResult.data;
  } else {
    const findResult = await questionBanksDao.findOwnedById(questionBankId, userId);
    handleLoadError(findResult.error);
    data = findResult.data;
  }

  if (!data) {
    throw httpError("Question bank not found.", 404);
  }

  await syncQuestionBankQuestions(userId, questionBankId, questions);

  return attachQuestionCount(data);
}

export async function archiveQuestionBank(userId, questionBankId) {
  await requireActiveTeacher(userId);

  const { data, error } = await questionBanksDao.archive(
    questionBankId,
    userId,
  );

  if (error) {
    throw httpError(error.message || "Question bank delete failed.", 400);
  }

  if (!data) {
    throw httpError("Question bank not found.", 404);
  }

  return data;
}

