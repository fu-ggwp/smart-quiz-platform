// New model — mirrors the `study_set_assignments` table, the join table that
// links study sets to classes (a study set has no direct class_id column;
// teachers "assign" a study set to a class through a row here, optionally
// with a release/due window and instructions).
export const STUDY_SET_ASSIGNMENT_TABLE = "study_set_assignments";

/**
 * @typedef {Object} StudySetAssignment
 * @property {string} assignment_id
 * @property {string} study_set_id  - FK -> study_sets.study_set_id
 * @property {string} class_id      - FK -> classes.class_id
 * @property {string} assigned_by   - FK -> users.user_id
 * @property {string} [release_at]
 * @property {string} [due_at]
 * @property {string} [instructions]
 * @property {string} created_at
 */
