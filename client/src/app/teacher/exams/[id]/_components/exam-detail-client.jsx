"use client";

import { useMemo } from "react";

import { ExamDetailError, ExamDetailLoading } from "./exam-detail-state";
import { ExamDetailHeader } from "./exam-detail-header";
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
    <main className="min-h-full bg-background px-4 py-5 font-sans text-foreground [font-family:var(--font-geist-sans),Arial,sans-serif] sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl space-y-6">
        <ExamDetailHeader exam={exam} examId={examId} />

        {locked ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
            Active exam sessions cannot be configured after their start time. Closed and archived exams are also locked.
          </div>
        ) : null}

        <ExamDetailSummary exam={exam} />
      </section>
    </main>
  );
}
