import { GoogleGenAI } from "@google/genai";
import { env } from "../../config/env.js";
import { supabase } from "../../config/supabase.js";
import { createUserModel } from "../../models/user.model.js";
import * as questionBanksDao from "./question-banks.dao.js";

const db = supabase;
const userModel = createUserModel(db);

const allowedStatus = new Set(["Draft", "Ready"]);
const premiumRequiredMessage = "This feature is available for Premium accounts only. Please upgrade to continue.";
const aiUnavailableMessage = "AI processing is currently unavailable. Please try again later.";

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

function requirePremiumTeacher(profile) {
  if (!profile?.is_premium) {
    throw serviceError(premiumRequiredMessage, 403);
  }
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
    throw serviceError(
      "Failed to load data. Please check your connection and try again.",
      500,
    );
  }
}

function parseGeminiJson(text = "") {
  const trimmed = String(text || "").trim();
  const withoutFence = trimmed
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  return JSON.parse(withoutFence);
}

function normalizeGeneratedOption(option = {}) {
  return {
    option_text: normalizeText(option.option_text) || "",
    is_correct: Boolean(option.is_correct),
  };
}

function normalizeGeneratedQuestion(question = {}) {
  const options = Array.isArray(question.options)
    ? question.options.map(normalizeGeneratedOption).filter((option) => option.option_text)
    : [];

  return {
    question_text: normalizeText(question.question_text) || "",
    explanation: normalizeText(question.explanation) || "",
    chapter: normalizeText(question.chapter) || "",
    options,
  };
}

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

function buildGenerationPrompt({ questionCount, focus }) {
  return [
    "Generate multiple-choice questions from the attached learning material.",
    `Create exactly ${questionCount} questions when the material supports it.`,
    focus ? `Focus on this teacher request: ${focus}` : "Use the most important concepts from the material.",
    "Each question must have at least two answer options and at least one correct answer.",
    "Return JSON only. Do not include markdown or explanations outside JSON.",
  ].join("\n");
}

export async function generateQuestionsFromMaterial(userId, { file, questionCount, focus }) {
  const profile = await requireActiveTeacher(userId);
  requirePremiumTeacher(profile);

  if (!env.geminiApiKey) {
    throw serviceError(aiUnavailableMessage, 503);
  }

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
      throw serviceError(aiUnavailableMessage, 502);
    }

    return { questions };
  } catch (error) {
    if (error.statusCode || error.status) throw error;
    throw serviceError(aiUnavailableMessage, 502);
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
    throw serviceError("Question bank not found.", 404);
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
    throw serviceError("Select one of your ready question banks.", 400, {
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
    throw serviceError("Question bank not found.", 404);
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
    throw serviceError("Question not found.", 404);
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
    throw serviceError("Question not found.", 404);
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
      throw serviceError(error.message || "Question could not be updated.", 400);
    }

    if (!data) {
      throw serviceError("Question not found.", 404);
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
    throw serviceError(error.message || "Question could not be created.", 400);
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
    throw serviceError("Question not found.", 404);
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
    throw serviceError(deleteResult.error.message || "Questions could not be deleted.", 400);
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
    throw serviceError(
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
      throw serviceError(
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
    throw serviceError("Question bank not found.", 404);
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
    throw serviceError(error.message || "Question bank delete failed.", 400);
  }

  if (!data) {
    throw serviceError("Question bank not found.", 404);
  }

  return data;
}

