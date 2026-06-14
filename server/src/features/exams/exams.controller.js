import {
  createExamSession as createExamSessionService,
  listTeacherExamSessions,
} from "./exams.service.js";

function getUserId(req) {
  return req.user?.id || req.user?.user_id;
}

function sendError(res, error) {
  res.status(error.status || error.statusCode || 500).json({
    ok: false,
    error: error.message || "Exam request failed.",
    fields: error.fields,
  });
}

/**
 * GET /api/exams
 * Returns all exam sessions belonging to the logged-in teacher.
 */
export async function getMyExamSessions(req, res) {
  try {
    const data = await listTeacherExamSessions(getUserId(req), req.query);
    res.json({ ok: true, data });
  } catch (error) {
    sendError(res, error);
  }
}

/**
 * POST /api/exams
 * Creates a new teacher-owned exam session and snapshots its questions.
 */
export async function createExamSession(req, res) {
  try {
    const data = await createExamSessionService(getUserId(req), req.body);
    res.status(201).json({ ok: true, data });
  } catch (error) {
    sendError(res, error);
  }
}
