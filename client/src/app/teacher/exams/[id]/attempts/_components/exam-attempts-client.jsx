"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Download,
  Eye,
  FileSpreadsheet,
  Hourglass,
  Search,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";
import * as XLSX from "xlsx";

import { Button } from "@/components/ui/button";
import { examsService } from "@/services/exams.service";

const baseScoreModes = [
  { value: "highest", label: "Highest score" },
  { value: "latest", label: "Latest attempt" },
  { value: "first", label: "First attempt" },
];

const statusOptions = [
  { value: "all", label: "All statuses" },
  { value: "submitted", label: "Submitted" },
  { value: "in_progress", label: "In progress" },
];

const sortOptions = [
  { value: "score_desc", label: "Score high to low" },
  { value: "score_asc", label: "Score low to high" },
  { value: "submitted_desc", label: "Newest submitted" },
  { value: "name_asc", label: "Name A-Z" },
];

function getErrorMessage(error) {
  return error?.response?.data?.error || error?.response?.data?.message || error?.message || "Unable to load exam results.";
}

function safeFileName(value) {
  return String(value || "exam-results").replace(/[^a-z0-9-_]+/gi, "_").replace(/^_+|_+$/g, "");
}

function learnerName(learner) {
  return learner?.full_name || learner?.username || learner?.email || "Learner";
}

function formatDateTime(value) {
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

function formatDuration(seconds) {
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

function statusLabel(status) {
  return status === "submitted" ? "Submitted" : "In progress";
}

function statusConfig(status) {
  if (status === "submitted") {
    return {
      label: "Submitted",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      icon: CheckCircle2,
    };
  }

  return {
    label: "In progress",
    className: "border-amber-200 bg-amber-50 text-amber-700",
    icon: Hourglass,
  };
}

function formatScore(attempt) {
  if (!attempt || attempt.status !== "submitted" || attempt.score === null || attempt.score === undefined) return "-";

  const score = Number(attempt.score || 0);
  const formatted = Number.isInteger(score) ? String(score) : score.toFixed(2);
  return `${formatted}/${attempt.max_score || 10}`;
}

function scoreValue(attempt) {
  return attempt?.status === "submitted" ? Number(attempt.score || 0) : -1;
}

function optionLabel(index) {
  return String.fromCharCode(65 + Number(index || 0));
}

function optionLabels(question, predicate) {
  return (question.answer_options ?? [])
    .map((option, index) => (predicate(option) ? optionLabel(index) : null))
    .filter(Boolean)
    .join(", ") || "-";
}

function groupAttemptsByLearner(attempts) {
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

function attemptForMode(attempts, scoreMode) {
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

function buildScoreRows(learners, filters) {
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

function scoreModeOptions(attempts) {
  const maxAttempt = Math.max(...attempts.map((attempt) => Number(attempt.attempt_number || 0)), 0);
  const attemptOptions = Array.from({ length: maxAttempt }, (_, index) => ({
    value: `attempt_${index + 1}`,
    label: `Attempt ${index + 1}`,
  }));

  return [...baseScoreModes, ...attemptOptions];
}

function isModeSelectedAttempt(attempt, scoreMode, attempts) {
  return attempt?.exam_attempt_id === attemptForMode(attempts, scoreMode)?.exam_attempt_id;
}

function attemptSelectLabel(attempt, scoreMode, attempts) {
  if (!attempt) return "Select attempt";
  const modeLabel = baseScoreModes.find((mode) => mode.value === scoreMode)?.label;
  if (modeLabel && isModeSelectedAttempt(attempt, scoreMode, attempts)) {
    return `Attempt #${attempt.attempt_number} - ${modeLabel}`;
  }
  return `Attempt #${attempt.attempt_number} - ${formatScore(attempt)} - ${statusLabel(attempt.status)}`;
}

function StatCard({ icon: Icon, label, value, tone = "blue" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
  };

  return (
    <section className="rounded-md border border-border bg-card p-4 shadow-sm">
      <div className={`mb-3 grid size-8 place-items-center rounded-md ${tones[tone] ?? tones.blue}`}>
        <Icon className="size-4" />
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-sm font-semibold text-muted-foreground">{label}</p>
    </section>
  );
}

function StatusBadge({ status }) {
  if (!status) return <span className="text-sm font-bold text-muted-foreground">-</span>;
  const config = statusConfig(status);
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${config.className}`}>
      <Icon className="size-3.5" />
      {config.label}
    </span>
  );
}

function WarningBadge({ count }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">
      <AlertTriangle className="size-3.5" />
      {count || 0}
    </span>
  );
}

function ExportMenu({ open, options, onChange, onExport }) {
  if (!open) return null;

  return (
    <section className="rounded-md border border-border bg-card shadow-sm">
      <div className="border-b border-border px-4 py-3">
        <h2 className="inline-flex items-center gap-2 text-sm font-bold text-foreground">
          <FileSpreadsheet className="size-4 text-emerald-600" />
          Export options
        </h2>
      </div>
      <div className="flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-4">
          <label className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <input
              checked={options.mode === "current"}
              className="size-4 accent-blue-700"
              name="export-mode"
              onChange={() => onChange((current) => ({ ...current, mode: "current" }))}
              type="radio"
            />
            Export current scoreboard view
          </label>
          <label className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <input
              checked={options.mode === "all"}
              className="size-4 accent-blue-700"
              name="export-mode"
              onChange={() => onChange((current) => ({ ...current, mode: "all" }))}
              type="radio"
            />
            Export all attempts
          </label>
          <label className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <input
              checked={options.includeTime}
              className="size-4 accent-blue-700"
              onChange={(event) => onChange((current) => ({ ...current, includeTime: event.target.checked }))}
              type="checkbox"
            />
            Include time spent
          </label>
          <label className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <input
              checked={options.includeWarnings}
              className="size-4 accent-blue-700"
              onChange={(event) => onChange((current) => ({ ...current, includeWarnings: event.target.checked }))}
              type="checkbox"
            />
            Include warnings
          </label>
        </div>
        <Button onClick={onExport}>
          <Download data-icon="inline-start" />
          Export
        </Button>
      </div>
    </section>
  );
}

function Filters({ filters, onChange, scoreOptions }) {
  return (
    <section className="rounded-md border border-border bg-card p-4 shadow-sm">
      <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_190px_150px_210px]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className="h-10 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm font-semibold text-foreground outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
            onChange={(event) => onChange((current) => ({ ...current, search: event.target.value }))}
            placeholder="Search learner by name or email"
            value={filters.search}
          />
        </label>
        <select
          aria-label="Score shown"
          className="h-10 rounded-md border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
          onChange={(event) => onChange((current) => ({ ...current, scoreMode: event.target.value }))}
          value={filters.scoreMode}
        >
          {scoreOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Status"
          className="h-10 rounded-md border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
          onChange={(event) => onChange((current) => ({ ...current, status: event.target.value }))}
          value={filters.status}
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Sort"
          className="h-10 rounded-md border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
          onChange={(event) => onChange((current) => ({ ...current, sortBy: event.target.value }))}
          value={filters.sortBy}
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}

function ResultTable({ rows, totalLearners, onViewResult }) {
  if (!rows.length) {
    return (
      <section className="rounded-md border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-3 grid size-10 place-items-center rounded-md bg-muted text-muted-foreground">
          <ClipboardList className="size-5" />
        </div>
        <h2 className="text-base font-bold text-foreground">No results found</h2>
        <p className="mt-2 text-sm font-medium text-muted-foreground">
          Try changing the search, score mode, status, or sort filters.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold uppercase tracking-normal text-foreground">Result List</h2>
        <p className="text-sm font-bold text-muted-foreground">{rows.length} of {totalLearners} learners shown</p>
      </div>

      <section className="overflow-hidden rounded-md border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] table-fixed border-collapse text-left text-sm">
            <thead className="bg-muted text-xs font-bold uppercase text-muted-foreground">
              <tr>
                <th className="w-[240px] whitespace-nowrap px-3 py-3">Learner</th>
                <th className="w-[90px] whitespace-nowrap px-3 py-3">Score</th>
                <th className="w-[120px] whitespace-nowrap px-3 py-3">Attempt used</th>
                <th className="w-[130px] whitespace-nowrap px-3 py-3">Status</th>
                <th className="w-[130px] whitespace-nowrap px-3 py-3">Submitted</th>
                <th className="w-[95px] whitespace-nowrap px-3 py-3">Time</th>
                <th className="w-[95px] whitespace-nowrap px-3 py-3">Warnings</th>
                <th className="w-[120px] whitespace-nowrap px-3 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => {
                const attempt = row.selectedAttempt;
                return (
                  <tr key={row.learner_id} className="align-middle transition hover:bg-muted/40">
                    <td className="px-3 py-4">
                      <div className="truncate font-bold text-foreground">{learnerName(row.learner)}</div>
                      <div className="mt-1 truncate text-xs font-medium text-muted-foreground">{row.learner?.email || "No email"}</div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 font-bold text-foreground">{formatScore(attempt)}</td>
                    <td className="whitespace-nowrap px-3 py-4 font-medium text-muted-foreground">
                      {attempt ? `Attempt #${attempt.attempt_number}` : "-"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4">
                      <StatusBadge status={attempt?.status} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 font-medium text-muted-foreground">{formatDateTime(attempt?.submitted_at)}</td>
                    <td className="whitespace-nowrap px-3 py-4 font-medium text-muted-foreground">{formatDuration(attempt?.duration_seconds)}</td>
                    <td className="whitespace-nowrap px-3 py-4">
                      <WarningBadge count={attempt?.warning_count ?? 0} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-4">
                      {attempt ? (
                        <Button className="px-2" size="sm" onClick={() => onViewResult(row, attempt)}>
                          <Eye data-icon="inline-start" />
                          View result
                        </Button>
                      ) : (
                        <span className="text-xs font-bold text-muted-foreground">No attempt</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

function buildScoreboardExportRows(rows, includeTime, includeWarnings) {
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

function buildAllAttemptsExportRows(attempts, includeTime, includeWarnings) {
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

function exportWorkbook(data, rows, attempts, options) {
  const worksheetRows = options.mode === "all"
    ? buildAllAttemptsExportRows(attempts, options.includeTime, options.includeWarnings)
    : buildScoreboardExportRows(rows, options.includeTime, options.includeWarnings);
  const sheet = XLSX.utils.aoa_to_sheet(worksheetRows);
  sheet["!cols"] = worksheetRows[0].map((header) => ({ wch: ["Name", "Email"].includes(header) ? 26 : 16 }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, options.mode === "all" ? "All Attempts" : "Scoreboard");
  XLSX.writeFile(workbook, `${safeFileName(data.exam?.title) || "exam"}_results.xlsx`, { compression: true });
}

function DetailView({ data, detail, onBack, onSelectAttempt, selectedAttemptId, scoreMode }) {
  const selectedAttempt = detail?.attempt;
  const learnerAttempts = detail?.learnerRow?.attempts ?? [];
  const loading = detail?.loading;
  const error = detail?.error;
  const result = detail?.result;

  return (
    <main className="min-h-screen bg-muted/40 px-4 py-5 text-foreground sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-normal text-foreground">{learnerName(detail?.learnerRow?.learner)}</h1>
            <p className="mt-2 text-sm font-medium text-muted-foreground">Email: {detail?.learnerRow?.learner?.email || "No email"}</p>
          </div>
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft data-icon="inline-start" />
            Back to scoreboard
          </Button>
        </header>

        <section className="rounded-md border border-border bg-card p-4 shadow-sm">
          <select
            className="h-10 w-full max-w-md rounded-md border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
            onChange={(event) => onSelectAttempt(event.target.value)}
            value={selectedAttemptId || ""}
          >
            {learnerAttempts.map((attempt) => (
              <option key={attempt.exam_attempt_id} value={attempt.exam_attempt_id}>
                {attemptSelectLabel(attempt, scoreMode, learnerAttempts)}
              </option>
            ))}
          </select>
        </section>

        {loading ? (
          <section className="rounded-md border border-border bg-card p-6 text-sm font-medium text-muted-foreground shadow-sm">
            Loading result detail...
          </section>
        ) : null}

        {error ? (
          <section className="rounded-md border border-border bg-card p-6 text-sm font-semibold text-destructive shadow-sm">
            {error}
          </section>
        ) : null}

        {!loading && !error ? (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <StatCard icon={ClipboardList} label="Score" value={formatScore(selectedAttempt)} />
              <StatCard icon={ClipboardList} label="Attempt" value={selectedAttempt ? `#${selectedAttempt.attempt_number}` : "-"} />
              <StatCard icon={selectedAttempt?.status === "submitted" ? CheckCircle2 : Hourglass} label="Status" value={selectedAttempt ? statusLabel(selectedAttempt.status) : "-"} tone={selectedAttempt?.status === "submitted" ? "green" : "amber"} />
              <StatCard icon={ClockIconShim} label="Time spent" value={formatDuration(selectedAttempt?.duration_seconds)} />
              <StatCard icon={AlertTriangle} label="Warnings" value={selectedAttempt?.warning_count ?? 0} tone="rose" />
            </section>

            <section className="rounded-md border border-border bg-card p-4 shadow-sm">
              <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <dt className="font-bold text-muted-foreground">Started at</dt>
                  <dd className="mt-1 font-semibold text-foreground">{formatDateTime(selectedAttempt?.started_at)}</dd>
                </div>
                <div>
                  <dt className="font-bold text-muted-foreground">Submitted at</dt>
                  <dd className="mt-1 font-semibold text-foreground">{formatDateTime(selectedAttempt?.submitted_at)}</dd>
                </div>
                <div>
                  <dt className="font-bold text-muted-foreground">Exam</dt>
                  <dd className="mt-1 font-semibold text-foreground">{data.exam?.title}</dd>
                </div>
                <div>
                  <dt className="font-bold text-muted-foreground">Class</dt>
                  <dd className="mt-1 font-semibold text-foreground">{data.exam?.classes?.class_name || "Class"}</dd>
                </div>
              </dl>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold uppercase tracking-normal text-foreground">Question Review</h2>
              {result?.review_available ? (
                <section className="overflow-hidden rounded-md border border-border bg-card shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[980px] table-fixed border-collapse text-left text-sm">
                      <thead className="bg-muted text-xs font-bold uppercase text-muted-foreground">
                        <tr>
                          <th className="w-[80px] px-3 py-3">Question</th>
                          <th className="w-[280px] px-3 py-3">Question content</th>
                          <th className="w-[130px] px-3 py-3">Learner answer</th>
                          <th className="w-[130px] px-3 py-3">Correct answer</th>
                          <th className="w-[120px] px-3 py-3">Result</th>
                          <th className="w-[240px] px-3 py-3">Explanation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {(result.questions ?? []).map((question, index) => (
                          <tr key={question.exam_question_id} className="align-top">
                            <td className="whitespace-nowrap px-3 py-4 font-bold text-foreground">Q{index + 1}</td>
                            <td className="px-3 py-4 font-medium text-foreground">{question.question_text}</td>
                            <td className="whitespace-nowrap px-3 py-4 font-medium text-muted-foreground">{optionLabels(question, (option) => option.is_selected)}</td>
                            <td className="whitespace-nowrap px-3 py-4 font-medium text-muted-foreground">{optionLabels(question, (option) => option.is_correct)}</td>
                            <td className="whitespace-nowrap px-3 py-4">
                              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${question.is_correct ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
                                {question.is_correct ? <CheckCircle2 className="size-3.5" /> : <XCircle className="size-3.5" />}
                                {question.is_correct ? "Correct" : "Incorrect"}
                              </span>
                            </td>
                            <td className="px-3 py-4 text-muted-foreground">{question.explanation || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              ) : (
                <section className="rounded-md border border-border bg-card p-6 text-sm font-semibold text-muted-foreground shadow-sm">
                  {result?.message || "Question review is available after the attempt is submitted."}
                </section>
              )}
            </section>
          </>
        ) : null}
      </section>
    </main>
  );
}

function ClockIconShim(props) {
  return <Hourglass {...props} />;
}

export function ExamAttemptsClient({ examId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    scoreMode: "highest",
    status: "all",
    sortBy: "score_desc",
  });
  const [exportOpen, setExportOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    mode: "current",
    includeTime: true,
    includeWarnings: true,
  });
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    let ignore = false;

    examsService
      .getAttempts(examId)
      .then((attemptsData) => {
        if (ignore) return;
        setData(attemptsData);
      })
      .catch((loadError) => {
        if (ignore) return;
        setError(getErrorMessage(loadError));
      })
      .finally(() => {
        if (ignore) return;
        setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [examId]);

  const learners = useMemo(() => groupAttemptsByLearner(data?.attempts ?? []), [data]);
  const scoreOptions = useMemo(() => scoreModeOptions(data?.attempts ?? []), [data]);
  const rows = useMemo(() => buildScoreRows(learners, filters), [learners, filters]);

  function loadAttemptDetail(learnerRow, attempt) {
    setDetail({
      learnerRow,
      selectedAttemptId: attempt.exam_attempt_id,
      attempt,
      loading: true,
      error: "",
      result: null,
    });

    examsService
      .getTeacherAttemptResults(attempt.exam_attempt_id)
      .then((result) => {
        setDetail({
          learnerRow,
          selectedAttemptId: attempt.exam_attempt_id,
          attempt: result.attempt,
          loading: false,
          error: "",
          result,
        });
      })
      .catch((loadError) => {
        setDetail({
          learnerRow,
          selectedAttemptId: attempt.exam_attempt_id,
          attempt,
          loading: false,
          error: getErrorMessage(loadError),
          result: null,
        });
      });
  }

  function handleSelectDetailAttempt(attemptId) {
    if (!detail?.learnerRow) return;
    const attempt = detail.learnerRow.attempts.find((item) => item.exam_attempt_id === attemptId);
    if (attempt) loadAttemptDetail(detail.learnerRow, attempt);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
        <section className="mx-auto max-w-7xl rounded-md border border-border bg-card p-6 text-sm font-medium text-muted-foreground shadow-sm">
          Loading exam results...
        </section>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
        <section className="mx-auto max-w-3xl space-y-4 rounded-md border border-border bg-card p-6 shadow-sm">
          <p className="text-sm font-medium text-destructive">{error || "Exam results are not available."}</p>
          <Button asChild variant="outline">
            <Link href={`/teacher/exams/${examId}`}>
              <ArrowLeft data-icon="inline-start" />
              Back to exam detail
            </Link>
          </Button>
        </section>
      </main>
    );
  }

  if (detail) {
    return (
      <DetailView
        data={data}
        detail={detail}
        onBack={() => setDetail(null)}
        onSelectAttempt={handleSelectDetailAttempt}
        scoreMode={filters.scoreMode}
        selectedAttemptId={detail.selectedAttemptId}
      />
    );
  }

  return (
    <main className="min-h-screen bg-muted/40 px-4 py-5 text-foreground sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <Link href={`/teacher/exams/${examId}`} className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground">
              <ArrowLeft className="size-4" />
              Back to exam detail
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-normal text-foreground">Exam Results</h1>
              <p className="mt-2 text-sm font-medium text-muted-foreground">Exam: {data.exam?.title}</p>
            </div>
          </div>
          <Button onClick={() => setExportOpen((current) => !current)}>
            <Download data-icon="inline-start" />
            Export
          </Button>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <StatCard icon={ClipboardList} label="Total attempts" value={data.summary.totalAttempts} />
          <StatCard icon={Hourglass} label="In progress" value={data.summary.inProgressCount} tone="amber" />
          <StatCard icon={CheckCircle2} label="Submitted" value={data.summary.submittedCount} tone="green" />
          <StatCard icon={Users} label="Attempted learners" value={data.summary.uniqueLearners} tone="rose" />
          <StatCard icon={UserCheck} label="Class members" value={data.summary.classLearnersCount ?? 0} />
        </section>

        <ExportMenu
          onChange={setExportOptions}
          onExport={() => exportWorkbook(data, rows, data.attempts ?? [], exportOptions)}
          open={exportOpen}
          options={exportOptions}
        />

        <Filters filters={filters} onChange={setFilters} scoreOptions={scoreOptions} />

        <ResultTable rows={rows} totalLearners={learners.length} onViewResult={loadAttemptDetail} />
      </section>
    </main>
  );
}
