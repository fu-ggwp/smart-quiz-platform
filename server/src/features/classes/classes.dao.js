import { supabaseAdmin } from "../../config/supabase.js";
import { CLASS_TABLE } from "../../models/class.model.js";
import { CLASS_MEMBER_TABLE } from "../../models/join-request.model.js";

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
    .select("class_id")
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
