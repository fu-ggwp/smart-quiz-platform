"use client";

import { ArrowLeft, CheckCircle2, ChevronDown, Circle, XCircle } from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { examsService } from "@/services/exams.service";

function getErrorMessage(error) {
  return error?.response?.data?.error || error?.response?.data?.message || error?.message || "Unable to load exam results.";
}

function formatDateTime(value) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return date.toLocaleString();
}

function optionLabel(index) {
  return String.fromCharCode(65 + index);
}

function ResultSummary({ result }) {
  const score = Number(result.attempt?.total_score || 0);
  const maxScore = Number(result.attempt?.max_score || 0);
  const correctCount = (result.questions ?? []).filter((question) => question.is_correct).length;

  return (
    <aside className="space-y-4">
      <section className="rounded-md border border-border bg-card p-5 shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">Score</p>
        <p className="mt-1 text-2xl font-bold text-foreground">{score}/{maxScore}</p>
      </section>

      <section className="rounded-md border border-border bg-card p-5 shadow-sm">
        <h2 className="text-base font-bold text-foreground">Result details</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Submitted</dt>
            <dd className="text-right font-medium text-foreground">{formatDateTime(result.attempt?.submitted_at)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Correct</dt>
            <dd className="font-medium text-foreground">{correctCount}/{result.questions?.length ?? 0}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Warnings</dt>
            <dd className="font-medium text-foreground">{result.attempt?.warning_count ?? 0}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Class</dt>
            <dd className="text-right font-medium text-foreground">{result.exam?.classes?.class_name || "Class"}</dd>
          </div>
        </dl>
      </section>
    </aside>
  );
}

function QuestionReview({ question, index }) {
  return (
    <article className="rounded-md border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold text-primary">Question {index + 1}</p>
          <h2 className="mt-2 text-base font-bold leading-7 text-foreground">{question.question_text}</h2>
        </div>
        <span className={`inline-flex w-fit items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold ${question.is_correct ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-red-300 bg-red-50 text-red-700"}`}>
          {question.is_correct ? <CheckCircle2 className="size-3.5" /> : <XCircle className="size-3.5" />}
          {question.is_correct ? "Correct" : "Incorrect"}
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {(question.answer_options ?? []).map((option, optionIndex) => (
          <div
            key={`${question.exam_question_id}-${option.index}`}
            className={`flex items-start gap-3 rounded-md border px-3 py-2 text-sm ${
              option.is_correct
                ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                : option.is_selected
                  ? "border-red-300 bg-red-50 text-red-900"
                  : "border-border bg-background text-foreground"
            }`}
          >
            {option.is_correct ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
            ) : option.is_selected ? (
              <XCircle className="mt-0.5 size-4 shrink-0 text-red-600" />
            ) : (
              <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            )}
            <span className="font-bold">{optionLabel(optionIndex)}.</span>
            <span>{option.text}</span>
          </div>
        ))}
      </div>

      {question.explanation ? (
        <details className="group mt-4 rounded-md border border-amber-200 bg-amber-50 text-sm text-amber-900">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 font-bold outline-none transition hover:bg-amber-100/70 [&::-webkit-details-marker]:hidden">
            <span>Explanation</span>
            <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" />
          </summary>
          <div className="border-t border-amber-200 px-3 py-2 leading-6">
            {question.explanation}
          </div>
        </details>
      ) : null}
    </article>
  );
}

export default function ExamResultPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const examId = params?.id;
  const attemptId = searchParams.get("attempt");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(Boolean(attemptId));
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    if (!attemptId) {
      return () => {
        ignore = true;
      };
    }

    examsService
      .getAttemptResults(attemptId)
      .then((data) => {
        if (ignore) return;
        setResult(data);
        setError("");
      })
      .catch((loadError) => {
        if (ignore) return;
        setError(getErrorMessage(loadError));
        setResult(null);
      })
      .finally(() => {
        if (ignore) return;
        setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [attemptId]);

  const title = useMemo(() => result?.exam?.title || "Exam result", [result]);
  const displayError = !attemptId
    ? "Open detailed results from a submitted exam attempt."
    : error;

  if (attemptId && loading) {
    return (
      <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
        <section className="mx-auto max-w-7xl rounded-md border border-border bg-card p-6 text-sm text-muted-foreground">
          Loading detailed results...
        </section>
      </main>
    );
  }

  if (displayError || !result) {
    return (
      <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
        <section className="mx-auto max-w-3xl space-y-4 rounded-md border border-border bg-card p-6 shadow-sm">
          <p className="text-sm font-semibold text-destructive">{displayError || "Detailed results are not available."}</p>
          <Button asChild variant="outline">
            <Link href="/learner/exams?tab=completed">
              <ArrowLeft data-icon="inline-start" />
              Back to exams
            </Link>
          </Button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-muted/40 px-4 py-5 text-foreground sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl space-y-5">
        <header className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
          <Button asChild variant="ghost">
            <Link href="/learner/exams?tab=completed">
              <ArrowLeft data-icon="inline-start" />
              Back to exams
            </Link>
          </Button>
          <div className="text-left sm:text-right">
            <p className="text-sm font-medium text-muted-foreground">Detailed review</p>
            <h1 className="text-2xl font-bold tracking-normal text-foreground">{title}</h1>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[310px_1fr]">
          <ResultSummary result={result} />

          <section className="space-y-4">
            {(result.questions ?? []).map((question, index) => (
              <QuestionReview key={question.exam_question_id} question={question} index={index} />
            ))}
          </section>
        </div>
      </section>
    </main>
  );
}
