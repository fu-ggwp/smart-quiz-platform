import { fail, ok } from "../../utils/api-response.js";
import * as learnerService from "./learner-home.service.js";
import * as teacherService from "./teacher-home.service.js";

function getUserId(req) {
  return req.user?.id || req.user?.user_id;
}

/**
 * Return the learner home page payload for the authenticated learner.
 */
export async function getLearnerHome(req, res) {
  try {
    return ok(res, await learnerService.getLearnerHome(getUserId(req)));
  } catch (err) {
    return fail(res, err, err.status || 500);
  }
}

/**
 * Return the teacher home page payload for the authenticated teacher.
 */
export async function getTeacherHome(req, res) {
  try {
    return ok(res, await teacherService.getTeacherHome(getUserId(req)));
  } catch (err) {
    return fail(res, err, err.status || 500);
  }
}
