import { supabase } from "../../config/supabase.js";
import { httpError } from "../../utils/api-response.js";
import * as questionBanksDao from "./question-banks.dao.js";
import {
  normalizeListFilters,
  questionBankLoadError,
} from "./question-banks.validation.js";

const db = supabase;

/**
 * Add active question count to a bank row for list/detail cards.
 */
async function attachQuestionCount(questionBank) {
  return {
    ...questionBank,
    questionCount: await questionBanksDao.countQuestions(
      questionBank.question_bank_id,
    ),
  };
}

/**
 * Keep answer options stable in the order teachers see in the editor.
 */
function sortQuestionAnswerOptions(question) {
  return {
    ...question,
    answer_options: [...(question.answer_options || [])].sort(
      (left, right) => left.display_order - right.display_order,
    ),
  };
}

/**
 * Convert DAO option errors into a client-friendly API error.
 */
function optionUpdateError(error) {
  if (!error) return;

  throw httpError(
    error.message || "Question answer options could not be updated.",
    400,
  );
}

/**
 * Build question field changes with an updated timestamp.
 */
function buildQuestionChanges(changes) {
  return {
    ...changes,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Build a reusable bank question. study_set_id stays null because this is not a study-set copy.
 */
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

/**
 * Reassign display_order from the editor array position.
 */
function normalizeDesiredAnswerOptions(answerOptions) {
  return answerOptions.map((option, index) => ({
    option_text: option.option_text,
    is_correct: option.is_correct,
    display_order: index + 1,
  }));
}

/**
 * Sync option rows to match the editor draft exactly: insert missing rows,
 * update retained rows, then delete surplus rows.
 */
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
    throw questionBankLoadError();
  }
}

/**
 * List teacher banks with filters, pagination metadata, and question counts.
 */
export async function listQuestionBanks(userId, query) {
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

/**
 * Return ready banks for exam/study-set builders that need usable sources.
 */
export async function listReadyQuestionBanks(userId) {
  const { data, error } = await questionBanksDao.listReadyByTeacher(userId);
  handleLoadError(error);

  return Promise.all((data || []).map(attachQuestionCount));
}

/**
 * Load one owned bank and append its active question count.
 */
export async function getQuestionBank(userId, questionBankId) {
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

/**
 * Load one owned ready bank, using field errors that form components understand.
 */
export async function getReadyQuestionBank(userId, questionBankId) {
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

/**
 * Load active question cards for the bank editor/detail page.
 */
export async function listQuestionBankQuestions(userId, questionBankId) {
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

/**
 * Load questions only after the bank passes the Ready gate.
 */
export async function listReadyQuestionBankQuestions(userId, questionBankId) {
  await getReadyQuestionBank(userId, questionBankId);

  const { data, error } = await questionBanksDao.listQuestionsByBank(
    questionBankId,
    userId,
  );
  handleLoadError(error);

  return (data || []).map(sortQuestionAnswerOptions);
}

/**
 * Internal helper that returns one editable reusable-bank question.
 */
async function getQuestion(userId, questionId) {
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

/**
 * Update one question and sync its options from the incoming editor payload.
 */
async function updateQuestion(userId, questionId, payload) {
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

/**
 * Create a new question in the bank, then insert its answer options.
 */
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

/**
 * Update an existing bank question after confirming it belongs to this bank.
 */
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

/**
 * Treat the submitted question array as the source of truth for the bank.
 * Existing IDs are updated, missing IDs are created, and omitted IDs are archived.
 */
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

  // Keep IDs that still exist in the editor draft so the rest can be archived.
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

/**
 * Create bank metadata first, then sync the optional question draft list.
 */
export async function createQuestionBank(userId, payload) {
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

/**
 * Update metadata and/or replace the editable question list for one owned bank.
 */
export async function updateQuestionBank(userId, questionBankId, changes) {
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

/**
 * Soft-delete a bank; questions remain available for historical references.
 */
export async function archiveQuestionBank(userId, questionBankId) {
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

