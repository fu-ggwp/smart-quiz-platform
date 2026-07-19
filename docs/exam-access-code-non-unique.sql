-- Allow teachers to reuse manually entered exam access codes.
--
-- Supabase currently has a unique constraint named
-- exam_sessions_access_code_key from the original schema snapshot.
-- Run this once in the SQL editor or migration pipeline.

ALTER TABLE public.exam_sessions
  DROP CONSTRAINT IF EXISTS exam_sessions_access_code_key;
