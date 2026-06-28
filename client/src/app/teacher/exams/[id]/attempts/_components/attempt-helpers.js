import * as XLSX from "xlsx";

export const baseScoreModes = [
  { value: "highest", label: "Highest score" },
  { value: "latest", label: "Latest attempt" },
  { value: "first", label: "First attempt" },
];

export const statusOptions = [
  { value: "all", label: "All statuses" },
  { value: "submitted", label: "Submitted" },
  { value: "in_progress", label: "In progress" },
];

export const sortOptions = [
  { value: "score_desc", label: "Score high to low" },
  { value: "score_asc", label: "Score low to high" },
  { value: "submitted_desc", label: "Newest submitted" },
  { value: "name_asc", label: "Name A-Z" },
];

export function safeFileName(value) {
  return String(value || "exam-results").replace(/[^a-z0-9-_]+/gi, "_").replace(/^_+|_+$/g, "");
}

export function learnerName(learner) {
  return learner?.full_name || learner?.username || learner?.email || "Learner";
}

export function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date).replace(",", "");
}

export function formatDuration(seconds) {
  if (!Number.isFinite(Number(seconds))) return "-";

  const totalSeconds = Math.max(Number(seconds), 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = Math.floor(totalSeconds % 60);
  const secondText = String(remainingSeconds).padStart(2, "0");

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${secondText}s`;
  return `${remainingSeconds}s`;
}

export function statusLabel(status) {
  return status === "submitted" ? "Submitted" : "In progress";
}

export function formatScore(attempt) {
  const rawScore = attempt?.score ?? attempt?.total_score;
  if (!attempt || attempt.status !== "submitted" || rawScore === null || rawScore === undefined) return "-";

  const score = Number(rawScore || 0);
  const formatted = Number.isInteger(score) ? String(score) : score.toFixed(2);
  return `${formatted}/${attempt.max_score || 10}`;
}

export function scoreValue(attempt) {
  return attempt?.status === "submitted" ? Number(attempt.score ?? attempt.total_score ?? 0) : -1;
}

export function optionLabel(index) {
  return String.fromCharCode(65 + Number(index || 0));
}

export function optionLabels(question, predicate) {
  return (question.answer_options ?? [])
    .map((option, index) => (predicate(option) ? optionLabel(index) : null))
    .filter(Boolean)
    .join(", ") || "-";
}

export function groupAttemptsByLearner(attempts) {
  const learners = new Map();

  attempts.forEach((attempt) => {
    const learnerId = attempt.learner_id || attempt.learner?.user_id;
    if (!learnerId) return;

    if (!learners.has(learnerId)) {
      learners.set(learnerId, {
        learner_id: learnerId,
        learner: attempt.learner,
        attempts: [],
      });
    }

    learners.get(learnerId).attempts.push(attempt);
  });

  return Array.from(learners.values()).map((row) => ({
    ...row,
    attempts: [...row.attempts].sort((left, right) => Number(left.attempt_number || 0) - Number(right.attempt_number || 0)),
  }));
}

export function attemptForMode(attempts, scoreMode) {
  if (!attempts.length) return null;

  if (scoreMode === "latest") {
    return [...attempts].sort((left, right) => new Date(right.started_at).getTime() - new Date(left.started_at).getTime())[0] ?? null;
  }

  if (scoreMode === "first") return attempts[0] ?? null;

  if (scoreMode.startsWith("attempt_")) {
    const attemptNumber = Number(scoreMode.replace("attempt_", ""));
    return attempts.find((attempt) => Number(attempt.attempt_number) === attemptNumber) ?? null;
  }

  const submitted = attempts.filter((attempt) => attempt.status === "submitted");
  if (!submitted.length) return attempts[attempts.length - 1] ?? null;

  return [...submitted].sort((left, right) => {
    const scoreDiff = scoreValue(right) - scoreValue(left);
    if (scoreDiff !== 0) return scoreDiff;
    return new Date(right.submitted_at || right.started_at).getTime() - new Date(left.submitted_at || left.started_at).getTime();
  })[0] ?? null;
}

export function buildScoreRows(learners, filters) {
  const query = filters.search.trim().toLowerCase();

  return learners
    .map((row) => ({
      ...row,
      selectedAttempt: attemptForMode(row.attempts, filters.scoreMode),
    }))
    .filter((row) => {
      const learner = row.learner ?? {};
      const matchesSearch =
        !query ||
        learnerName(learner).toLowerCase().includes(query) ||
        String(learner.email || "").toLowerCase().includes(query) ||
        String(learner.username || "").toLowerCase().includes(query);
      const matchesStatus = filters.status === "all" || row.selectedAttempt?.status === filters.status;

      return matchesSearch && matchesStatus;
    })
    .sort((left, right) => {
      if (filters.sortBy === "name_asc") {
        return learnerName(left.learner).localeCompare(learnerName(right.learner));
      }
      if (filters.sortBy === "score_asc") return scoreValue(left.selectedAttempt) - scoreValue(right.selectedAttempt);
      if (filters.sortBy === "submitted_desc") {
        const leftTime = left.selectedAttempt?.submitted_at ? new Date(left.selectedAttempt.submitted_at).getTime() : 0;
        const rightTime = right.selectedAttempt?.submitted_at ? new Date(right.selectedAttempt.submitted_at).getTime() : 0;
        return rightTime - leftTime;
      }
      return scoreValue(right.selectedAttempt) - scoreValue(left.selectedAttempt);
    });
}

export function scoreModeOptions(attempts) {
  const maxAttempt = Math.max(...attempts.map((attempt) => Number(attempt.attempt_number || 0)), 0);
  const attemptOptions = Array.from({ length: maxAttempt }, (_, index) => ({
    value: `attempt_${index + 1}`,
    label: `Attempt ${index + 1}`,
  }));

  return [...baseScoreModes, ...attemptOptions];
}

export function isModeSelectedAttempt(attempt, scoreMode, attempts) {
  return attempt?.exam_attempt_id === attemptForMode(attempts, scoreMode)?.exam_attempt_id;
}

export function attemptSelectLabel(attempt, scoreMode, attempts) {
  if (!attempt) return "Select attempt";
  const modeLabel = baseScoreModes.find((mode) => mode.value === scoreMode)?.label;
  if (modeLabel && isModeSelectedAttempt(attempt, scoreMode, attempts)) {
    return `Attempt #${attempt.attempt_number} - ${modeLabel}`;
  }
  return `Attempt #${attempt.attempt_number} - ${formatScore(attempt)} - ${statusLabel(attempt.status)}`;
}

export function buildScoreboardExportRows(rows, includeTime, includeWarnings) {
  const headers = ["Name", "Email", "Score", "Attempt used", "Status", "Submitted"];
  if (includeTime) headers.push("Time");
  if (includeWarnings) headers.push("Warnings");

  const body = rows.map((row) => {
    const attempt = row.selectedAttempt;
    const values = [
      learnerName(row.learner),
      row.learner?.email || "",
      formatScore(attempt),
      attempt ? `Attempt #${attempt.attempt_number}` : "-",
      attempt ? statusLabel(attempt.status) : "-",
      formatDateTime(attempt?.submitted_at),
    ];
    if (includeTime) values.push(formatDuration(attempt?.duration_seconds));
    if (includeWarnings) values.push(attempt?.warning_count ?? 0);
    return values;
  });

  return [headers, ...body];
}

export function buildAllAttemptsExportRows(attempts, includeTime, includeWarnings) {
  const headers = ["Name", "Email", "Score", "Attempt", "Status", "Submitted"];
  if (includeTime) headers.push("Time");
  if (includeWarnings) headers.push("Warnings");

  const body = attempts.map((attempt) => {
    const values = [
      learnerName(attempt.learner),
      attempt.learner?.email || "",
      formatScore(attempt),
      `Attempt #${attempt.attempt_number}`,
      statusLabel(attempt.status),
      formatDateTime(attempt.submitted_at),
    ];
    if (includeTime) values.push(formatDuration(attempt.duration_seconds));
    if (includeWarnings) values.push(attempt.warning_count ?? 0);
    return values;
  });

  return [headers, ...body];
}

export function exportWorkbook(data, rows, attempts, options) {
  const worksheetRows = options.mode === "all"
    ? buildAllAttemptsExportRows(attempts, options.includeTime, options.includeWarnings)
    : buildScoreboardExportRows(rows, options.includeTime, options.includeWarnings);
  const sheet = XLSX.utils.aoa_to_sheet(worksheetRows);
  sheet["!cols"] = worksheetRows[0].map((header) => ({ wch: ["Name", "Email"].includes(header) ? 26 : 16 }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, options.mode === "all" ? "All Attempts" : "Scoreboard");
  XLSX.writeFile(workbook, `${safeFileName(data.exam?.title) || "exam"}_results.xlsx`, { compression: true });
}
