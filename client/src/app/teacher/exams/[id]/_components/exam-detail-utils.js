const lockedStatuses = new Set(["closed", "archived"]);

export function getExamErrorMessage(error) {
  return (
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.message ||
    "Failed to load data. Please check your connection and try again."
  );
}

export function isExamLocked(exam) {
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
