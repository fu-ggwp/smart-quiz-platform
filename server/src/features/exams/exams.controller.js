import { ok } from "../../utils/api-response.js";
import * as examsService from "./exams.service.js";

export async function listMine(req, res) {
  const data = await examsService.listMine(req.user.id, req.query);
  return ok(res, data);
}
