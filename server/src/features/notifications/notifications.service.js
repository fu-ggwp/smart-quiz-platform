import * as dao from "./notifications.dao.js";

function dbError(error, status = 500) {
  return Object.assign(new Error(error.message), { status });
}

function notFound() {
  return Object.assign(new Error("Notification not found."), { status: 404 });
}

function missingField(fieldName) {
  return Object.assign(new Error(`${fieldName} is required.`), { status: 400 });
}

function normalizeLimit(value) {
  const limit = Number.parseInt(value, 10);
  if (!Number.isFinite(limit)) return 20;
  return Math.min(Math.max(limit, 1), 20);
}

function normalizeOffset(value) {
  const offset = Number.parseInt(value, 10);
  if (!Number.isFinite(offset)) return 0;
  return Math.max(offset, 0);
}

export async function listMine(userId, query = {}) {
  const limit = normalizeLimit(query.limit);
  const offset = normalizeOffset(query.offset);
  const { data, error } = await dao.findNotificationsForUser(userId, {
    offset,
    limit,
  });

  if (error) throw dbError(error);

  const rows = data || [];
  const notifications = rows.slice(0, limit);
  const hasMore = rows.length > limit;

  return {
    notifications,
    nextOffset: hasMore ? offset + notifications.length : null,
    hasMore,
  };
}

export async function getUnreadCount(userId) {
  const { count, error } = await dao.countUnreadForUser(userId);

  if (error) throw dbError(error);

  return { count: count || 0 };
}

export async function createNotification({ userId, title, message, targetUrl = null }) {
  if (!userId) throw missingField("userId");
  if (!title?.trim()) throw missingField("title");
  if (!message?.trim()) throw missingField("message");

  const { data, error } = await dao.insertNotification({
    user_id: userId,
    title: title.trim(),
    message: message.trim(),
    target_url: targetUrl || null,
  });

  if (error) throw dbError(error);

  return data;
}

export async function markOneAsRead(userId, notificationId) {
  const { data, error } = await dao.markNotificationAsRead(notificationId, userId);

  if (error) throw dbError(error);
  if (!data) throw notFound();

  return data;
}

export async function markAllAsRead(userId) {
  const { error } = await dao.markAllNotificationsAsRead(userId);

  if (error) throw dbError(error);

  return { updated: true };
}

export async function removeOne(userId, notificationId) {
  const { data, error } = await dao.softDeleteNotification(notificationId, userId);

  if (error) throw dbError(error);
  if (!data) throw notFound();

  return { deleted: true };
}

export async function removeRead(userId) {
  const { error } = await dao.softDeleteReadNotifications(userId);

  if (error) throw dbError(error);

  return { deleted: true };
}
