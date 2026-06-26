import Link from "next/link";
import { ArrowLeft, BarChart3, ClipboardList, Settings } from "lucide-react";

import { ExamStatusBadge } from "./exam-status-badge";

export function ExamDetailHeader({ exam, examId }) {
  return (
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
            <ExamStatusBadge status={exam.status} />
          </div>
          <p className="max-w-3xl text-sm font-medium leading-6 text-muted-foreground">
            {exam.description || "No description provided."}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/teacher/exams/${examId}/settings`}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-primary bg-primary px-3 text-sm font-bold text-primary-foreground hover:bg-[color-mix(in_oklch,var(--color-primary),var(--color-foreground)_10%)]"
        >
          <Settings className="size-4" />
          Configure
        </Link>
        <Link
          href={`/teacher/exams/${examId}/statistics`}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm font-bold hover:bg-muted"
        >
          <BarChart3 className="size-4" />
          Statistics
        </Link>
        <Link
          href={`/teacher/exams/${examId}/attempts`}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm font-bold hover:bg-muted"
        >
          <ClipboardList className="size-4" />
          Attempts
        </Link>
      </div>
    </header>
  );
}
