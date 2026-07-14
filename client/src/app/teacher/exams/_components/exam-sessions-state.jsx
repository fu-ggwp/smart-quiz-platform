import Link from "next/link";

import { Button } from "@/components/ui/button";

export function ExamSessionsError() {
  return (
    <section className="rounded-md border border-destructive/30 bg-destructive/10 p-5 text-sm font-semibold text-destructive">
      Unable to load exam sessions. Please refresh and try again.
    </section>
  );
}

export function ExamSessionsLoading() {
  return (
    <section className="rounded-md border border-border bg-card p-8 text-center text-sm font-semibold text-muted-foreground">
      Loading exam sessions...
    </section>
  );
}

export function ExamSessionsEmptyState() {
  return (
    <section className="rounded-md border border-dashed border-border bg-card px-6 py-12 text-center">
      <h2 className="text-lg font-bold text-foreground">No exam sessions yet</h2>
      <p className="mx-auto mt-3 max-w-md text-sm font-medium leading-6 text-muted-foreground">
        You have not created any exam sessions. Create a class and question bank first, then schedule an exam.
      </p>
      <Button
        asChild
        variant="primary"
        className="mt-6 h-11 px-5 text-sm font-bold"
      >
        <Link href="/teacher/exams/create">Create Exam Session</Link>
      </Button>
    </section>
  );
}
