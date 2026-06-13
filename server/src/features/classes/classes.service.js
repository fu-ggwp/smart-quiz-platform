import { randomBytes } from "crypto";
import {
  getClassesByTeacher,
  insertClass,
  findClassByCode,
  getClassById,
  getClassMembers,
  getJoinRequests,
  getJoinRequestById,
  updateJoinRequest,
  insertClassMember,
} from "./classes.dao.js";
import { ClassStatus, ClassJoinPolicy } from "../../models/class.model.js";
import { JoinRequestStatus, ClassMemberStatus } from "../../models/join-request.model.js";

/**
 * Generate a random 6-character uppercase alphanumeric class code (e.g. "AB3X9Z").
 */
function generateClassCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

/**
 * Generate a secure random invitation token.
 */
function generateInvitationToken() {
  return randomBytes(24).toString("hex");
}

/**
 * Return all classes owned by the given teacher.
 */
export async function listTeacherClasses(teacherId) {
  const { data, error } = await getClassesByTeacher(teacherId);
  if (error) throw new Error(error.message);

  return data.map((cls) => ({
    ...cls,
    member_count: cls.member_count?.[0]?.count ?? 0,
  }));
}

/**
 * Create a new class for a teacher.
 * Generates a unique class_code (retries up to 5 times) and invitation_token.
 */
export async function createClass({
  teacherId,
  className,
  subject,
  gradeLevel,
  academicYear,
  description,
  learnerCapacity,
  joinPolicy,
  startDate,
  endDate,
}) {
  // Generate a unique class code
  let classCode = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateClassCode();
    const { data: existing } = await findClassByCode(code);
    if (!existing) {
      classCode = code;
      break;
    }
  }
  if (!classCode) {
    throw new Error("Could not generate a unique class code. Please try again.");
  }

  const { data, error } = await insertClass({
    teacher_id: teacherId,
    class_name: className,
    subject: subject || null,
    grade_level: gradeLevel || null,
    academic_year: academicYear || null,
    description: description || null,
    learner_capacity: learnerCapacity || 50,
    join_policy: joinPolicy || ClassJoinPolicy.TEACHER_APPROVAL,
    status: ClassStatus.ACTIVE,
    class_code: classCode,
    invitation_token: generateInvitationToken(),
    start_date: startDate || null,
    end_date: endDate || null,
  });

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Get a single class, asserting the requester is the owner.
 */
export async function getClassDetail(classId, teacherId) {
  const { data, error } = await getClassById(classId);
  if (error || !data) {
    const err = new Error("Class not found.");
    err.status = 404;
    throw err;
  }
  if (data.teacher_id !== teacherId) {
    const err = new Error("Forbidden.");
    err.status = 403;
    throw err;
  }
  return data;
}

/**
 * List active members of a class (ownership-gated).
 */
export async function listMembers(classId, teacherId) {
  await getClassDetail(classId, teacherId);
  const { data, error } = await getClassMembers(classId);
  if (error) throw new Error(error.message);
  return data;
}

/**
 * List pending join requests for a class (ownership-gated).
 */
export async function listJoinRequests(classId, teacherId) {
  await getClassDetail(classId, teacherId);
  const { data, error } = await getJoinRequests(classId, JoinRequestStatus.PENDING);
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Approve or reject a join request.
 * If approved, also inserts a class_members row.
 */
export async function resolveJoinRequest(requestId, status, reviewerId) {
  const { data: request, error: reqError } = await getJoinRequestById(requestId);
  if (reqError || !request) {
    const err = new Error("Join request not found.");
    err.status = 404;
    throw err;
  }
  if (request.status !== JoinRequestStatus.PENDING) {
    const err = new Error("Request already resolved.");
    err.status = 409;
    throw err;
  }

  // Ownership check via class
  await getClassDetail(request.class_id, reviewerId);

  const { data: updated, error: updateError } = await updateJoinRequest(requestId, {
    status,
    reviewed_by: reviewerId,
    reviewed_at: new Date().toISOString(),
  });
  if (updateError) throw new Error(updateError.message);

  if (status === JoinRequestStatus.APPROVED) {
    const { error: memberError } = await insertClassMember({
      class_id: request.class_id,
      learner_id: request.learner_id,
      status: ClassMemberStatus.ACTIVE,
      joined_at: new Date().toISOString(),
    });
    if (memberError) throw new Error(memberError.message);
  }

  return updated;
}
