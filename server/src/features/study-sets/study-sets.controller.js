import * as service from "./study-sets.service.js";
import { ok, fail } from "../../utils/api-response.js";

export const listMine = async (req, res) => {
  try {
    return ok(res, await service.listMine(req.user.user_id || req.user.id));
  } catch (err) {
    return fail(res, err, err.status || 500);
  }
};

export const listAvailable = async (req, res) => {
  try {
    return ok(res, await service.listAvailable(req.query.classId));
  } catch (err) {
    return fail(res, err, err.status || 500);
  }
};

export const listPublic = async (req, res) => {
  try {
    return ok(res, await service.listAvailable());
  } catch (err) {
    return fail(res, err, err.status || 500);
  }
};

export const getOne = async (req, res) => {
  try {
    return ok(res, await service.getOne(req.params.id));
  } catch (err) {
    return fail(res, err, err.status || 404);
  }
};

export const create = async (req, res) => {
  try {
    return ok(res, await service.create(req.user.user_id || req.user.id, req.body), 201);
  } catch (err) {
    return fail(res, err, err.status || 400);
  }
};

export const update = async (req, res) => {
  try {
    return ok(res, await service.update(req.params.id, req.user.user_id || req.user.id, req.body));
  } catch (err) {
    return fail(res, err, err.status || 400);
  }
};

export const remove = async (req, res) => {
  try {
    await service.remove(req.params.id, req.user.user_id || req.user.id);
    return ok(res, { message: "Deleted" });
  } catch (err) {
    return fail(res, err, err.status || 400);
  }
};

export const startSession = async (req, res) => {
  try {
    return ok(res, await service.startSession(req.user.user_id || req.user.id, req.params.id, req.body.mode), 201);
  } catch (err) {
    return fail(res, err, err.status || 400);
  }
};

export const listMySessions = async (req, res) => {
  try {
    return ok(res, await service.listMySessions(req.user.user_id || req.user.id));
  } catch (err) {
    return fail(res, err, err.status || 500);
  }
};

export const submitAnswer = async (req, res) => {
  try {
    return ok(res, await service.submitAnswer(req.params.sessionId, req.body), 201);
  } catch (err) {
    return fail(res, err, err.status || 400);
  }
};

export const completeSession = async (req, res) => {
  try {
    return ok(res, await service.completeSession(req.params.sessionId, req.body.score));
  } catch (err) {
    return fail(res, err, err.status || 400);
  }
};

export const getSessionResults = async (req, res) => {
  try {
    return ok(res, await service.getSessionResults(req.params.sessionId));
  } catch (err) {
    return fail(res, err, err.status || 404);
  }
};

export const listLearnerStudySets = async (req, res) => {
  try {
    const learnerId = req.user.id || req.user.user_id;
    const data = await service.listLearnerStudySets(learnerId);
    return ok(res, data);
  } catch (err) {
    return fail(res, err, err.status || 500);
  }
};
