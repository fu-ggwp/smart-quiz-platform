import { ok, fail } from "../../utils/api-response.js";
import * as service from "./notifications.service.js";

export const listMine = async (req, res) => {
  try {
    return ok(res, await service.listMine(req.user.id, req.query));
  } catch (err) {
    return fail(res, err, err.status || 500);
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    return ok(res, await service.getUnreadCount(req.user.id));
  } catch (err) {
    return fail(res, err, err.status || 500);
  }
};

export const markOneAsRead = async (req, res) => {
  try {
    return ok(
      res,
      await service.markOneAsRead(req.user.id, req.params.notificationId),
    );
  } catch (err) {
    return fail(res, err, err.status || 500);
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    return ok(res, await service.markAllAsRead(req.user.id));
  } catch (err) {
    return fail(res, err, err.status || 500);
  }
};

export const removeOne = async (req, res) => {
  try {
    return ok(res, await service.removeOne(req.user.id, req.params.notificationId));
  } catch (err) {
    return fail(res, err, err.status || 500);
  }
};

export const removeRead = async (req, res) => {
  try {
    return ok(res, await service.removeRead(req.user.id));
  } catch (err) {
    return fail(res, err, err.status || 500);
  }
};
