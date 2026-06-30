import {
  archiveQuestionBank,
  createQuestionBank,
  listReadyQuestionBankQuestions,
  listReadyQuestionBanks,
  getQuestionBank,
  listQuestionBankQuestions,
  listQuestionBanks,
  generateQuestionsFromMaterial,
  updateQuestionBank,
} from "./question-banks.service.js";
import {
  validateCreatePayload,
  validateGenerateMaterialPayload,
  validateUpdatePayload,
} from "./question-banks.validation.js";

const savedMessage = "Question bank information has been saved successfully.";

function getUserId(req) {
  return req.user?.id || req.user?.user_id;
}

function sendError(res, error) {
  const statusCode = error.statusCode || error.status || 500;

  return res.status(statusCode).json({
    message: error.message || "Question bank request failed.",
    fields: error.fields,
  });
}

export async function list(req, res) {
  try {
    const data = await listQuestionBanks(getUserId(req), req.query);
    return res.status(200).json({ data });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function listReady(req, res) {
  try {
    const data = await listReadyQuestionBanks(getUserId(req));
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

export async function listReadyQuestions(req, res) {
  try {
    const data = await listReadyQuestionBankQuestions(getUserId(req), req.params.id);
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

export async function generateFromMaterial(req, res) {
  try {
    const payload = validateGenerateMaterialPayload(req.body, req.file);
    const data = await generateQuestionsFromMaterial(getUserId(req), payload);
    return res.status(200).json({ data });
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
