import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

export function QuestionBanksHeader() {
  return (
    <div className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Question Banks</h1>
        <p className="mt-2 text-sm text-muted-foreground">Manage teacher-owned repositories for study sets and exams.</p>
      </div>

      <Button asChild>
        <Link href="/teacher/question-banks/create">
          <Plus className="size-4" />
          Create Question Bank
        </Link>
      </Button>
    </div>
  );
}
