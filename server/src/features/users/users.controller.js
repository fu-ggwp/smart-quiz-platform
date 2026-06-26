import * as service from "./users.service.js";
import { ok, fail } from "../../utils/api-response.js";

export const listPublic = async (req, res) => {
  try {
    return ok(res, await service.listPublic(req.query));
  } catch (err) {
    return fail(res, err, err.status || 500);
  }
};

/**
 * GET /api/users
 * Admin user list with search + role/status/premium filters (UC-51 / §3.9.1).
 */
export const listAll = async (req, res) => {
  try {
    return ok(res, await service.listForAdmin(req.query));
  } catch (err) {
    return fail(res, err, err.status || 500);
  }
};
