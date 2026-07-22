import { Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function ExamSessionsHeader() {
  return (
    <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-normal text-foreground">Exam Sessions</h1>
      </div>
      <Button asChild>
        <Link href="/teacher/exams/create">
          <Plus data-icon="inline-start" aria-hidden="true" />
          Create Exam Session
        </Link>
      </Button>
    </header>
  );
}
