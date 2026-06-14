import {
  ExamResultVisibility,
  ExamSessionStatus,
  EXAM_SESSION_CONFIG_COLUMNS,
} from "../../models/exam.model.js";
import {
  countActiveQuestionsInBank,
  findTeacherExamSession,
  listTeacherExamSessions as listTeacherExamSessionsDao,
  updateTeacherExamSessionConfig,
} from "./exams.dao.js";

const savedMessage = "Exam settings have been updated successfully.";
const invalidSettingsMessage =
  "The exam session cannot be published. Please complete the required configuration.";
const invalidInfoMessage = "The information is invalid. Please check and try again.";
const resultVisibilityValues = new Set(Object.values(ExamResultVisibility));

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function serviceError(message, status = 400, fields) {
  const error = new Error(message);
  error.status = status;
  error.fields = fields;
  return error;
}

function validationError(message, fields) {
  return serviceError(message, 400, fields);
}

function requireTeacherId(teacherId) {
  if (!teacherId) {
    throw serviceError("Missing authenticated user.", 401);
  }
}

function validateExamSessionId(examSessionId) {
  if (!uuidRegex.test(String(examSessionId || ""))) {
    throw serviceError("The information is invalid. Please check and try again.", 400, {
      id: "Exam session id is invalid.",
    });
  }
}

function ensureEditableExamSession(exam) {
  const now = Date.now();
  const startTime = exam.start_at ? new Date(exam.start_at).getTime() : null;
  const endTime = exam.end_at ? new Date(exam.end_at).getTime() : null;
  const statusLocked = [
    ExamSessionStatus.ACTIVE,
    ExamSessionStatus.CLOSED,
    ExamSessionStatus.ARCHIVED,
  ].includes(exam.status);
  const timeLocked =
    (Number.isFinite(startTime) && startTime <= now) ||
    (Number.isFinite(endTime) && endTime <= now);

  if (statusLocked || timeLocked) {
    throw serviceError("You do not have permission to access or perform this action.", 409);
  }
}

function resolveNextValue(changes, field, fallback) {
  return Object.prototype.hasOwnProperty.call(changes, field) ? changes[field] : fallback;
}

function ensureValidTimeWindow(exam, changes) {
  const nextStartAt = resolveNextValue(changes, "start_at", exam.start_at);
  const nextEndAt = resolveNextValue(changes, "end_at", exam.end_at);

  if (!nextStartAt || !nextEndAt) {
    return;
  }

  if (new Date(nextEndAt).getTime() <= new Date(nextStartAt).getTime()) {
    throw serviceError(invalidSettingsMessage, 400, {
      start_at: "End time must be later than start time.",
      end_at: "End time must be later than start time.",
    });
  }
}

function addTextField(changes, errors, payload, field, { required = false, maxLength } = {}) {
  if (payload[field] === undefined) return;

  const value = payload[field] === null ? "" : String(payload[field]).trim();
  if (required && !value) {
    errors[field] = "Please complete all required information.";
    return;
  }

  if (maxLength && value.length > maxLength) {
    errors[field] = `Use ${maxLength} characters or fewer.`;
    return;
  }

  changes[field] = value || null;
}

function addPositiveIntegerField(changes, errors, payload, field) {
  if (payload[field] === undefined) return;

  const value = Number(payload[field]);
  if (!Number.isInteger(value) || value <= 0) {
    errors[field] = invalidInfoMessage;
    return;
  }

  changes[field] = value;
}

function addBooleanField(changes, errors, payload, field) {
  if (payload[field] === undefined) return;

  if (typeof payload[field] === "boolean") {
    changes[field] = payload[field];
    return;
  }

  if (payload[field] === "true" || payload[field] === "false") {
    changes[field] = payload[field] === "true";
    return;
  }

  errors[field] = invalidInfoMessage;
}

function addDateTimeField(changes, errors, payload, field) {
  if (payload[field] === undefined) return;

  if (payload[field] === null || payload[field] === "") {
    changes[field] = null;
    return;
  }

  const value = new Date(payload[field]);
  if (Number.isNaN(value.getTime())) {
    errors[field] = invalidInfoMessage;
    return;
  }

  changes[field] = value.toISOString();
}

function addResultVisibilityField(changes, errors, payload) {
  if (payload.result_visibility === undefined) return;

  const value = String(payload.result_visibility || "").trim();
  if (!resultVisibilityValues.has(value)) {
    errors.result_visibility = invalidInfoMessage;
    return;
  }

  changes.result_visibility = value;
}

function validateSubmittedTimeWindow(changes, errors) {
  if (!changes.start_at || !changes.end_at) return;

  if (new Date(changes.end_at).getTime() <= new Date(changes.start_at).getTime()) {
    errors.start_at = invalidSettingsMessage;
    errors.end_at = invalidSettingsMessage;
  }
}

function buildExamSettingsChanges(payload = {}) {
  const errors = {};
  const changes = {};

  addTextField(changes, errors, payload, "title", { required: true, maxLength: 255 });
  addTextField(changes, errors, payload, "description", { maxLength: 5000 });
  addTextField(changes, errors, payload, "access_code", { maxLength: 50 });
  addDateTimeField(changes, errors, payload, "start_at");
  addDateTimeField(changes, errors, payload, "end_at");
  addPositiveIntegerField(changes, errors, payload, "duration_minutes");
  addPositiveIntegerField(changes, errors, payload, "attempt_limit");
  addPositiveIntegerField(changes, errors, payload, "question_count");
  addBooleanField(changes, errors, payload, "randomize_questions");
  addBooleanField(changes, errors, payload, "randomize_answers");
  addResultVisibilityField(changes, errors, payload);
  validateSubmittedTimeWindow(changes, errors);

  if (Object.keys(errors).length > 0) {
    const message = errors.start_at || errors.end_at ? invalidSettingsMessage : invalidInfoMessage;
    throw validationError(message, errors);
  }

  return changes;
}

function normalizeConfigChanges(changes = {}) {
  return Object.fromEntries(
    Object.entries(changes).filter(([field, value]) =>
      EXAM_SESSION_CONFIG_COLUMNS.includes(field) && value !== undefined
    )
  );
}

function handleDaoError(error) {
  if (error) {
    throw serviceError("Failed to load data. Please check your connection and try again.", 500);
  }
}

/**
 * Return all exam sessions owned by the teacher.
 */
export async function listTeacherExamSessions(teacherId, filters = {}) {
  requireTeacherId(teacherId);

  const { data, error } = await listTeacherExamSessionsDao(teacherId, filters);
  handleDaoError(error);

  return data;
}

/**
 * Get a single exam session, asserting the requester is the owner.
 */
export async function getExamDetail(examSessionId, teacherId) {
  requireTeacherId(teacherId);
  validateExamSessionId(examSessionId);

  const { data, error } = await findTeacherExamSession(examSessionId, teacherId);
  handleDaoError(error);

  if (!data) {
    throw serviceError("Exam session not found.", 404);
  }

  return data;
}

/**
 * Update configurable exam settings before the exam starts.
 */
export async function updateExamSettings(examSessionId, teacherId, payload = {}) {
  const exam = await getExamDetail(examSessionId, teacherId);
  ensureEditableExamSession(exam);

  const normalizedChanges = normalizeConfigChanges(buildExamSettingsChanges(payload));
  if (Object.keys(normalizedChanges).length === 0) {
    throw serviceError("No valid exam settings were provided.", 400);
  }

  ensureValidTimeWindow(exam, normalizedChanges);

  if (normalizedChanges.question_count !== undefined) {
    const { count: availableCount, error } = await countActiveQuestionsInBank(
      exam.question_bank_id,
      teacherId
    );
    handleDaoError(error);

    if (normalizedChanges.question_count > availableCount) {
      throw serviceError(invalidSettingsMessage, 400, {
        question_count: `Only ${availableCount} active questions are available in the selected question bank.`,
      });
    }
  }

  const { data, error } = await updateTeacherExamSessionConfig(examSessionId, teacherId, {
    ...normalizedChanges,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    throw serviceError(error.message || "The information is invalid. Please check and try again.", 400);
  }

  if (!data) {
    throw serviceError("Exam session not found.", 404);
  }

  return { message: savedMessage, exam: data };
}
