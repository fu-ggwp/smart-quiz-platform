// Cleared: previous scaffold used `owner_id`/direct `class_id` on study sets
// (real columns are `teacher_id` plus a `study_set_assignments` join table to
// classes) and `practice-attempt.model.js`/`attempt-answer.model.js` whose
// table mappings were wrong (real tables: `practice_attempts`, `attempt_answers`).
// Rebuild against the actual `study_sets`, `study_set_assignments`,
// `practice_attempts`, and `attempt_answers` tables.
