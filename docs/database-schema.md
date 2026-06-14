# Database Schema Context

This document is a context snapshot for agents and developers working on the
Smart Quiz Platform database model.

Important:

- This schema is for reference only and is not meant to be run as a migration.
- Table order and constraints may not be valid for direct execution.
- Use this file to understand entities, relationships, enum-like checks, and
  expected database fields before changing backend, frontend, or Supabase code.

## Domain Overview

- `users` is the application profile table linked to `auth.users`.
- `user_roles` stores all roles assigned to a user, while `users.active_role`
  stores the currently selected role.
- `classes`, `class_members`, and `class_join_requests` model teacher classes
  and learner enrollment.
- `question_banks`, `study_sets`, `questions`, and `answer_options` model
  reusable quiz/study content.
- `study_set_assignments`, `practice_attempts`, `exam_sessions`,
  `exam_questions`, `exam_attempts`, and `attempt_answers` model learning,
  assigned practice, exams, and submitted answers.
- `premium_plans` and `payments` model premium subscriptions.
- `ai_interactions` stores AI usage metadata for explanations and question
  generation.

## Schema Snapshot

```sql
-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.users (
  user_id uuid NOT NULL,
  email character varying NOT NULL UNIQUE,
  username character varying NOT NULL UNIQUE,
  full_name character varying NOT NULL,
  phone_number character varying CHECK (phone_number IS NULL OR char_length(phone_number::text) >= 7 AND char_length(phone_number::text) <= 30),
  avatar_url text,
  bio text,
  account_status character varying NOT NULL DEFAULT 'active'::character varying CHECK (account_status::text = ANY (ARRAY['active'::character varying, 'pending'::character varying, 'locked'::character varying, 'disabled'::character varying]::text[])),
  active_role character varying NOT NULL DEFAULT 'learner'::character varying CHECK (active_role::text = ANY (ARRAY['learner'::character varying, 'teacher'::character varying, 'admin'::character varying]::text[])),
  is_premium boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone,
  CONSTRAINT users_pkey PRIMARY KEY (user_id),
  CONSTRAINT users_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_roles (
  user_id uuid NOT NULL,
  role character varying NOT NULL CHECK (role::text = ANY (ARRAY['learner'::character varying, 'teacher'::character varying, 'admin'::character varying]::text[])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role),
  CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.classes (
  class_id uuid NOT NULL DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  class_name character varying NOT NULL,
  subject character varying,
  grade_level character varying,
  academic_year character varying,
  class_code character varying NOT NULL UNIQUE,
  invitation_token character varying UNIQUE,
  invitation_expires_at timestamp with time zone,
  learner_capacity integer NOT NULL DEFAULT 50 CHECK (learner_capacity > 0),
  join_policy character varying NOT NULL DEFAULT 'teacher_approval'::character varying CHECK (join_policy::text = ANY (ARRAY['auto_approve'::character varying, 'teacher_approval'::character varying]::text[])),
  status character varying NOT NULL DEFAULT 'active'::character varying CHECK (status::text = ANY (ARRAY['active'::character varying, 'inactive'::character varying, 'closed'::character varying, 'archived'::character varying]::text[])),
  start_date date,
  end_date date,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone,
  CONSTRAINT classes_pkey PRIMARY KEY (class_id),
  CONSTRAINT classes_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.class_members (
  class_member_id uuid NOT NULL DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL,
  learner_id uuid NOT NULL,
  status character varying NOT NULL DEFAULT 'active'::character varying CHECK (status::text = ANY (ARRAY['active'::character varying, 'removed'::character varying]::text[])),
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  removed_at timestamp with time zone,
  CONSTRAINT class_members_pkey PRIMARY KEY (class_member_id),
  CONSTRAINT class_members_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(class_id),
  CONSTRAINT class_members_learner_id_fkey FOREIGN KEY (learner_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.class_join_requests (
  join_request_id uuid NOT NULL DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL,
  learner_id uuid NOT NULL,
  request_message text,
  status character varying NOT NULL DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying]::text[])),
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT class_join_requests_pkey PRIMARY KEY (join_request_id),
  CONSTRAINT class_join_requests_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(class_id),
  CONSTRAINT class_join_requests_learner_id_fkey FOREIGN KEY (learner_id) REFERENCES public.users(user_id),
  CONSTRAINT class_join_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(user_id)
);
CREATE TABLE public.question_banks (
  question_bank_id uuid NOT NULL DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  title character varying NOT NULL,
  description text,
  topic character varying,
  status character varying NOT NULL DEFAULT 'Private'::character varying CHECK (status::text = ANY (ARRAY['Private'::character varying, 'Assigned'::character varying, 'Archived'::character varying]::text[])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone,
  CONSTRAINT question_banks_pkey PRIMARY KEY (question_bank_id),
  CONSTRAINT question_banks_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.study_sets (
  study_set_id uuid NOT NULL DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  source_question_bank_id uuid,
  title character varying NOT NULL,
  description text,
  subject character varying,
  topic character varying,
  visibility character varying NOT NULL DEFAULT 'public'::character varying CHECK (visibility::text = ANY (ARRAY['public'::character varying, 'private'::character varying, 'class_only'::character varying, 'hidden'::character varying, 'archived'::character varying]::text[])),
  is_admin_hidden boolean NOT NULL DEFAULT false,
  creation_method character varying NOT NULL DEFAULT 'manual'::character varying CHECK (creation_method::text = ANY (ARRAY['manual'::character varying, 'import'::character varying, 'ai_generated'::character varying, 'from_question_bank'::character varying]::text[])),
  target_accuracy numeric CHECK (target_accuracy IS NULL OR target_accuracy >= 0::numeric AND target_accuracy <= 100::numeric),
  practice_mode character varying NOT NULL DEFAULT 'flashcard_and_quiz'::character varying CHECK (practice_mode::text = ANY (ARRAY['flashcard'::character varying, 'quiz'::character varying, 'flashcard_and_quiz'::character varying]::text[])),
  estimated_study_minutes integer CHECK (estimated_study_minutes IS NULL OR estimated_study_minutes > 0),
  card_order character varying NOT NULL DEFAULT 'default'::character varying CHECK (card_order::text = ANY (ARRAY['default'::character varying, 'random'::character varying, 'difficulty_asc'::character varying, 'difficulty_desc'::character varying]::text[])),
  tags ARRAY NOT NULL DEFAULT '{}'::text[],
  include_explanations boolean NOT NULL DEFAULT true,
  allow_copy_by_other_teachers boolean NOT NULL DEFAULT false,
  track_learner_progress boolean NOT NULL DEFAULT true,
  question_count integer NOT NULL DEFAULT 0 CHECK (question_count >= 0),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone,
  CONSTRAINT study_sets_pkey PRIMARY KEY (study_set_id),
  CONSTRAINT study_sets_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(user_id),
  CONSTRAINT study_sets_source_question_bank_id_fkey FOREIGN KEY (source_question_bank_id) REFERENCES public.question_banks(question_bank_id)
);
CREATE TABLE public.questions (
  question_id uuid NOT NULL DEFAULT gen_random_uuid(),
  question_bank_id uuid,
  study_set_id uuid,
  source_question_id uuid,
  owner_id uuid NOT NULL,
  question_text text NOT NULL,
  question_type character varying NOT NULL DEFAULT 'multiple_choice'::character varying CHECK (question_type::text = ANY (ARRAY['multiple_choice'::character varying, 'true_false'::character varying]::text[])),
  score numeric NOT NULL DEFAULT 1 CHECK (score >= 0::numeric),
  explanation text,
  subject character varying,
  topic character varying,
  chapter character varying,
  lesson character varying,
  difficulty character varying NOT NULL DEFAULT 'medium'::character varying CHECK (difficulty::text = ANY (ARRAY['easy'::character varying, 'medium'::character varying, 'hard'::character varying]::text[])),
  status character varying NOT NULL DEFAULT 'active'::character varying CHECK (status::text = ANY (ARRAY['active'::character varying, 'hidden'::character varying, 'archived'::character varying]::text[])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone,
  CONSTRAINT questions_pkey PRIMARY KEY (question_id),
  CONSTRAINT questions_question_bank_id_fkey FOREIGN KEY (question_bank_id) REFERENCES public.question_banks(question_bank_id),
  CONSTRAINT questions_study_set_id_fkey FOREIGN KEY (study_set_id) REFERENCES public.study_sets(study_set_id),
  CONSTRAINT questions_source_question_id_fkey FOREIGN KEY (source_question_id) REFERENCES public.questions(question_id),
  CONSTRAINT questions_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.answer_options (
  answer_option_id uuid NOT NULL DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL,
  option_text text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL CHECK (display_order > 0),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT answer_options_pkey PRIMARY KEY (answer_option_id),
  CONSTRAINT answer_options_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(question_id)
);
CREATE TABLE public.study_set_assignments (
  assignment_id uuid NOT NULL DEFAULT gen_random_uuid(),
  study_set_id uuid NOT NULL,
  class_id uuid NOT NULL,
  assigned_by uuid NOT NULL,
  release_at timestamp with time zone,
  due_at timestamp with time zone,
  instructions text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT study_set_assignments_pkey PRIMARY KEY (assignment_id),
  CONSTRAINT study_set_assignments_study_set_id_fkey FOREIGN KEY (study_set_id) REFERENCES public.study_sets(study_set_id),
  CONSTRAINT study_set_assignments_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(class_id),
  CONSTRAINT study_set_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(user_id)
);
CREATE TABLE public.practice_attempts (
  practice_attempt_id uuid NOT NULL DEFAULT gen_random_uuid(),
  learner_id uuid NOT NULL,
  study_set_id uuid NOT NULL,
  mode character varying NOT NULL CHECK (mode::text = ANY (ARRAY['flashcard'::character varying, 'quiz'::character varying]::text[])),
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  submitted_at timestamp with time zone,
  status character varying NOT NULL DEFAULT 'in_progress'::character varying CHECK (status::text = ANY (ARRAY['in_progress'::character varying, 'submitted'::character varying, 'abandoned'::character varying]::text[])),
  total_score numeric NOT NULL DEFAULT 0,
  max_score numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT practice_attempts_pkey PRIMARY KEY (practice_attempt_id),
  CONSTRAINT practice_attempts_learner_id_fkey FOREIGN KEY (learner_id) REFERENCES public.users(user_id),
  CONSTRAINT practice_attempts_study_set_id_fkey FOREIGN KEY (study_set_id) REFERENCES public.study_sets(study_set_id)
);
CREATE TABLE public.exam_sessions (
  exam_session_id uuid NOT NULL DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL,
  teacher_id uuid NOT NULL,
  question_bank_id uuid NOT NULL,
  title character varying NOT NULL,
  description text,
  status character varying NOT NULL DEFAULT 'draft'::character varying CHECK (status::text = ANY (ARRAY['draft'::character varying, 'published'::character varying, 'active'::character varying, 'closed'::character varying, 'archived'::character varying]::text[])),
  start_at timestamp with time zone,
  end_at timestamp with time zone,
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0),
  attempt_limit integer NOT NULL DEFAULT 1 CHECK (attempt_limit > 0),
  question_count integer NOT NULL CHECK (question_count > 0),
  randomize_questions boolean NOT NULL DEFAULT true,
  randomize_answers boolean NOT NULL DEFAULT true,
  result_visibility character varying NOT NULL DEFAULT 'score_only'::character varying CHECK (result_visibility::text = ANY (ARRAY['completion_only'::character varying, 'score_only'::character varying]::text[])),
  access_code character varying UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone,
  CONSTRAINT exam_sessions_pkey PRIMARY KEY (exam_session_id),
  CONSTRAINT exam_sessions_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(class_id),
  CONSTRAINT exam_sessions_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(user_id),
  CONSTRAINT exam_sessions_question_bank_id_fkey FOREIGN KEY (question_bank_id) REFERENCES public.question_banks(question_bank_id)
);
CREATE TABLE public.exam_questions (
  exam_question_id uuid NOT NULL DEFAULT gen_random_uuid(),
  exam_session_id uuid NOT NULL,
  source_question_id uuid,
  question_text text NOT NULL,
  question_type character varying NOT NULL CHECK (question_type::text = ANY (ARRAY['multiple_choice'::character varying, 'true_false'::character varying]::text[])),
  score numeric NOT NULL DEFAULT 1 CHECK (score >= 0::numeric),
  explanation text,
  subject character varying,
  topic character varying,
  chapter character varying,
  lesson character varying,
  difficulty character varying,
  answer_options_json jsonb NOT NULL,
  correct_option_indexes ARRAY NOT NULL CHECK (array_length(correct_option_indexes, 1) >= 1),
  display_order integer NOT NULL CHECK (display_order > 0),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT exam_questions_pkey PRIMARY KEY (exam_question_id),
  CONSTRAINT exam_questions_exam_session_id_fkey FOREIGN KEY (exam_session_id) REFERENCES public.exam_sessions(exam_session_id),
  CONSTRAINT exam_questions_source_question_id_fkey FOREIGN KEY (source_question_id) REFERENCES public.questions(question_id)
);
CREATE TABLE public.exam_attempts (
  exam_attempt_id uuid NOT NULL DEFAULT gen_random_uuid(),
  exam_session_id uuid NOT NULL,
  learner_id uuid NOT NULL,
  attempt_number integer NOT NULL CHECK (attempt_number > 0),
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  submitted_at timestamp with time zone,
  status character varying NOT NULL DEFAULT 'in_progress'::character varying CHECK (status::text = ANY (ARRAY['in_progress'::character varying, 'submitted'::character varying, 'auto_submitted'::character varying, 'abandoned'::character varying]::text[])),
  is_auto_submitted boolean NOT NULL DEFAULT false,
  total_score numeric NOT NULL DEFAULT 0,
  max_score numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT exam_attempts_pkey PRIMARY KEY (exam_attempt_id),
  CONSTRAINT exam_attempts_exam_session_id_fkey FOREIGN KEY (exam_session_id) REFERENCES public.exam_sessions(exam_session_id),
  CONSTRAINT exam_attempts_learner_id_fkey FOREIGN KEY (learner_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.attempt_answers (
  attempt_answer_id uuid NOT NULL DEFAULT gen_random_uuid(),
  practice_attempt_id uuid,
  exam_attempt_id uuid,
  question_id uuid,
  exam_question_id uuid,
  selected_answer_option_ids ARRAY NOT NULL DEFAULT '{}'::uuid[],
  selected_exam_option_indexes ARRAY NOT NULL DEFAULT '{}'::integer[],
  is_correct boolean,
  score_awarded numeric NOT NULL DEFAULT 0 CHECK (score_awarded >= 0::numeric),
  review_status character varying NOT NULL DEFAULT 'unreviewed'::character varying CHECK (review_status::text = ANY (ARRAY['unreviewed'::character varying, 'reviewed'::character varying, 'marked_for_retry'::character varying, 'mastered'::character varying]::text[])),
  answered_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT attempt_answers_pkey PRIMARY KEY (attempt_answer_id),
  CONSTRAINT attempt_answers_practice_attempt_id_fkey FOREIGN KEY (practice_attempt_id) REFERENCES public.practice_attempts(practice_attempt_id),
  CONSTRAINT attempt_answers_exam_attempt_id_fkey FOREIGN KEY (exam_attempt_id) REFERENCES public.exam_attempts(exam_attempt_id),
  CONSTRAINT attempt_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(question_id),
  CONSTRAINT attempt_answers_exam_question_id_fkey FOREIGN KEY (exam_question_id) REFERENCES public.exam_questions(exam_question_id)
);
CREATE TABLE public.premium_plans (
  premium_plan_id uuid NOT NULL DEFAULT gen_random_uuid(),
  plan_name character varying NOT NULL,
  plan_code character varying NOT NULL UNIQUE,
  plan_type character varying NOT NULL CHECK (plan_type::text = ANY (ARRAY['learner_premium'::character varying, 'teacher_premium'::character varying, 'class_team_pack'::character varying]::text[])),
  price_vnd integer NOT NULL CHECK (price_vnd >= 0),
  billing_period character varying NOT NULL DEFAULT 'monthly'::character varying CHECK (billing_period::text = 'monthly'::text),
  duration_days integer NOT NULL DEFAULT 30 CHECK (duration_days > 0),
  description text,
  features jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone,
  CONSTRAINT premium_plans_pkey PRIMARY KEY (premium_plan_id)
);
CREATE TABLE public.payments (
  payment_id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  premium_plan_id uuid NOT NULL,
  amount_vnd integer NOT NULL CHECK (amount_vnd >= 0),
  currency character NOT NULL DEFAULT 'VND'::bpchar,
  payment_status character varying NOT NULL DEFAULT 'pending'::character varying CHECK (payment_status::text = ANY (ARRAY['pending'::character varying, 'successful'::character varying, 'failed'::character varying, 'cancelled'::character varying]::text[])),
  subscription_status character varying NOT NULL DEFAULT 'inactive'::character varying CHECK (subscription_status::text = ANY (ARRAY['inactive'::character varying, 'active'::character varying, 'expired'::character varying, 'cancelled'::character varying]::text[])),
  gateway_transaction_id character varying UNIQUE,
  gateway_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  premium_start_at timestamp with time zone,
  premium_end_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT payments_pkey PRIMARY KEY (payment_id),
  CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id),
  CONSTRAINT payments_premium_plan_id_fkey FOREIGN KEY (premium_plan_id) REFERENCES public.premium_plans(premium_plan_id)
);
CREATE TABLE public.ai_interactions (
  ai_interaction_id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  question_id uuid,
  interaction_type character varying NOT NULL CHECK (interaction_type::text = ANY (ARRAY['answer_explanation'::character varying, 'question_generation'::character varying]::text[])),
  prompt_summary text,
  response_summary text,
  status character varying NOT NULL CHECK (status::text = ANY (ARRAY['successful'::character varying, 'failed'::character varying, 'blocked'::character varying]::text[])),
  provider character varying NOT NULL DEFAULT 'Gemini API'::character varying,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT ai_interactions_pkey PRIMARY KEY (ai_interaction_id),
  CONSTRAINT ai_interactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id),
  CONSTRAINT ai_interactions_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(question_id)
);
```
