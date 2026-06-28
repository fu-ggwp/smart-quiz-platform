import { ok, fail } from "../../utils/api-response.js";
import * as service from "./payments.service.js";

export const listPlans = async (req, res) => {
  try {
    return ok(res, await service.listPlans(req));
  } catch (err) {
    return fail(res, err, err.status || 500);
  }
};

export const listMine = async (req, res) => {
  try {
    return ok(res, await service.listMine(req.user.id));
  } catch (err) {
    return fail(res, err, err.status || 500);
  }
};

export const getOne = async (req, res) => {
  try {
    return ok(res, await service.getOne(req.user.id, req.params.paymentId));
  } catch (err) {
    return fail(res, err, err.status || 500);
  }
};

export const startCheckout = async (req, res) => {
  try {
    return ok(res, await service.startCheckout(req.user, req.body), 201);
  } catch (err) {
    return fail(res, err, err.status || 500);
  }
};

export const handlePayOSWebhook = async (req, res) => {
  try {
    return ok(res, await service.handlePayOSWebhook(req.body));
  } catch (err) {
    return fail(res, err, err.status || 500);
  }
};
