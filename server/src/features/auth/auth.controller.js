import { getCurrentProfile, updateCurrentProfile } from "./auth.service.js";
import { ok, fail } from "../../utils/api-response.js";

export async function me(req, res) {
  try {
    const profile = await getCurrentProfile(req.user.id);
    return ok(res, profile);
  } catch (error) {
    return fail(res, error, error.statusCode || error.status || 500);
  }
}

export async function updateMe(req, res) {
  try {
    const profile = await updateCurrentProfile(req.user.id, req.body);
    return ok(res, profile);
  } catch (error) {
    return fail(res, error, error.statusCode || error.status || 500);
  }
}
