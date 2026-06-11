import {
  listTeacherClasses,
  createClass as createClassService,
  getClassDetail as getClassDetailService,
  listMembers as listMembersService,
  listJoinRequests as listJoinRequestsService,
  resolveJoinRequest as resolveJoinRequestService,
} from "./classes.service.js";
import { JoinRequestStatus } from "../../models/join-request.model.js";

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
    subject,
    grade_level,
    academic_year,
    description,
    learner_capacity,
    join_policy,
    start_date,
    end_date,
  } = req.body;

  if (!class_name?.trim()) {
    return res.status(400).json({ ok: false, error: "class_name is required" });
  }

  try {
    const newClass = await createClassService({
      teacherId: req.user.id,
      className: class_name.trim(),
      subject,
      gradeLevel: grade_level,
      academicYear: academic_year,
      description,
      learnerCapacity: learner_capacity,
      joinPolicy: join_policy,
      startDate: start_date,
      endDate: end_date,
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
