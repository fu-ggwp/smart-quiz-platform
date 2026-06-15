"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { examsService } from "@/services/exams.service";

function visibilityLabel(value) {
  if (value === "completion_only") return "Visible after submit";
  if (value === "score_only") return "Score only";
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

export default function LearnerExamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params?.id;
  const [exam, setExam] = useState(null);
  const [accessCode, setAccessCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError("");

    examsService
      .getLearnerExam(examId)
      .then((data) => {
        if (ignore) return;
        setExam(data);
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

  const canStart = useMemo(() => {
    if (!exam) return false;
    if (exam.status !== "active") return false;
    if (exam.attempts_remaining <= 0) return false;
    if (exam.access_code && accessCode.trim().toUpperCase() !== exam.access_code.toUpperCase()) return false;
    return true;
  }, [accessCode, exam]);

  if (loading) {
    return (
      <main className="min-h-screen bg-background px-4 py-5 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-5xl rounded-md border border-border bg-card p-6 text-sm text-muted-foreground">
          Loading exam information...
        </section>
      </main>
    );
  }

  if (error || !exam) {
    return (
      <main className="min-h-screen bg-background px-4 py-5 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-5xl space-y-4 rounded-md border border-border bg-card p-6">
          <p className="text-sm font-medium text-red-600">{error || "Exam not found."}</p>
          <Button asChild variant="outline"><Link href="/learner/exams">Back to exams</Link></Button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-5 text-foreground sm:px-6 lg:px-8">
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

          {!canStart ? (
            <p className="mt-4 text-sm font-medium text-muted-foreground">
              Confirm is enabled when attempts remain and the access code is correct.
            </p>
          ) : null}

          <div className="mt-6 flex justify-center gap-3">
            <Button disabled={!canStart} onClick={() => router.push(`/learner/exams/${exam.exam_session_id}/take`)}>
              Confirm
            </Button>
            <Button asChild variant="outline"><Link href="/learner/exams">Cancel</Link></Button>
          </div>
        </section>
      </section>
    </main>
  );
}
