"use client";

import { useMemo } from "react";

import { ExamDetailBehavior } from "./exam-detail-behavior";
import { ExamDetailError, ExamDetailLoading } from "./exam-detail-state";
import { ExamDetailHeader } from "./exam-detail-header";
import { ExamDetailSource } from "./exam-detail-source";
import { ExamDetailSummary } from "./exam-detail-summary";
import { isExamLocked } from "./exam-detail-utils";
import { useExamDetail } from "./use-exam-detail";

export function ExamDetailClient({ examId }) {
  const { exam, loading, error } = useExamDetail(examId);
  const locked = useMemo(() => isExamLocked(exam), [exam]);

  if (loading) {
    return <ExamDetailLoading />;
  }

  if (error) {
    return <ExamDetailError message={error} />;
  }

  return (
    <main className="min-h-screen bg-background px-4 py-5 font-sans text-foreground [font-family:var(--font-geist-sans),Arial,sans-serif] sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl space-y-6">
        <ExamDetailHeader exam={exam} examId={examId} />

        {locked ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
            This exam is archived, concluded, or already past its start time. Critical settings are locked.
          </div>
        ) : null}

        <section className="grid gap-5 lg:grid-cols-[1.4fr_0.9fr]">
          <ExamDetailSummary exam={exam} />

          <div className="space-y-5">
            <ExamDetailBehavior exam={exam} />
            <ExamDetailSource exam={exam} />
          </div>
        </section>
      </section>
    </main>
  );
}
