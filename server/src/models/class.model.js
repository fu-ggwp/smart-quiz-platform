// Mirrors the `classes` table.
export const CLASS_TABLE = "classes";

export const ClassJoinPolicy = Object.freeze({
  AUTO_APPROVE: "auto_approve",
  TEACHER_APPROVAL: "teacher_approval",
});


/**
 * @typedef {Object} Class
 * @property {string} class_id
 * @property {string} teacher_id              - FK -> users.user_id
 * @property {string} class_name
 * @property {string} [subject]
 * @property {string} [grade_level]
 * @property {string} [academic_year]
 * @property {string} class_code              - unique
 * @property {string} [invitation_token]      - unique
 * @property {string} [invitation_expires_at]
 * @property {number} learner_capacity        - default 50
 * @property {"auto_approve"|"teacher_approval"} join_policy
 * @property {string} [start_date]
 * @property {string} [end_date]
 * @property {string} [description]
 * @property {string} created_at
 * @property {string} updated_at
 * @property {string} [deleted_at]
 */
