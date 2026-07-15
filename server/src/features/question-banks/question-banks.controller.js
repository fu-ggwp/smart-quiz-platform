import {
  archiveQuestionBank,
  createQuestionBank,
  listReadyQuestionBankQuestions,
  listReadyQuestionBanks,
  getQuestionBank,
  listQuestionBankQuestions,
  listQuestionBanks,
  updateQuestionBank,
} from "./question-banks.service.js";
import {
  getUserId,
  validateCreatePayload,
  validateUpdatePayload,
} from "./question-banks.validation.js";
import { fail, ok } from "../../utils/api-response.js";
export { generateFromMaterial } from "../ai/ai.controller.js";

/**
 * List the current teacher's question banks.
 * Query parameters are validated and normalized in the service layer.
 */
export async function list(req, res) {
  try {
    const data = await listQuestionBanks(getUserId(req), req.query);
    return ok(res, data);
  } catch (error) {
    return fail(res, error, error.statusCode || error.status || 500);
  }
}

/**
 * Return ready banks only, for flows that need reusable question sources.
 */
export async function listReady(req, res) {
  try {
    const data = await listReadyQuestionBanks(getUserId(req));
    return ok(res, data);
  } catch (error) {
    return fail(res, error, error.statusCode || error.status || 500);
  }
}

/**
 * Load one owned question bank by route id.
 */
export async function getById(req, res) {
  try {
    const data = await getQuestionBank(getUserId(req), req.params.id);
    return ok(res, data);
  } catch (error) {
    return fail(res, error, error.statusCode || error.status || 500);
  }
}

/**
 * Load editable questions for one owned question bank.
 */
export async function listQuestions(req, res) {
  try {
    const data = await listQuestionBankQuestions(getUserId(req), req.params.id);
    return ok(res, data);
  } catch (error) {
    return fail(res, error, error.statusCode || error.status || 500);
  }
}

/**
 * Load questions only after confirming the bank is ready.
 * Exam creation uses this so drafts cannot become exam sources.
 */
export async function listReadyQuestions(req, res) {
  try {
    const data = await listReadyQuestionBankQuestions(getUserId(req), req.params.id);
    return ok(res, data);
  } catch (error) {
    return fail(res, error, error.statusCode || error.status || 500);
  }
}

/**
 * Validate the request body, then create metadata and optional questions.
 */
export async function create(req, res) {
  try {
    const payload = validateCreatePayload(req.body);
    const data = await createQuestionBank(getUserId(req), payload);
    return ok(res, data, 201);
  } catch (error) {
    return fail(res, error, error.statusCode || error.status || 500);
  }
}

/**
 * Patch question bank metadata and optionally sync the full question list.
 */
export async function update(req, res) {
  try {
    const changes = validateUpdatePayload(req.body);
    const data = await updateQuestionBank(getUserId(req), req.params.id, changes);
    return ok(res, data);
  } catch (error) {
    return fail(res, error, error.statusCode || error.status || 500);
  }
}

/**
 * Soft-delete a question bank so old references can keep their FK history.
 */
export async function remove(req, res) {
  try {
    const data = await archiveQuestionBank(getUserId(req), req.params.id);
    return ok(res, data);
  } catch (error) {
    return fail(res, error, error.statusCode || error.status || 500);
  }
}
