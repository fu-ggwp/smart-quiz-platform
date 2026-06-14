"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, RotateCcw, Save } from "lucide-react";

import { examsService } from "@/services/exams.service";

import {
  RESULT_VISIBILITY_OPTIONS,
  formatDateTime,
  formatVisibility,
  getStatusClassName,
  getStatusLabel,
} from "../../_components/exam-session-options";

const lockedStatuses = new Set(["active", "closed", "archived"]);

function toDateTimeLocal(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function toIsoDateTime(value) {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function buildForm(exam) {
  return {
    title: exam?.title ?? "",
    description: exam?.description ?? "",
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

function getErrorMessage(error) {
  return (
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.message ||
    "Failed to load data. Please check your connection and try again."
  );
}

function FieldError({ message }) {
  if (!message) return null;
  return <p className="text-xs font-medium text-destructive">{message}</p>;
}

function TextField({ label, name, value, onChange, error, disabled, type = "text", min }) {
  return (
    <label className="space-y-2 text-sm font-bold text-foreground">
      <span>{label}</span>
      <input
        name={name}
        type={type}
        min={min}
        value={value}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(name, event.target.value)}
        className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground outline-none transition focus:border-auth-action focus:ring-2 focus:ring-auth-action/20 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20"
      />
      <FieldError message={error} />
    </label>
  );
}

function ReadOnlyField({ label, value }) {
  return (
    <div className="space-y-2 text-sm font-bold text-foreground">
      <span>{label}</span>
      <div className="flex h-10 items-center rounded-md border border-border bg-muted px-3 text-sm font-medium text-muted-foreground">
        <span className="truncate">{value || "Not set"}</span>
      </div>
    </div>
  );
}

function ToggleRow({ label, name, checked, onChange, disabled }) {
  return (
    <label className="flex h-12 items-center gap-3 rounded-md border border-border bg-background px-3 text-sm font-bold text-foreground">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(name, event.target.checked)}
        className="size-4 accent-auth-action disabled:cursor-not-allowed"
      />
      <span>{label}</span>
    </label>
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

export default function ExamSettingsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [exam, setExam] = useState(null);
  const [form, setForm] = useState(buildForm(null));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState("");

  const locked = useMemo(() => isExamLocked(exam), [exam]);

  useEffect(() => {
    let ignore = false;

    examsService
      .getOne(id)
      .then((data) => {
        if (ignore) return;
        setExam(data);
        setForm(buildForm(data));
        setFieldErrors({});
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

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
    setSuccess("");
  }

  function validateForm() {
    const errors = {};
    const duration = Number(form.duration_minutes);
    const attempts = Number(form.attempt_limit);
    const questionCount = Number(form.question_count);
    const startAt = toIsoDateTime(form.start_at);
    const endAt = toIsoDateTime(form.end_at);

    if (!form.title.trim()) errors.title = "Please complete all required information.";
    if (!Number.isInteger(duration) || duration <= 0) {
      errors.duration_minutes = "Duration must be greater than zero.";
    }
    if (!Number.isInteger(attempts) || attempts <= 0) {
      errors.attempt_limit = "Allowed attempts must be greater than zero.";
    }
    if (!Number.isInteger(questionCount) || questionCount <= 0) {
      errors.question_count = "Question count must be greater than zero.";
    }
    if (startAt && endAt && new Date(endAt).getTime() <= new Date(startAt).getTime()) {
      errors.start_at = "End time must be later than start time.";
      errors.end_at = "End time must be later than start time.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (locked || !validateForm()) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await examsService.updateSettings(id, {
        title: form.title,
        description: form.description,
        start_at: toIsoDateTime(form.start_at),
        end_at: toIsoDateTime(form.end_at),
        duration_minutes: Number(form.duration_minutes),
        attempt_limit: Number(form.attempt_limit),
        question_count: Number(form.question_count),
        randomize_questions: form.randomize_questions,
        randomize_answers: form.randomize_answers,
        result_visibility: form.result_visibility,
        access_code: form.access_code,
      });

      const updatedExam = response?.data?.exam;
      setExam(updatedExam);
      setForm(buildForm(updatedExam));
      setSuccess(response?.data?.message || "Exam settings have been updated successfully.");
      setFieldErrors({});
    } catch (saveError) {
      setError(getErrorMessage(saveError));
      setFieldErrors(saveError?.response?.data?.fields || {});
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
        <section className="mx-auto max-w-7xl rounded-md border border-border bg-card p-6 text-sm font-medium text-muted-foreground shadow-sm">
          Loading exam settings...
        </section>
      </main>
    );
  }

  if (error && !exam) {
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
        <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-normal text-foreground">Configure Exam Settings</h1>
            <p className="max-w-3xl text-sm font-medium leading-6 text-muted-foreground">
              Configure exam time, attempts, question count, randomization, and result visibility.
            </p>
          </div>
          <Link
            href={`/teacher/exams/${id}`}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm font-bold hover:bg-muted"
          >
            <ArrowLeft className="size-4" />
            Back to exam
          </Link>
        </header>

        {locked ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
            You do not have permission to access or perform this action.
          </div>
        ) : null}

        {error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-md border border-auth-action/30 bg-auth-action/10 px-4 py-3 text-sm font-bold text-auth-action">
            {success}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-5">
          <section className="rounded-md border border-border bg-card p-4 shadow-sm sm:p-5">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-bold text-foreground">Exam Session</h2>
                <p className="mt-1 text-sm font-medium text-muted-foreground">
                  Current status: <StatusBadge status={exam.status} />
                </p>
              </div>
              <div className="text-sm font-medium text-muted-foreground">
                Last updated {formatDateTime(exam.updated_at)}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="Exam Title"
                name="title"
                value={form.title}
                disabled={locked || saving}
                error={fieldErrors.title}
                onChange={updateField}
              />
              <ReadOnlyField label="Class" value={exam.classes?.class_name} />
              <ReadOnlyField label="Question Source" value={exam.question_bank?.title} />
              <ReadOnlyField label="Status" value={getStatusLabel(exam.status)} />
              <TextField
                label="Start Time"
                name="start_at"
                type="datetime-local"
                value={form.start_at}
                disabled={locked || saving}
                error={fieldErrors.start_at}
                onChange={updateField}
              />
              <TextField
                label="End Time"
                name="end_at"
                type="datetime-local"
                value={form.end_at}
                disabled={locked || saving}
                error={fieldErrors.end_at}
                onChange={updateField}
              />
              <TextField
                label="Duration Minutes"
                name="duration_minutes"
                type="number"
                min="1"
                value={form.duration_minutes}
                disabled={locked || saving}
                error={fieldErrors.duration_minutes}
                onChange={updateField}
              />
              <TextField
                label="Allowed Attempts"
                name="attempt_limit"
                type="number"
                min="1"
                value={form.attempt_limit}
                disabled={locked || saving}
                error={fieldErrors.attempt_limit}
                onChange={updateField}
              />
              <TextField
                label="Question Count"
                name="question_count"
                type="number"
                min="1"
                value={form.question_count}
                disabled={locked || saving}
                error={fieldErrors.question_count}
                onChange={updateField}
              />
              <label className="space-y-2 text-sm font-bold text-foreground">
                <span>Result Visibility</span>
                <select
                  value={form.result_visibility}
                  disabled={locked || saving}
                  aria-invalid={Boolean(fieldErrors.result_visibility)}
                  onChange={(event) => updateField("result_visibility", event.target.value)}
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground outline-none transition focus:border-auth-action focus:ring-2 focus:ring-auth-action/20 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20"
                >
                  {RESULT_VISIBILITY_OPTIONS.filter((option) => option.value).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <FieldError message={fieldErrors.result_visibility} />
              </label>
              <TextField
                label="Exam Access Code"
                name="access_code"
                value={form.access_code}
                disabled={locked || saving}
                error={fieldErrors.access_code}
                onChange={updateField}
              />
              <ReadOnlyField label="Current Visibility" value={formatVisibility(exam.result_visibility)} />
            </div>

            <label className="mt-4 block space-y-2 text-sm font-bold text-foreground">
              <span>Description</span>
              <textarea
                value={form.description}
                disabled={locked || saving}
                onChange={(event) => updateField("description", event.target.value)}
                className="min-h-24 w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground outline-none transition placeholder:text-muted-foreground focus:border-auth-action focus:ring-2 focus:ring-auth-action/20 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                placeholder="Optional notes for this exam session"
              />
            </label>
          </section>

          <section className="rounded-md border border-border bg-card p-4 shadow-sm sm:p-5">
            <div className="grid gap-3 md:grid-cols-2">
              <ToggleRow
                label="Randomize Questions"
                name="randomize_questions"
                checked={form.randomize_questions}
                disabled={locked || saving}
                onChange={updateField}
              />
              <ToggleRow
                label="Randomize Answers"
                name="randomize_answers"
                checked={form.randomize_answers}
                disabled={locked || saving}
                onChange={updateField}
              />
            </div>
          </section>

          <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={saving}
              onClick={() => router.push(`/teacher/exams/${id}`)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-bold hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
            >
              <RotateCcw className="size-4" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={locked || saving}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-auth-action bg-auth-action px-4 text-sm font-bold text-auth-action-foreground hover:bg-[color-mix(in_oklch,var(--auth-action),var(--foreground)_10%)] disabled:pointer-events-none disabled:opacity-50"
            >
              <Save className="size-4" />
              {saving ? "Saving..." : "Save Exam Settings"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
