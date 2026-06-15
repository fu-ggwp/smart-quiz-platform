import { supabaseAdmin } from "../../config/supabase.js";
import { CLASS_TABLE } from "../../models/class.model.js";
import { CLASS_MEMBER_TABLE, JOIN_REQUEST_TABLE } from "../../models/join-request.model.js";

/**
 * Get all classes created by a teacher, with member count.
 */
export async function getClassesByTeacher(teacherId) {
  const { data, error } = await supabaseAdmin
    .from(CLASS_TABLE)
    .select(`*, member_count:${CLASS_MEMBER_TABLE}(count)`)
    .eq("teacher_id", teacherId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return { data, error };
}

/**
 * Check if a class_code already exists.
 */
export async function findClassByCode(classCode) {
  const { data, error } = await supabaseAdmin
    .from(CLASS_TABLE)
    .select("*, teacher:users!teacher_id(username, full_name)")
    .eq("class_code", classCode)
    .maybeSingle();

  return { data, error };
}

/**
 * Insert a new class row and return it.
 */
export async function insertClass(payload) {
  const { data, error } = await supabaseAdmin
    .from(CLASS_TABLE)
    .insert(payload)
    .select()
    .single();

  return { data, error };
}

/**
 * Get a single class by ID (not deleted).
 */
export async function getClassById(classId) {
  const { data, error } = await supabaseAdmin
    .from(CLASS_TABLE)
    .select("*")
    .eq("class_id", classId)
    .is("deleted_at", null)
    .single();

  return { data, error };
}

/**
 * Get active members of a class, joined with user info.
 */
export async function getClassMembers(classId) {
  const { data, error } = await supabaseAdmin
    .from(CLASS_MEMBER_TABLE)
    .select(`
      *,
      user:users!learner_id(user_id, full_name, email, username, avatar_url)
    `)
    .eq("class_id", classId)
    .eq("status", "active")
    .order("joined_at", { ascending: true });

  return { data, error };
}

/**
 * Get join requests for a class by status, joined with user info.
 */
export async function getJoinRequests(classId, status = "pending") {
  const { data, error } = await supabaseAdmin
    .from(JOIN_REQUEST_TABLE)
    .select(`
      *,
      user:users!learner_id(user_id, full_name, email, username, avatar_url)
    `)
    .eq("class_id", classId)
    .eq("status", status)
    .order("created_at", { ascending: true });

  return { data, error };
}

/**
 * Get a single join request by ID.
 */
export async function getJoinRequestById(requestId) {
  const { data, error } = await supabaseAdmin
    .from(JOIN_REQUEST_TABLE)
    .select("*")
    .eq("join_request_id", requestId)
    .single();

  return { data, error };
}

/**
 * Update a join request row and return the updated record.
 */
export async function updateJoinRequest(requestId, updates) {
  const { data, error } = await supabaseAdmin
    .from(JOIN_REQUEST_TABLE)
    .update(updates)
    .eq("join_request_id", requestId)
    .select()
    .single();

  return { data, error };
}

/**
 * Insert a new class_members row.
 */
export async function insertClassMember(payload) {
  const { data, error } = await supabaseAdmin
    .from(CLASS_MEMBER_TABLE)
    .insert(payload)
    .select()
    .single();

  return { data, error };
}

/**
 * Find a class by invitation token (not deleted).
 */
export async function findClassByInvitationToken(token) {
  const { data, error } = await supabaseAdmin
    .from(CLASS_TABLE)
    .select("*, teacher:users!teacher_id(username, full_name)")
    .eq("invitation_token", token)
    .is("deleted_at", null)
    .maybeSingle();

  return { data, error };
}

/**
 * Check if a learner is already an active member of a class.
 */
export async function findExistingMember(classId, learnerId) {
  const { data, error } = await supabaseAdmin
    .from(CLASS_MEMBER_TABLE)
    .select("class_member_id")
    .eq("class_id", classId)
    .eq("learner_id", learnerId)
    .eq("status", "active")
    .maybeSingle();

  return { data, error };
}

/**
 * Check if a learner already has a pending join request for a class.
 */
export async function findExistingJoinRequest(classId, learnerId) {
  const { data, error } = await supabaseAdmin
    .from(JOIN_REQUEST_TABLE)
    .select("join_request_id, status")
    .eq("class_id", classId)
    .eq("learner_id", learnerId)
    .eq("status", "pending")
    .maybeSingle();

  return { data, error };
}

/**
 * Get all classes a learner has actively joined, with teacher info and member count.
 */
export async function getJoinedClasses(learnerId) {
  const { data, error } = await supabaseAdmin
    .from(CLASS_MEMBER_TABLE)
    .select(`
      joined_at,
      class:classes!class_id(
        *,
        teacher:users!teacher_id(username, full_name),
        member_count:class_members(count)
      )
    `)
    .eq("learner_id", learnerId)
    .eq("status", "active")
    .order("joined_at", { ascending: false });

  return { data, error };
}

/**
 * Insert a new join request row.
 */
export async function insertJoinRequest(payload) {
  const { data, error } = await supabaseAdmin
    .from(JOIN_REQUEST_TABLE)
    .insert(payload)
    .select()
    .single();

  return { data, error };
}
