"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Eye,
  Hourglass,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { examsService } from "@/services/exams.service";

function getErrorMessage(error) {
  return error?.response?.data?.error || error?.response?.data?.message || error?.message || "Unable to load exam attempts.";
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
        <table className="w-full min-w-[1120px] table-fixed border-collapse text-left text-sm">
          <thead className="bg-muted text-xs font-bold uppercase text-muted-foreground">
            <tr>
              <th className="w-[22%] px-4 py-3">Learner</th>
              <th className="w-[9%] px-4 py-3">Attempt</th>
              <th className="w-[13%] px-4 py-3">Status</th>
              <th className="w-[14%] px-4 py-3">Started at</th>
              <th className="w-[14%] px-4 py-3">Submitted at</th>
              <th className="w-[10%] px-4 py-3">Time spent</th>
              <th className="w-[8%] px-4 py-3">Score</th>
              <th className="w-[8%] px-4 py-3">Warnings</th>
              <th className="w-[12%] px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {attempts.map((attempt) => (
              <tr key={attempt.exam_attempt_id} className="align-middle transition hover:bg-muted/40">
                <td className="px-4 py-4">
                  <div className="truncate font-bold text-foreground">{learnerName(attempt.learner)}</div>
                  <div className="mt-1 truncate text-xs font-medium text-muted-foreground">{attempt.learner?.email || "No email"}</div>
                </td>
                <td className="px-4 py-4 font-bold text-foreground">#{attempt.attempt_number}</td>
                <td className="px-4 py-4">
                  <StatusBadge status={attempt.status} />
                </td>
                <td className="px-4 py-4 font-medium text-muted-foreground">{formatDateTime(attempt.started_at)}</td>
                <td className="px-4 py-4 font-medium text-muted-foreground">{formatDateTime(attempt.submitted_at)}</td>
                <td className="px-4 py-4 font-medium text-muted-foreground">{formatDuration(attempt.duration_seconds)}</td>
                <td className="px-4 py-4 font-bold text-foreground">{formatScore(attempt)}</td>
                <td className="px-4 py-4">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">
                    <AlertTriangle className="size-3.5" />
                    {attempt.warning_count || 0}
                  </span>
                </td>
                <td className="px-4 py-4">
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
          <StatCard icon={Users} label="Unique learners" value={data.summary.uniqueLearners} tone="rose" />
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="inline-flex items-center gap-2 text-base font-bold uppercase tracking-normal text-foreground">
              <Clock3 className="size-4 text-blue-700" />
              Attempt List
            </h2>
          </div>
          <AttemptsTable attempts={data.attempts ?? []} />
        </section>
      </section>
    </main>
  );
}
