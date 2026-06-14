import { STATUS_OPTIONS } from "../../../_components/exam-session-options";

const lockedStatuses = new Set(["closed", "archived"]);

export const editableStatusOptions = STATUS_OPTIONS.filter((option) =>
  ["draft", "active"].includes(option.value)
);

export function toDateTimeLocal(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

export function toIsoDateTime(value) {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function buildSettingsForm(exam) {
  return {
    title: exam?.title ?? "",
    description: exam?.description ?? "",
    status: exam?.status ?? "draft",
    start_at: toDateTimeLocal(exam?.start_at),
    end_at: toDateTimeLocal(exam?.end_at),
    duration_minutes: String(exam?.duration_minutes ?? ""),
    attempt_limit: String(exam?.attempt_limit ?? 1),
    question_count: String(exam?.question_count ?? ""),
    randomize_questions: Boolean(exam?.randomize_questions),
    randomize_answers: Boolean(exam?.randomize_answers),
    result_visibility: exam?.result_visibility ?? "score_only",
    access_code: exam?.access_code ?? "",
  };
}

export function isExamSettingsLocked(exam) {
  if (!exam) return false;

  const now = Date.now();
  const startTime = exam.start_at ? new Date(exam.start_at).getTime() : null;
  const endTime = exam.end_at ? new Date(exam.end_at).getTime() : null;

  return (
    lockedStatuses.has(exam.status) ||
    (Number.isFinite(startTime) && startTime <= now) ||
    (Number.isFinite(endTime) && endTime <= now)
  );
}

export function getExamSettingsErrorMessage(error) {
  return (
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.message ||
    "Failed to load data. Please check your connection and try again."
  );
}

export function validateSettingsForm(form) {
  const errors = {};
  const duration = Number(form.duration_minutes);
  const attempts = Number(form.attempt_limit);
  const questionCount = Number(form.question_count);
  const startAt = toIsoDateTime(form.start_at);
  const endAt = toIsoDateTime(form.end_at);

  if (!form.title.trim()) errors.title = "Please complete all required information.";
  if (!editableStatusOptions.some((option) => option.value === form.status)) {
    errors.status = "Status can only be changed to draft or active before the exam starts.";
  }
  if (!Number.isInteger(duration) || duration <= 0) {
    errors.duration_minutes = "Duration must be greater than zero.";
  }
  if (!Number.isInteger(attempts) || attempts <= 0) {
    errors.attempt_limit = "Allowed attempts must be greater than zero.";
  }
  if (!Number.isInteger(questionCount) || questionCount <= 0) {
    errors.question_count = "Question count must be greater than zero.";
  }
  if (form.status === "active" && !startAt) {
    errors.start_at = "Start time is required before activating.";
  }
  if (form.status === "active" && !endAt) {
    errors.end_at = "End time is required before activating.";
  }
  if (startAt && endAt && new Date(endAt).getTime() <= new Date(startAt).getTime()) {
    errors.start_at = "End time must be later than start time.";
    errors.end_at = "End time must be later than start time.";
  }

  return errors;
}

export function buildSettingsPayload(form) {
  return {
    title: form.title,
    description: form.description,
    status: form.status,
    start_at: toIsoDateTime(form.start_at),
    end_at: toIsoDateTime(form.end_at),
    duration_minutes: Number(form.duration_minutes),
    attempt_limit: Number(form.attempt_limit),
    question_count: Number(form.question_count),
    randomize_questions: form.randomize_questions,
    randomize_answers: form.randomize_answers,
    result_visibility: form.result_visibility,
    access_code: form.access_code,
  };
}
