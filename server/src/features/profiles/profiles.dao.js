// Cleared: previous scaffold targeted a `profiles` table that doesn't exist
// in the real schema. User profile data lives on the `users` table (and role
// info on `user_roles`) — this is already handled by `getCurrentProfile` in
// the auth feature. Rebuild this folder only if a separate profiles concept
// is actually needed against `users`/`user_roles`.
