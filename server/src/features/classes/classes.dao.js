// Cleared: previous scaffold targeted column names that don't exist on the
// real `classes` table (e.g. `id`, `name`, `invite_code`, `is_archived`)
// and a `join-request.model.js` whose table mapping was wrong. Rebuild
// against the actual columns: class_id, class_name, class_code,
// invitation_token, learner_capacity, join_policy, status — plus the
// related `class_members` and `class_join_requests` tables.
