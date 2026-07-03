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
  getUserId,
  validateCreatePayload,
  validateGenerateMaterialPayload,
  validateUpdatePayload,
} from "./question-banks.validation.js";
import { fail, ok } from "../../utils/api-response.js";

export async function list(req, res) {
  try {
    const data = await listQuestionBanks(getUserId(req), req.query);
    return ok(res, data);
  } catch (error) {
    return fail(res, error, error.statusCode || error.status || 500);
  }
}

export async function listReady(req, res) {
  try {
    const data = await listReadyQuestionBanks(getUserId(req));
    return ok(res, data);
  } catch (error) {
    return fail(res, error, error.statusCode || error.status || 500);
  }
}

export async function getById(req, res) {
  try {
    const data = await getQuestionBank(getUserId(req), req.params.id);
    return ok(res, data);
  } catch (error) {
    return fail(res, error, error.statusCode || error.status || 500);
  }
}

export async function listQuestions(req, res) {
  try {
    const data = await listQuestionBankQuestions(getUserId(req), req.params.id);
    return ok(res, data);
  } catch (error) {
    return fail(res, error, error.statusCode || error.status || 500);
  }
}

export async function listReadyQuestions(req, res) {
  try {
    const data = await listReadyQuestionBankQuestions(getUserId(req), req.params.id);
    return ok(res, data);
  } catch (error) {
    return fail(res, error, error.statusCode || error.status || 500);
  }
}

export async function create(req, res) {
  try {
    const payload = validateCreatePayload(req.body);
    const data = await createQuestionBank(getUserId(req), payload);
    return ok(res, data, 201);
  } catch (error) {
    return fail(res, error, error.statusCode || error.status || 500);
  }
}

export async function generateFromMaterial(req, res) {
  try {
    const payload = validateGenerateMaterialPayload(req.body, req.file);
    const data = await generateQuestionsFromMaterial(getUserId(req), payload);
    return ok(res, data);
  } catch (error) {
    return fail(res, error, error.statusCode || error.status || 500);
  }
}

export async function update(req, res) {
  try {
    const changes = validateUpdatePayload(req.body);
    const data = await updateQuestionBank(getUserId(req), req.params.id, changes);
    return ok(res, data);
  } catch (error) {
    return fail(res, error, error.statusCode || error.status || 500);
  }
}

export async function remove(req, res) {
  try {
    const data = await archiveQuestionBank(getUserId(req), req.params.id);
    return ok(res, data);
  } catch (error) {
    return fail(res, error, error.statusCode || error.status || 500);
  }
}
