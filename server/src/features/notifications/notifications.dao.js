import { supabase as db } from "../../config/supabase.js";
import { NOTIFICATION_TABLE } from "../../models/notification.model.js";

export function findNotificationsForUser(userId, { offset, limit }) {
  return db
    .from(NOTIFICATION_TABLE)
    .select("*")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit);
}

export function countUnreadForUser(userId) {
  return db
    .from(NOTIFICATION_TABLE)
    .select("notification_id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false)
    .is("deleted_at", null);
}

export function insertNotification(payload) {
  return db.from(NOTIFICATION_TABLE).insert(payload).select("*").single();
}

export function markNotificationAsRead(notificationId, userId) {
  return db
    .from(NOTIFICATION_TABLE)
    .update({ is_read: true })
    .eq("notification_id", notificationId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .select("*")
    .maybeSingle();
}

export function markAllNotificationsAsRead(userId) {
  return db
    .from(NOTIFICATION_TABLE)
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false)
    .is("deleted_at", null);
}

export function softDeleteNotification(notificationId, userId) {
  return db
    .from(NOTIFICATION_TABLE)
    .update({ deleted_at: new Date().toISOString() })
    .eq("notification_id", notificationId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .select("notification_id")
    .maybeSingle();
}

export function softDeleteReadNotifications(userId) {
  return db
    .from(NOTIFICATION_TABLE)
    .update({ deleted_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("is_read", true)
    .is("deleted_at", null);
}
