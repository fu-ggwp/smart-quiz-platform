import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function ExamDetailLoading() {
  return (
    <main className="min-h-full bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl rounded-md border border-border bg-card p-6 text-sm font-medium text-muted-foreground shadow-sm">
        Loading exam details...
      </section>
    </main>
  );
}

export function ExamDetailError({ message }) {
  return (
    <main className="min-h-full bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <section className="mx-auto max-w-3xl space-y-4 rounded-md border border-border bg-card p-6 shadow-sm">
        <p className="text-sm font-medium text-destructive">{message}</p>
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
