import { fail, ok } from "../../utils/api-response.js";
import * as learnerService from "./learner-dashboard.service.js";
import * as teacherService from "./teacher-dashboard.service.js";

function getUserId(req) {
  return req.user?.id || req.user?.user_id;
}

export async function getLearnerDashboard(req, res) {
  try {
    return ok(res, await learnerService.getLearnerDashboard(getUserId(req)));
  } catch (err) {
    return fail(res, err, err.status || 500);
  }
}

export async function getTeacherDashboard(req, res) {
  try {
    return ok(res, await teacherService.getTeacherDashboard(getUserId(req)));
  } catch (err) {
    return fail(res, err, err.status || 500);
  }
}
