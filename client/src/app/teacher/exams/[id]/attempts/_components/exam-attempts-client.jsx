"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Download,
  Eye,
  FileSpreadsheet,
  Hourglass,
  Search,
  Users,
} from "lucide-react";
import * as XLSX from "xlsx";

import { Button } from "@/components/ui/button";
import { examsService } from "@/services/exams.service";

const defaultExportColumns = [
  { id: "attempt", label: "Attempt", header: "Attempt" },
  { id: "status", label: "Status", header: "Status" },
  { id: "started_at", label: "Started at", header: "Started at" },
  { id: "submitted_at", label: "Submitted at", header: "Submitted at" },
  { id: "score", label: "Score", header: "Score" },
];

const optionalExportColumns = [
  { id: "time_spent", label: "Time spent", header: "Time spent" },
  { id: "warnings", label: "Warnings", header: "Warnings" },
];

const statusOptions = [
  { value: "all", label: "All attempts" },
  { value: "submitted", label: "Submitted" },
  { value: "in_progress", label: "In progress" },
];

const sortOptions = [
  { value: "started_desc", label: "Newest start time" },
  { value: "started_asc", label: "Oldest start time" },
  { value: "submitted_desc", label: "Newest submit time" },
  { value: "submitted_asc", label: "Oldest submit time" },
  { value: "name_asc", label: "Name A-Z" },
];

function getErrorMessage(error) {
  return error?.response?.data?.error || error?.response?.data?.message || error?.message || "Unable to load exam attempts.";
}

function safeFileName(value) {
  return String(value || "exam-attempts").replace(/[^a-z0-9-_]+/gi, "_").replace(/^_+|_+$/g, "");
}

function learnerName(learner) {
  return learner?.full_name || learner?.username || learner?.email || "Learner";
}

function formatDateTime(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDuration(seconds) {
  if (!Number.isFinite(Number(seconds))) return "-";

  const totalSeconds = Math.max(Number(seconds), 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = Math.floor(totalSeconds % 60);

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${remainingSeconds}s`;
  return `${remainingSeconds}s`;
}

function formatScore(attempt) {
  if (attempt.status !== "submitted" || attempt.score === null || attempt.score === undefined) return "-";

  const score = Number(attempt.score || 0);
  const formatted = Number.isInteger(score) ? String(score) : score.toFixed(2);
  return `${formatted}/${attempt.max_score || 10}`;
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

function StatCard({ icon: Icon, label, value, tone = "blue" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
  };

  return (
    <section className="rounded-md border border-border bg-card p-4 shadow-sm">
      <div className={`mb-3 grid size-9 place-items-center rounded-md ${tones[tone] ?? tones.blue}`}>
        <Icon className="size-4" />
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-sm font-semibold text-muted-foreground">{label}</p>
    </section>
  );
}

function StatusBadge({ status }) {
  const config = statusConfig(status);
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${config.className}`}>
      <Icon className="size-3.5" />
      {config.label}
    </span>
  );
}

function compareTime(left, right, key, direction) {
  const leftTime = left[key] ? new Date(left[key]).getTime() : 0;
  const rightTime = right[key] ? new Date(right[key]).getTime() : 0;
  return (leftTime - rightTime) * direction;
}

function filterAndSortAttempts(attempts, { search, status, sortBy }) {
  const query = search.trim().toLowerCase();

  return attempts
    .filter((attempt) => {
      const learner = attempt.learner ?? {};
      const matchesSearch =
        !query ||
        learnerName(learner).toLowerCase().includes(query) ||
        String(learner.email || "").toLowerCase().includes(query) ||
        String(learner.username || "").toLowerCase().includes(query);
      const matchesStatus = status === "all" || attempt.status === status;

      return matchesSearch && matchesStatus;
    })
    .sort((left, right) => {
      if (sortBy === "name_asc") {
        return learnerName(left.learner).localeCompare(learnerName(right.learner));
      }
      if (sortBy === "started_asc") return compareTime(left, right, "started_at", 1);
      if (sortBy === "submitted_asc") return compareTime(left, right, "submitted_at", 1);
      if (sortBy === "submitted_desc") return compareTime(left, right, "submitted_at", -1);
      return compareTime(left, right, "started_at", -1);
    });
}

function exportValue(attempt, columnId) {
  const values = {
    attempt: `#${attempt.attempt_number}`,
    status: statusLabel(attempt.status),
    started_at: formatDateTime(attempt.started_at),
    submitted_at: formatDateTime(attempt.submitted_at),
    time_spent: formatDuration(attempt.duration_seconds),
    score: formatScore(attempt),
    warnings: attempt.warning_count || 0,
  };

  return values[columnId] ?? "";
}

function exportWorkbook(data, attempts, selectedColumns) {
  const activeColumns = [
    ...defaultExportColumns,
    ...optionalExportColumns.filter((column) => selectedColumns[column.id]),
  ];
  const rows = [
    ["Name", "Email", ...activeColumns.map((column) => column.header)],
    ...attempts.map((attempt) => [
      learnerName(attempt.learner),
      attempt.learner?.email || "",
      ...activeColumns.map((column) => exportValue(attempt, column.id)),
    ]),
  ];
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet["!cols"] = [
    { wch: 24 },
    { wch: 28 },
    ...activeColumns.map((column) => ({ wch: ["started_at", "submitted_at"].includes(column.id) ? 24 : 14 })),
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Attempts");
  XLSX.writeFile(workbook, `${safeFileName(data.exam?.title) || "exam"}_attempts.xlsx`, { compression: true });
}

function AttemptsToolbar({ filters, onFiltersChange, onApply }) {
  return (
    <section className="rounded-md border border-border bg-card p-4 shadow-sm">
      <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_180px_220px_auto]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className="h-10 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm font-semibold text-foreground outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
            onChange={(event) => onFiltersChange((current) => ({ ...current, search: event.target.value }))}
            placeholder="Search by learner name or email"
            value={filters.search}
          />
        </label>
        <select
          className="h-10 rounded-md border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
          onChange={(event) => onFiltersChange((current) => ({ ...current, status: event.target.value }))}
          value={filters.status}
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          className="h-10 rounded-md border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
          onChange={(event) => onFiltersChange((current) => ({ ...current, sortBy: event.target.value }))}
          value={filters.sortBy}
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Button className="h-10" onClick={onApply}>
          Apply
        </Button>
      </div>
    </section>
  );
}

function ExportPanel({ data, attempts, selectedColumns, onSelectedColumnsChange }) {
  const exportDisabled = !attempts.length;

  return (
    <section className="rounded-md border border-border bg-card shadow-sm">
      <div className="border-b border-border px-4 py-3">
        <h2 className="inline-flex items-center gap-2 text-sm font-bold text-foreground">
          <FileSpreadsheet className="size-4 text-emerald-600" />
          Export attempt data to Excel
        </h2>
      </div>
      <div className="flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <p className="text-xs font-bold text-muted-foreground">
            Name, email, attempt, status, started at, submitted at, and score are always included.
          </p>
          <div className="flex flex-wrap gap-4">
            {optionalExportColumns.map((column) => (
              <label key={column.id} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <input
                  checked={selectedColumns[column.id]}
                  className="size-4 accent-blue-700"
                  onChange={(event) => onSelectedColumnsChange((current) => ({ ...current, [column.id]: event.target.checked }))}
                  type="checkbox"
                />
                {column.label}
              </label>
            ))}
          </div>
        </div>
        <Button disabled={exportDisabled} onClick={() => exportWorkbook(data, attempts, selectedColumns)}>
          <Download data-icon="inline-start" />
          Export to Excel
        </Button>
      </div>
    </section>
  );
}

function AttemptsTable({ attempts }) {
  if (!attempts.length) {
    return (
      <section className="rounded-md border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-3 grid size-10 place-items-center rounded-md bg-muted text-muted-foreground">
          <ClipboardList className="size-5" />
        </div>
        <h2 className="text-base font-bold text-foreground">No attempts yet</h2>
        <p className="mt-2 text-sm font-medium text-muted-foreground">
          Learner attempts will appear here after someone starts this exam.
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-md border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1320px] table-fixed border-collapse text-left text-sm">
          <thead className="bg-muted text-xs font-bold uppercase text-muted-foreground">
            <tr>
              <th className="w-[250px] whitespace-nowrap px-4 py-3">Learner</th>
              <th className="w-[96px] whitespace-nowrap px-4 py-3">Attempt</th>
              <th className="w-[150px] whitespace-nowrap px-4 py-3">Status</th>
              <th className="w-[190px] whitespace-nowrap px-4 py-3">Started at</th>
              <th className="w-[190px] whitespace-nowrap px-4 py-3">Submitted at</th>
              <th className="w-[130px] whitespace-nowrap px-4 py-3">Time spent</th>
              <th className="w-[110px] whitespace-nowrap px-4 py-3">Score</th>
              <th className="w-[120px] whitespace-nowrap px-4 py-3">Warnings</th>
              <th className="w-[170px] whitespace-nowrap px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {attempts.map((attempt) => (
              <tr key={attempt.exam_attempt_id} className="align-middle transition hover:bg-muted/40">
                <td className="px-4 py-4">
                  <div className="truncate font-bold text-foreground">{learnerName(attempt.learner)}</div>
                  <div className="mt-1 truncate text-xs font-medium text-muted-foreground">{attempt.learner?.email || "No email"}</div>
                </td>
                <td className="whitespace-nowrap px-4 py-4 font-bold text-foreground">#{attempt.attempt_number}</td>
                <td className="whitespace-nowrap px-4 py-4">
                  <StatusBadge status={attempt.status} />
                </td>
                <td className="whitespace-nowrap px-4 py-4 font-medium text-muted-foreground">{formatDateTime(attempt.started_at)}</td>
                <td className="whitespace-nowrap px-4 py-4 font-medium text-muted-foreground">{formatDateTime(attempt.submitted_at)}</td>
                <td className="whitespace-nowrap px-4 py-4 font-medium text-muted-foreground">{formatDuration(attempt.duration_seconds)}</td>
                <td className="whitespace-nowrap px-4 py-4 font-bold text-foreground">{formatScore(attempt)}</td>
                <td className="whitespace-nowrap px-4 py-4">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">
                    <AlertTriangle className="size-3.5" />
                    {attempt.warning_count || 0}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-4">
                  {attempt.status === "submitted" ? (
                    <Button disabled size="sm" variant="outline" title="Attempt detail is coming soon">
                      <Eye data-icon="inline-start" />
                      View details
                    </Button>
                  ) : (
                    <span className="text-xs font-bold text-muted-foreground">Student is taking exam</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function ExamAttemptsClient({ examId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    sortBy: "started_desc",
  });
  const [draftFilters, setDraftFilters] = useState({
    search: "",
    status: "all",
    sortBy: "started_desc",
  });
  const [selectedColumns, setSelectedColumns] = useState(
    Object.fromEntries(optionalExportColumns.map((column) => [column.id, true]))
  );

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

  const visibleAttempts = useMemo(
    () => filterAndSortAttempts(data?.attempts ?? [], filters),
    [data, filters]
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
        <section className="mx-auto max-w-7xl rounded-md border border-border bg-card p-6 text-sm font-medium text-muted-foreground shadow-sm">
          Loading exam attempts...
        </section>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
        <section className="mx-auto max-w-3xl space-y-4 rounded-md border border-border bg-card p-6 shadow-sm">
          <p className="text-sm font-medium text-destructive">{error || "Exam attempts are not available."}</p>
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
              <h1 className="text-3xl font-bold tracking-normal text-foreground">Exam Attempts</h1>
              <p className="mt-2 text-sm font-medium text-muted-foreground">{data.exam?.title}</p>
            </div>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={ClipboardList} label="Total attempts" value={data.summary.totalAttempts} />
          <StatCard icon={Hourglass} label="In progress" value={data.summary.inProgressCount} tone="amber" />
          <StatCard icon={CheckCircle2} label="Submitted" value={data.summary.submittedCount} tone="green" />
          <StatCard icon={Users} label="Learners" value={data.summary.uniqueLearners} tone="rose" />
        </section>

        <ExportPanel
          attempts={visibleAttempts}
          data={data}
          onSelectedColumnsChange={setSelectedColumns}
          selectedColumns={selectedColumns}
        />

        <AttemptsToolbar
          filters={draftFilters}
          onApply={() => setFilters(draftFilters)}
          onFiltersChange={setDraftFilters}
        />

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="inline-flex items-center gap-2 text-base font-bold uppercase tracking-normal text-foreground">
              <Clock3 className="size-4 text-blue-700" />
              Attempt List
            </h2>
            <p className="text-sm font-bold text-muted-foreground">
              {visibleAttempts.length} of {(data.attempts ?? []).length} shown
            </p>
          </div>
          <AttemptsTable attempts={visibleAttempts} />
        </section>
      </section>
    </main>
  );
}
