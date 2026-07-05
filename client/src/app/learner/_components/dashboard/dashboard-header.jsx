import Link from "next/link";
import { DoorOpen } from "lucide-react";

import { Button } from "@/components/ui/button";

export function DashboardHeader() {
  return (
    <header className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <h1 className="text-3xl font-bold tracking-normal text-foreground">Dashboard</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Continue current work, open assigned practice, and check exams from one place.
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button asChild>
          <Link href="/learner/classes/join">
            <DoorOpen className="size-4" />
            Join Class
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/learner/progress">View Progress</Link>
        </Button>
      </div>
    </header>
  );
}
