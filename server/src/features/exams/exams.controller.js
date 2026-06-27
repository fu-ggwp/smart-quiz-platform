import {
  createExamSession as createExamSessionService,
  getExamAttempts as getExamAttemptsService,
  getExamDetail as getExamDetailService,
  getLearnerExamAttempt as getLearnerExamAttemptService,
  getLearnerExamAttemptResults as getLearnerExamAttemptResultsService,
  getLearnerExamDetail as getLearnerExamDetailService,
  getTeacherExamAttemptResults as getTeacherExamAttemptResultsService,
  listLearnerExamSessions,
  listTeacherExamSessions,
  recordLearnerExamEvent as recordLearnerExamEventService,
  saveLearnerExamAnswer as saveLearnerExamAnswerService,
  startLearnerExamAttempt as startLearnerExamAttemptService,
  submitLearnerExamAttempt as submitLearnerExamAttemptService,
  updateExamSettings as updateExamSettingsService,
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

/**
 * GET /api/exams/:id
 */
export async function getExamDetail(req, res) {
  try {
    const exam = await getExamDetailService(req.params.id, getUserId(req));
    res.json({ ok: true, data: exam });
  } catch (error) {
    sendError(res, error);
  }
}

export async function getExamAttempts(req, res) {
  try {
    const data = await getExamAttemptsService(req.params.id, getUserId(req));
    res.json({ ok: true, data });
  } catch (error) {
    sendError(res, error);
  }
}

/**
 * PATCH /api/exams/:id/settings
 */
export async function updateExamSettings(req, res) {
  try {
    const data = await updateExamSettingsService(req.params.id, getUserId(req), req.body);
    res.json({ ok: true, data });
  } catch (error) {
    sendError(res, error);
  }
}

/**
 * GET /api/exams/learner
 */
export async function getAvailableExamSessions(req, res) {
  try {
    const data = await listLearnerExamSessions(getUserId(req), req.query);
    res.json({ ok: true, data });
  } catch (error) {
    sendError(res, error);
  }
}

/**
 * GET /api/exams/learner/:id
 */
export async function getLearnerExamDetail(req, res) {
  try {
    const data = await getLearnerExamDetailService(req.params.id, getUserId(req));
    res.json({ ok: true, data });
  } catch (error) {
    sendError(res, error);
  }
}

export async function startLearnerExamAttempt(req, res) {
  try {
    const data = await startLearnerExamAttemptService(req.params.id, getUserId(req), req.body);
    res.status(201).json({ ok: true, data });
  } catch (error) {
    sendError(res, error);
  }
}

export async function getLearnerExamAttempt(req, res) {
  try {
    const data = await getLearnerExamAttemptService(req.params.attemptId, getUserId(req));
    res.json({ ok: true, data });
  } catch (error) {
    sendError(res, error);
  }
}

export async function getLearnerExamAttemptResults(req, res) {
  try {
    const data = await getLearnerExamAttemptResultsService(req.params.attemptId, getUserId(req));
    res.json({ ok: true, data });
  } catch (error) {
    sendError(res, error);
  }
}

export async function getTeacherExamAttemptResults(req, res) {
  try {
    const data = await getTeacherExamAttemptResultsService(req.params.attemptId, getUserId(req));
    res.json({ ok: true, data });
  } catch (error) {
    sendError(res, error);
  }
}

export async function saveLearnerExamAnswer(req, res) {
  try {
    const data = await saveLearnerExamAnswerService(req.params.attemptId, getUserId(req), req.body);
    res.json({ ok: true, data });
  } catch (error) {
    sendError(res, error);
  }
}

export async function submitLearnerExamAttempt(req, res) {
  try {
    const data = await submitLearnerExamAttemptService(req.params.attemptId, getUserId(req), Boolean(req.body?.is_auto_submitted));
    res.json({ ok: true, data });
  } catch (error) {
    sendError(res, error);
  }
}

export async function recordLearnerExamEvent(req, res) {
  try {
    const data = await recordLearnerExamEventService(req.params.attemptId, getUserId(req), req.body);
    res.status(201).json({ ok: true, data });
  } catch (error) {
    sendError(res, error);
  }
}
