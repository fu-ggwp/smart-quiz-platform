"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarClock, Settings } from "lucide-react";

import { examsService } from "@/services/exams.service";

import {
  formatDateTime,
  formatVisibility,
  getStatusClassName,
  getStatusLabel,
} from "../_components/exam-session-options";

const lockedStatuses = new Set(["active", "closed", "archived"]);

function getErrorMessage(error) {
  return (
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.message ||
    "Failed to load data. Please check your connection and try again."
  );
}

function isExamLocked(exam) {
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

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold leading-none ${getStatusClassName(
        status
      )}`}
    >
      {getStatusLabel(status)}
    </span>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <div className="text-xs font-bold uppercase text-muted-foreground">{label}</div>
      <div className="mt-2 text-sm font-bold text-foreground">{value || "Not set"}</div>
    </div>
  );
}

function BooleanItem({ label, enabled }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-background p-3">
      <span className="text-sm font-bold text-foreground">{label}</span>
      <span
        className={`rounded-full border px-2.5 py-1 text-xs font-bold ${
          enabled
            ? "border-auth-action/30 bg-auth-action/10 text-auth-action"
            : "border-border bg-muted text-muted-foreground"
        }`}
      >
        {enabled ? "Enabled" : "Disabled"}
      </span>
    </div>
  );
}

export default function TeacherExamDetailPage() {
  const { id } = useParams();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const locked = useMemo(() => isExamLocked(exam), [exam]);

  useEffect(() => {
    let ignore = false;

    examsService
      .getOne(id)
      .then((data) => {
        if (ignore) return;
        setExam(data);
        setError("");
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
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
        <section className="mx-auto max-w-7xl rounded-md border border-border bg-card p-6 text-sm font-medium text-muted-foreground shadow-sm">
          Loading exam details...
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
        <section className="mx-auto max-w-3xl space-y-4 rounded-md border border-border bg-card p-6 shadow-sm">
          <p className="text-sm font-medium text-destructive">{error}</p>
          <Link
            href="/teacher/exams"
            className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm font-bold hover:bg-muted"
          >
            <ArrowLeft className="size-4" />
            Back to exams
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-5 font-sans text-foreground [font-family:var(--font-geist-sans),Arial,sans-serif] sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <Link
              href="/teacher/exams"
              className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Back to exams
            </Link>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold tracking-normal text-foreground">{exam.title}</h1>
                <StatusBadge status={exam.status} />
              </div>
              <p className="max-w-3xl text-sm font-medium leading-6 text-muted-foreground">
                {exam.description || "No description provided."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/teacher/exams/${id}/settings`}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-auth-action bg-auth-action px-3 text-sm font-bold text-auth-action-foreground hover:bg-[color-mix(in_oklch,var(--auth-action),var(--foreground)_10%)]"
            >
              <Settings className="size-4" />
              Configure
            </Link>
            <Link
              href={`/teacher/exams/${id}/monitor`}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm font-bold hover:bg-muted"
            >
              <CalendarClock className="size-4" />
              Monitor
            </Link>
          </div>
        </header>

        {locked ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
            This exam is active, concluded, archived, or already past its start time. Critical settings are locked.
          </div>
        ) : null}

        <section className="grid gap-5 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="rounded-md border border-border bg-card p-4 shadow-sm sm:p-5">
            <h2 className="text-base font-bold text-foreground">Configuration Summary</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <SummaryItem label="Class" value={exam.classes?.class_name} />
              <SummaryItem label="Question Source" value={exam.question_bank?.title} />
              <SummaryItem label="Start Time" value={formatDateTime(exam.start_at)} />
              <SummaryItem label="End Time" value={formatDateTime(exam.end_at)} />
              <SummaryItem label="Duration" value={`${exam.duration_minutes} minutes`} />
              <SummaryItem label="Allowed Attempts" value={String(exam.attempt_limit)} />
              <SummaryItem label="Question Count" value={String(exam.question_count)} />
              <SummaryItem label="Result Visibility" value={formatVisibility(exam.result_visibility)} />
              <SummaryItem label="Access Code" value={exam.access_code || "Auto-generated if blank"} />
              <SummaryItem label="Last Updated" value={formatDateTime(exam.updated_at)} />
            </div>
          </div>

          <div className="space-y-5">
            <section className="rounded-md border border-border bg-card p-4 shadow-sm sm:p-5">
              <h2 className="text-base font-bold text-foreground">Behavior</h2>
              <div className="mt-4 space-y-3">
                <BooleanItem label="Randomize Questions" enabled={exam.randomize_questions} />
                <BooleanItem label="Randomize Answers" enabled={exam.randomize_answers} />
              </div>
            </section>

            <section className="rounded-md border border-border bg-card p-4 shadow-sm sm:p-5">
              <h2 className="text-base font-bold text-foreground">Source Details</h2>
              <div className="mt-4 space-y-3 text-sm font-medium text-muted-foreground">
                <p>
                  {exam.question_bank?.subject || "No subject"}
                  {exam.question_bank?.topic ? ` / ${exam.question_bank.topic}` : ""}
                </p>
                <p>
                  Exam questions are configured from the selected teacher question bank and stored as exam
                  question snapshots for the session.
                </p>
              </div>
            </section>
          </div>
        </section>
      </section>
    </main>
  );
}
