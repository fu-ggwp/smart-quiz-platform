"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { examsService } from "@/services/exams.service";

function visibilityLabel(value) {
  if (value === "completion_only") return "Visible after submit";
  if (value === "score_only") return "Score only";
  if (value === "question_answer") return "Score and question answers";
  return "Not set";
}

function DetailField({ label, value }) {
  return (
    <label className="space-y-2 text-sm font-bold text-foreground">
      <span>{label}</span>
      <input
        value={value || "-"}
        readOnly
        className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm font-medium text-muted-foreground outline-none"
      />
    </label>
  );
}

function getErrorMessage(error) {
  return error?.response?.data?.error || error?.message || "Unable to load exam information.";
}

function formatExamTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
}

export default function LearnerExamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params?.id;
  const [exam, setExam] = useState(null);
  const [accessCode, setAccessCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let ignore = false;

    async function loadExam() {
      try {
        const data = await examsService.getLearnerExam(examId);
        if (ignore) return;
        setExam(data);
        setError("");
      } catch (loadError) {
        if (ignore) return;
        setExam(null);
        setError(getErrorMessage(loadError));
      } finally {
        if (ignore) return;
        setLoading(false);
      }
    }

    loadExam();

    return () => {
      ignore = true;
    };
  }, [examId]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(interval);
  }, []);

  const availabilityNotice = useMemo(() => {
    if (!exam) return "";

    const startTime = exam.start_at ? new Date(exam.start_at).getTime() : null;
    const endTime = exam.end_at ? new Date(exam.end_at).getTime() : null;
    const enteredCode = accessCode.trim().toUpperCase();
    const requiredCode = exam.access_code?.toUpperCase();

    if (exam.status !== "active") {
      return "This exam session is not active yet. Please wait for your teacher to publish it.";
    }

    if (Number.isFinite(startTime) && startTime > now) {
      const startLabel = formatExamTime(exam.start_at);
      return startLabel
        ? `This exam session has not started yet. It starts at ${startLabel}.`
        : "This exam session has not started yet.";
    }

    if (Number.isFinite(endTime) && endTime < now) {
      return "This exam session has already ended.";
    }

    if (exam.attempts_remaining <= 0) {
      return "You have no attempts remaining for this exam.";
    }

    if (requiredCode && enteredCode && enteredCode !== requiredCode) {
      return "The exam access code is incorrect. Please check the code and try again.";
    }

    if (requiredCode && !enteredCode) {
      return "Enter the exam access code to enable Confirm.";
    }

    return "";
  }, [accessCode, exam, now]);

  const canStart = useMemo(() => {
    if (!exam) return false;
    return !availabilityNotice;
  }, [availabilityNotice, exam]);

  if (loading) {
    return (
      <main className="min-h-full bg-background px-4 py-5 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-5xl rounded-md border border-border bg-card p-6 text-sm text-muted-foreground">
          Loading exam information...
        </section>
      </main>
    );
  }

  if (error || !exam) {
    return (
      <main className="min-h-full bg-background px-4 py-5 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-5xl space-y-4 rounded-md border border-border bg-card p-6">
          <p className="text-sm font-medium text-error">{error || "Exam not found."}</p>
          <Button asChild variant="outline"><Link href="/learner/exams">Back to exams</Link></Button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-full bg-background px-4 py-5 text-foreground sm:px-6 lg:px-8">
      <section className="mx-auto max-w-3xl space-y-6">
        <div className="border-b border-border pb-5 text-center">
          <h1 className="text-xl font-bold tracking-normal">{exam.title}</h1>
        </div>

        <section className="rounded-md border border-border bg-card p-6 shadow-sm">
          <div className="space-y-4">
            <DetailField label="Duration" value={`${exam.duration_minutes} minutes`} />
            <DetailField label="Allowed Attempts" value={String(exam.attempt_limit)} />
            <DetailField label="Question Count" value={String(exam.question_count)} />
            <DetailField label="Result Visibility" value={visibilityLabel(exam.result_visibility)} />
            <label className="space-y-2 text-sm font-bold text-foreground">
              <span>Exam Access Code</span>
              <input
                value={accessCode}
                onChange={(event) => setAccessCode(event.target.value)}
                placeholder="Enter access code"
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm font-medium outline-none"
              />
            </label>
          </div>

          {availabilityNotice ? (
            <div className="mt-4 flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm font-medium text-warning">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <p>{availabilityNotice}</p>
            </div>
          ) : null}

          <div className="mt-6 flex justify-center gap-3">
            <Button
              disabled={!canStart}
              onClick={() => router.push(`/learner/exams/${exam.exam_session_id}/take?code=${encodeURIComponent(accessCode.trim())}`)}
            >
              Confirm
            </Button>
            <Button asChild variant="outline"><Link href="/learner/exams">Cancel</Link></Button>
          </div>
        </section>
      </section>
    </main>
  );
}
