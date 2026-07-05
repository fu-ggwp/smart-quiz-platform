import { supabase } from "../../config/supabase.js";
import { ATTEMPT_ANSWER_TABLE } from "../../models/attempt-answer.model.js";
import { EXAM_ATTEMPT_TABLE } from "../../models/exam-attempt.model.js";
import { PRACTICE_ATTEMPT_TABLE } from "../../models/practice-attempt.model.js";

const db = supabase;

export function listPracticeAttemptsForProgress(learnerId) {
  return db
    .from(PRACTICE_ATTEMPT_TABLE)
    .select(`
      practice_attempt_id,
      learner_id,
      study_set_id,
      mode,
      started_at,
      submitted_at,
      status,
      total_score,
      max_score,
      study_sets:study_sets (
        study_set_id,
        title
      ),
      attempt_answers:${ATTEMPT_ANSWER_TABLE} (
        attempt_answer_id,
        is_correct
      )
    `)
    .eq("learner_id", learnerId);
}

export function listExamAttemptsForProgress(learnerId) {
  return db
    .from(EXAM_ATTEMPT_TABLE)
    .select(`
      exam_attempt_id,
      exam_session_id,
      learner_id,
      started_at,
      submitted_at,
      status,
      is_auto_submitted,
      total_score,
      exam_sessions:exam_sessions (
        exam_session_id,
        title
      ),
      attempt_answers:${ATTEMPT_ANSWER_TABLE} (
        attempt_answer_id,
        is_correct
      )
    `)
    .eq("learner_id", learnerId);
}
