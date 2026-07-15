import { fail, ok } from "../../utils/api-response.js";
import {
  generateQuestionsFromMaterial,
  generateStudySetAnswerExplanation,
} from "./ai.service.js";
import { getUserId, validateGenerateMaterialPayload } from "./ai.validation.js";

/**
 * Validate the uploaded material, then ask the AI service for question drafts.
 */
export async function generateFromMaterial(req, res) {
  try {
    const payload = validateGenerateMaterialPayload(req.body, req.file);
    const data = await generateQuestionsFromMaterial(getUserId(req), payload);
    return ok(res, data);
  } catch (error) {
    return fail(res, error, error.statusCode || error.status || 500);
  }
}

export async function generateAnswerExplanation(req, res) {
  try {
    const data = await generateStudySetAnswerExplanation(
      req.user,
      req.params.sessionId,
      req.params.questionId,
    );
    return ok(res, data);
  } catch (error) {
    return fail(res, error, error.statusCode || error.status || 500);
  }
}
