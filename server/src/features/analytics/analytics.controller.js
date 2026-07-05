import { fail, ok } from "../../utils/api-response.js";
import * as service from "./analytics.service.js";

export async function getLearnerProgressOverview(req, res) {
  try {
    const learnerId = req.user.id || req.user.user_id;
    return ok(res, await service.getLearnerProgress(learnerId));
  } catch (err) {
    return fail(res, err, err.status || 500);
  }
}
