import {
  listTeacherClasses,
  createClass as createClassService,
  getClassDetail as getClassDetailService,
  listMembers as listMembersService,
  listJoinRequests as listJoinRequestsService,
  resolveJoinRequest as resolveJoinRequestService,
  joinClass as joinClassService,
  listJoinedClasses as listJoinedClassesService,
  removeMember as removeMemberService,
  getLearnerClassDetail as getLearnerClassDetailService,
  updateClass as updateClassService,
  deleteClass as deleteClassService,
} from "./classes.service.js";
import { JoinRequestStatus } from "../../models/join-request.model.js";

/**
 * GET /api/classes/joined
 * Returns all classes the logged-in learner has joined.
 */
export async function getJoinedClasses(req, res) {
  try {
    const classes = await listJoinedClassesService(req.user.id);
    res.json({ ok: true, data: classes });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}

/**
 * GET /api/classes/:id/assigned-study-sets
 * Learner Class Detail — class header + assigned activities for the logged-in
 * learner (UC-17 step 6 / §3.3.4). Gated to active members of the class.
 */
export async function getLearnerClassDetail(req, res) {
  try {
    const detail = await getLearnerClassDetailService(req.params.id, req.user.id);
    res.json({ ok: true, data: detail });
  } catch (err) {
    res.status(err.status || 500).json({ ok: false, error: err.message });
  }
}

/**
 * GET /api/classes
 * Returns all classes belonging to the logged-in teacher.
 */
export async function getMyClasses(req, res) {
  try {
    const teacherId = req.user.id;
    const classes = await listTeacherClasses(teacherId);
    res.json({ ok: true, data: classes });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}

/**
 * POST /api/classes
 * Creates a new class for the logged-in teacher.
 */
export async function createClass(req, res) {
  const {
    class_name,
    grade_level,
    academic_year,
    description,
    learner_capacity,
    join_policy,
  } = req.body;

  if (!class_name?.trim()) {
    return res.status(400).json({ ok: false, error: "class_name is required" });
  }

  try {
    const newClass = await createClassService({
      teacherId: req.user.id,
      className: class_name.trim(),
      gradeLevel: grade_level,
      academicYear: academic_year,
      description,
      learnerCapacity: learner_capacity,
      joinPolicy: join_policy,
    });
    res.status(201).json({ ok: true, data: newClass });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}

/**
 * GET /api/classes/:id
 */
export async function getClassDetail(req, res) {
  try {
    const cls = await getClassDetailService(req.params.id, req.user.id);
    res.json({ ok: true, data: cls });
  } catch (err) {
    res.status(err.status || 500).json({ ok: false, error: err.message });
  }
}

/**
 * PATCH /api/classes/:id
 * Update class information (UC-31 / §2.3.5). Teacher-only, owner-gated.
 */
export async function updateClass(req, res) {
  try {
    const updated = await updateClassService(req.params.id, req.user.id, req.body);
    res.json({ ok: true, data: updated });
  } catch (err) {
    res.status(err.status || 500).json({ ok: false, error: err.message });
  }
}

/**
 * DELETE /api/classes/:id
 * Mark a class deleted (UC-32 / Section 2.3.6). Teacher-only, owner-gated.
 */
export async function deleteClass(req, res) {
  try {
    const result = await deleteClassService(req.params.id, req.user.id);
    res.json({ ok: true, data: result });
  } catch (err) {
    res.status(err.status || 500).json({ ok: false, error: err.message });
  }
}

/**
 * GET /api/classes/:id/members
 */
export async function getClassMembers(req, res) {
  try {
    const members = await listMembersService(req.params.id, req.user.id);
    res.json({ ok: true, data: members });
  } catch (err) {
    res.status(err.status || 500).json({ ok: false, error: err.message });
  }
}

/**
 * GET /api/classes/:id/join-requests
 */
export async function getJoinRequests(req, res) {
  try {
    const requests = await listJoinRequestsService(req.params.id, req.user.id);
    res.json({ ok: true, data: requests });
  } catch (err) {
    res.status(err.status || 500).json({ ok: false, error: err.message });
  }
}

/**
 * DELETE /api/classes/:id/members/:memberId
 * Teacher removes a learner from their class.
 */
export async function removeMember(req, res) {
  try {
    const updated = await removeMemberService(req.params.id, req.params.memberId, req.user.id);
    res.json({ ok: true, data: updated });
  } catch (err) {
    res.status(err.status || 500).json({ ok: false, error: err.message });
  }
}

/**
 * POST /api/classes/join
 * Body: { class_code? } | { invitation_token? }
 * Learner joins a class by code or invitation token.
 */
export async function joinClass(req, res) {
  const { class_code, invitation_token } = req.body;

  if (!class_code && !invitation_token) {
    return res.status(400).json({ ok: false, error: "class_code or invitation_token is required." });
  }

  try {
    const result = await joinClassService(req.user.id, {
      classCode: class_code,
      invitationToken: invitation_token,
    });
    res.status(result.joined ? 200 : 201).json({ ok: true, data: result });
  } catch (err) {
    res.status(err.status || 500).json({ ok: false, error: err.message });
  }
}

/**
 * PATCH /api/classes/join-requests/:requestId
 * Body: { status: "approved" | "rejected" }
 */
export async function resolveJoinRequest(req, res) {
  const { status } = req.body;
  const allowed = [JoinRequestStatus.APPROVED, JoinRequestStatus.REJECTED];

  if (!allowed.includes(status)) {
    return res.status(400).json({ ok: false, error: `status must be one of: ${allowed.join(", ")}` });
  }

  try {
    const updated = await resolveJoinRequestService(req.params.requestId, status, req.user.id);
    res.json({ ok: true, data: updated });
  } catch (err) {
    res.status(err.status || 500).json({ ok: false, error: err.message });
  }
}
