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
  findClassByInvitationToken,
  findExistingMember,
  findExistingJoinRequest,
  insertJoinRequest,
  getJoinedClasses,
  getClassMemberById,
  removeClassMember,
  getActiveMemberCounts,
  findMemberByClassAndLearner,
  reactivateClassMember,
  getUserById,
  getClassWithTeacher,
  getActiveMembership,
  getAssignmentsByClass,
  getLearnerAttemptsForStudySets,
  getPublishedExamsByClass,
} from "./classes.dao.js";
import { ClassJoinPolicy } from "../../models/class.model.js";
import { JoinRequestStatus, ClassMemberStatus } from "../../models/join-request.model.js";
import { StudySetVisibility } from "../../models/study-set.model.js";
import { PracticeAttemptStatus } from "../../models/practice-attempt.model.js";
import { notifyJoinRequestResolved } from "../../utils/notification.service.js";
import { logger } from "../../utils/logger.js";

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
 * Tally active class_members rows per class_id.
 */
function tallyByClassId(rows) {
  const counts = {};
  for (const row of rows) {
    counts[row.class_id] = (counts[row.class_id] ?? 0) + 1;
  }
  return counts;
}

/**
 * Return all classes owned by the given teacher.
 * member_count only counts learners with status = "active".
 */
export async function listTeacherClasses(teacherId) {
  const { data, error } = await getClassesByTeacher(teacherId);
  if (error) throw new Error(error.message);

  const classIds = data.map((cls) => cls.class_id);
  const { data: activeRows, error: countError } = await getActiveMemberCounts(classIds);
  if (countError) throw new Error(countError.message);
  const counts = tallyByClassId(activeRows);

  return data.map((cls) => ({
    ...cls,
    member_count: counts[cls.class_id] ?? 0,
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
    await addOrReactivateMember(request.class_id, request.learner_id);
  }

  // Notify the learner of the approval/rejection (UC-31). Fire-and-forget:
  // a notification failure must never affect the resolve outcome.
  notifyLearnerOfResolution(request.class_id, request.learner_id, status);

  return updated;
}

/**
 * Look up the learner + class, then email the learner about the resolution.
 * Non-blocking and fully guarded so notification errors are swallowed.
 */
async function notifyLearnerOfResolution(classId, learnerId, status) {
  try {
    const [{ data: cls }, { data: learner }] = await Promise.all([
      getClassById(classId),
      getUserById(learnerId),
    ]);
    if (!learner?.email) return;
    await notifyJoinRequestResolved({
      learner,
      className: cls?.class_name || "your class",
      status,
    });
  } catch (err) {
    logger.error("Failed to notify learner of join request resolution:", err.message);
  }
}

/**
 * Return all classes a learner has actively joined.
 * member_count only counts learners with status = "active".
 */
export async function listJoinedClasses(learnerId) {
  const { data, error } = await getJoinedClasses(learnerId);
  if (error) throw new Error(error.message);

  const classIds = data.map((row) => row.class?.class_id).filter(Boolean);
  const { data: activeRows, error: countError } = await getActiveMemberCounts(classIds);
  if (countError) throw new Error(countError.message);
  const counts = tallyByClassId(activeRows);

  return data.map((row) => ({
    ...row.class,
    joined_at: row.joined_at,
    member_count: counts[row.class?.class_id] ?? 0,
  }));
}

/**
 * Add a learner to a class, reactivating a previously-removed membership
 * row if one exists instead of inserting a duplicate row.
 */
async function addOrReactivateMember(classId, learnerId) {
  const { data: existing, error: findError } = await findMemberByClassAndLearner(classId, learnerId);
  if (findError) throw new Error(findError.message);

  if (existing) {
    const { data: reactivated, error: reactivateError } = await reactivateClassMember(existing.class_member_id);
    if (reactivateError) throw new Error(reactivateError.message);
    return reactivated;
  }

  const { data: inserted, error: insertError } = await insertClassMember({
    class_id: classId,
    learner_id: learnerId,
    status: ClassMemberStatus.ACTIVE,
    joined_at: new Date().toISOString(),
  });
  if (insertError) throw new Error(insertError.message);
  return inserted;
}

/**
 * Remove a member from a class (ownership-gated).
 * Soft-deletes the class_members row (status -> "removed").
 */
export async function removeMember(classId, memberId, teacherId) {
  // Ownership check — throws 404/403 if not the owning teacher.
  await getClassDetail(classId, teacherId);

  const { data: member, error } = await getClassMemberById(memberId);
  if (error || !member) {
    const err = new Error("Member not found.");
    err.status = 404;
    throw err;
  }
  if (member.class_id !== classId) {
    const err = new Error("Member not found in this class.");
    err.status = 404;
    throw err;
  }
  if (member.status === ClassMemberStatus.REMOVED) {
    const err = new Error("Member has already been removed.");
    err.status = 409;
    throw err;
  }

  const { data: updated, error: updateError } = await removeClassMember(memberId);
  if (updateError) throw new Error(updateError.message);
  return updated;
}

/**
 * Learner joins a class via class code or invitation token.
 * - auto_approve  → insert directly into class_members
 * - teacher_approval → insert a pending join request
 */
export async function joinClass(learnerId, { classCode, invitationToken }) {
  // 1. Find the class
  let cls = null;
  if (classCode) {
    const { data, error } = await findClassByCode(classCode.toUpperCase());
    if (error) throw new Error(error.message);
    cls = data;
  } else if (invitationToken) {
    const { data, error } = await findClassByInvitationToken(invitationToken);
    if (error) throw new Error(error.message);
    cls = data;
  } else {
    const err = new Error("class_code or invitation_token is required.");
    err.status = 400;
    throw err;
  }

  if (!cls) {
    const err = new Error("Class not found. Check the code and try again.");
    err.status = 404;
    throw err;
  }

  // 2. Already a member?
  const { data: existingMember } = await findExistingMember(cls.class_id, learnerId);
  if (existingMember) {
    const err = new Error("You are already a member of this class.");
    err.status = 409;
    throw err;
  }

  // 3. Already has a pending request?
  const { data: existingRequest } = await findExistingJoinRequest(cls.class_id, learnerId);
  if (existingRequest) {
    const err = new Error("You already have a pending join request for this class.");
    err.status = 409;
    throw err;
  }

  // 4. Auto approve → straight into class_members (reactivate if previously removed)
  if (cls.join_policy === ClassJoinPolicy.AUTO_APPROVE) {
    const member = await addOrReactivateMember(cls.class_id, learnerId);
    return { joined: true, class: cls, member };
  }

  // 5. Teacher approval → create join request
  const { data, error } = await insertJoinRequest({
    class_id: cls.class_id,
    learner_id: learnerId,
    status: JoinRequestStatus.PENDING,
  });
  if (error) throw new Error(error.message);
  return { joined: false, class: cls, joinRequest: data };
}

// Study sets in these visibilities are filtered out of a learner's assigned
// list even if assigned (BR-23 — hidden/archived are not learner-accessible).
const HIDDEN_VISIBILITIES = new Set([
  StudySetVisibility.HIDDEN,
  StudySetVisibility.ARCHIVED,
]);

/**
 * Derive a learner's progress on one study set from their practice attempts.
 *   status:   not_started | in_progress | completed
 *   accuracy: best submitted accuracy as a 0–100 int (null if never submitted)
 *   attempts: total attempt count
 */
function deriveProgress(attempts) {
  if (!attempts || attempts.length === 0) {
    return { status: "not_started", accuracy: null, attempts: 0 };
  }

  const submitted = attempts.filter(
    (a) => a.status === PracticeAttemptStatus.SUBMITTED && a.max_score > 0
  );

  const accuracy =
    submitted.length > 0
      ? Math.round(Math.max(...submitted.map((a) => (a.total_score / a.max_score) * 100)))
      : null;

  const status =
    submitted.length > 0
      ? "completed"
      : attempts.some((a) => a.status === PracticeAttemptStatus.IN_PROGRESS)
        ? "in_progress"
        : "not_started";

  return { status, accuracy, attempts: attempts.length };
}

/**
 * Learner Class Detail (UC-17 step 6 / §3.3.4): the class header plus the
 * study sets ("assigned activities") visible to this learner, each annotated
 * with the learner's own progress.
 *
 * Access (BR-12 / BR-22): the requester must be an ACTIVE member of the class,
 * otherwise 403 (MSG11). A missing or soft-deleted class → 404. This use case
 * is read-only — no membership data is changed (UC-17 POST-3).
 */
export async function getLearnerClassDetail(classId, learnerId) {
  const { data: cls, error: classError } = await getClassWithTeacher(classId);
  if (classError) throw new Error(classError.message);
  if (!cls) {
    const err = new Error("Class not found.");
    err.status = 404;
    throw err;
  }

  const { data: membership, error: memberError } = await getActiveMembership(classId, learnerId);
  if (memberError) throw new Error(memberError.message);
  if (!membership) {
    const err = new Error("You do not have permission to access this class.");
    err.status = 403;
    throw err;
  }

  // Active member count for the class header (active-only, like the list views).
  const { data: activeRows, error: countError } = await getActiveMemberCounts([classId]);
  if (countError) throw new Error(countError.message);
  const memberCount = tallyByClassId(activeRows)[classId] ?? 0;

  // Assigned study sets, then filter to what the learner may actually open.
  const { data: assignments, error: assignError } = await getAssignmentsByClass(classId);
  if (assignError) throw new Error(assignError.message);

  const now = Date.now();
  const visible = (assignments ?? []).filter((row) => {
    const set = row.study_set;
    if (!set) return false;                                         // study set missing
    if (set.deleted_at) return false;                               // soft-deleted (BR-23)
    if (set.is_admin_hidden) return false;                          // admin-hidden (MSG34)
    if (HIDDEN_VISIBILITIES.has(set.visibility)) return false;      // hidden/archived
    if (row.release_at && new Date(row.release_at).getTime() > now) return false; // not yet released
    return true;
  });

  // Pull the learner's attempts once, bucket by study set, then annotate.
  const studySetIds = visible.map((row) => row.study_set.study_set_id);
  const { data: attempts, error: attemptError } = await getLearnerAttemptsForStudySets(
    learnerId,
    studySetIds
  );
  if (attemptError) throw new Error(attemptError.message);

  const attemptsBySet = {};
  for (const a of attempts ?? []) {
    (attemptsBySet[a.study_set_id] ??= []).push(a);
  }

  const assigned_study_sets = visible.map((row) => {
    const set = row.study_set;
    return {
      assignment_id: row.assignment_id,
      study_set_id: set.study_set_id,
      title: set.title,
      description: set.description,
      subject: set.subject,
      topic: set.topic,
      practice_mode: set.practice_mode,
      question_count: set.question_count,
      tags: set.tags ?? [],
      release_at: row.release_at,
      due_at: row.due_at,
      instructions: row.instructions,
      progress: deriveProgress(attemptsBySet[set.study_set_id]),
    };
  });

  // Assigned exams (published exam sessions for this class, UC-24).
  const { data: examRows, error: examError } = await getPublishedExamsByClass(classId);
  if (examError) throw new Error(examError.message);

  const exams = (examRows ?? []).map((e) => ({
    exam_session_id: e.exam_session_id,
    title: e.title,
    description: e.description,
    status: e.status,
    start_at: e.start_at,
    end_at: e.end_at,
    duration_minutes: e.duration_minutes,
    attempt_limit: e.attempt_limit,
    question_count: e.question_count,
    result_visibility: e.result_visibility,
  }));

  return {
    class: {
      class_id: cls.class_id,
      class_name: cls.class_name,
      subject: cls.subject,
      grade_level: cls.grade_level,
      academic_year: cls.academic_year,
      class_code: cls.class_code,
      status: cls.status,
      member_count: memberCount,
      teacher: cls.teacher
        ? {
            full_name: cls.teacher.full_name,
            username: cls.teacher.username,
            avatar_url: cls.teacher.avatar_url,
          }
        : null,
    },
    assigned_study_sets,
    exams,
  };
}
