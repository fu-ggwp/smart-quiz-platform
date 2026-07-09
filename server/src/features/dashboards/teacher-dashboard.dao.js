import { supabase } from "../../config/supabase.js";
import { CLASS_TABLE } from "../../models/class.model.js";
import { EXAM_SESSION_TABLE } from "../../models/exam.model.js";
import { JOIN_REQUEST_TABLE } from "../../models/join-request.model.js";

const db = supabase;



/**
 * Preferred query: read pending join requests and join the class owner in one request.
 */
export function listPendingJoinRequestsForTeacher(teacherId) {
  return db
    .from(JOIN_REQUEST_TABLE)
    .select(`
      join_request_id,
      class_id,
      created_at,
      class:classes!class_id!inner (
        class_id,
        class_name,
        teacher_id,
        status,
        deleted_at
      )
    `)
    .eq("status", "pending")
    .eq("class.teacher_id", teacherId)
    .eq("class.status", "active")
    .is("class.deleted_at", null)
    .order("created_at", { ascending: false });
}

/**
 * Load active/draft exam sessions for the dashboard work queue.
 */
export function listTeacherExamWork(teacherId) {
  return db
    .from(EXAM_SESSION_TABLE)
    .select(`
      exam_session_id,
      title,
      status,
      start_at,
      end_at,
      updated_at,
      classes:classes (
        class_id,
        class_name
      )
    `)
    .eq("teacher_id", teacherId)
    .in("status", ["active", "draft"])
    .is("deleted_at", null)
    .order("updated_at", { ascending: false, nullsFirst: false });
}

/**
 * Fallback query for environments where the direct join-request relation is unavailable.
 */
export function listTeacherClassesForRequestFallback(teacherId) {
  return db
    .from(CLASS_TABLE)
    .select(`
      class_id,
      class_name,
      class_join_requests (
        join_request_id,
        status,
        created_at
      )
    `)
    .eq("teacher_id", teacherId)
    .eq("status", "active")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
}
