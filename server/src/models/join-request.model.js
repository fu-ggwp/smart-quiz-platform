// Mirrors the `class_join_requests` table — a learner's request to join a class.
// NOTE: actual class membership lives in the separate `class_members` table
// (typedef below) — a request and a membership are different rows/tables.
export const JOIN_REQUEST_TABLE = "class_join_requests";
export const CLASS_MEMBER_TABLE = "class_members";

export const JoinRequestStatus = Object.freeze({
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
});

export const ClassMemberStatus = Object.freeze({
  ACTIVE: "active",
  REMOVED: "removed",
});

/**
 * @typedef {Object} ClassJoinRequest
 * @property {string} join_request_id
 * @property {string} class_id          - FK -> classes.class_id
 * @property {string} learner_id        - FK -> users.user_id
 * @property {"pending"|"approved"|"rejected"} status
 * @property {string} [reviewed_by]     - FK -> users.user_id
 * @property {string} [reviewed_at]
 * @property {string} created_at
 */

/**
 * @typedef {Object} ClassMember
 * @property {string} class_member_id
 * @property {string} class_id     - FK -> classes.class_id
 * @property {string} learner_id   - FK -> users.user_id
 * @property {"active"|"removed"} status
 * @property {string} joined_at
 * @property {string} [removed_at]
 */
