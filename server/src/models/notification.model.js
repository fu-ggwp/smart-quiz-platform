// Mirrors the `notifications` table used by the in-app notification center.
export const NOTIFICATION_TABLE = "notifications";

/**
 * @typedef {Object} Notification
 * @property {string} notification_id
 * @property {string} user_id        - FK -> users.user_id
 * @property {string} title
 * @property {string} message
 * @property {string} [target_url]
 * @property {boolean} is_read       - default false
 * @property {string} created_at
 * @property {string} [deleted_at]
 */
