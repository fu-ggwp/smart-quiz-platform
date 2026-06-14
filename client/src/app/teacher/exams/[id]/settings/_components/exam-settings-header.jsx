import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function ExamSettingsHeader({ examId }) {
  return (
    <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-normal text-foreground">Configure Exam Settings</h1>
        <p className="max-w-3xl text-sm font-medium leading-6 text-muted-foreground">
          Configure exam time, attempts, question count, randomization, and result visibility.
        </p>
      </div>
      <Link
        href={`/teacher/exams/${examId}`}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm font-bold hover:bg-muted"
      >
        <ArrowLeft className="size-4" />
        Back to exam
      </Link>
    </header>
  );
}
