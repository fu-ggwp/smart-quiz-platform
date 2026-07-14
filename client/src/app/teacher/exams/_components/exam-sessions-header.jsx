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
        variant="primary"
        className="h-11 px-5 text-sm font-bold"
      >
        <Link href="/teacher/exams/create">
          <Plus data-icon="inline-start" aria-hidden="true" />
          Create Exam Session
        </Link>
      </Button>
    </header>
  );
}
