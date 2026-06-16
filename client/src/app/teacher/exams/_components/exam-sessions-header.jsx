import { Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function ExamSessionsHeader() {
  return (
    <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-normal text-foreground">Exam Sessions</h1>
        <p className="mt-3 text-sm font-medium text-muted-foreground sm:text-base">
          Teacher views official exam sessions and manages configuration or monitoring.
        </p>
      </div>
      <Button
        asChild
        className="h-11 rounded-md bg-primary px-5 text-sm font-bold text-primary-foreground hover:bg-[color-mix(in_oklch,var(--color-primary),var(--color-foreground)_10%)]"
      >
        <Link href="/teacher/exams/create">
          <Plus className="size-5" aria-hidden="true" />
          Create Exam Session
        </Link>
      </Button>
    </header>
  );
}
