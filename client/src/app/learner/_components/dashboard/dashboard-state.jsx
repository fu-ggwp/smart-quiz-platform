import Link from "next/link";
import { BookOpen, ClipboardList } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Reusable empty/error state row with an optional action button.
 */
export function DashboardState({ actionHref, actionLabel, icon: Icon = ClipboardList, message, tone = "muted" }) {
  const toneClass = tone === "error" ? "border-destructive/40 text-destructive" : "border-border text-muted-foreground";

  return (
    <div className={`flex flex-col gap-3 rounded-md border border-dashed bg-background px-4 py-5 text-sm font-semibold sm:flex-row sm:items-center sm:justify-between ${toneClass}`}>
      <div className="flex min-w-0 items-center gap-2">
        <Icon className="size-4 shrink-0" />
        <p>{message}</p>
      </div>
      {actionHref && actionLabel ? (
        <Button asChild size="sm" variant="outline">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : null}
    </div>
  );
}

/**
 * Full dashboard empty state shown when the learner has no work at all.
 */
export function EmptyDashboard() {
  return (
    <section className="rounded-md border border-dashed border-border bg-card px-4 py-10 text-center shadow-sm">
      <BookOpen className="mx-auto size-10 text-muted-foreground" />
      <h2 className="mt-4 text-lg font-bold text-foreground">No learning work yet</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Join a class to receive teacher-assigned study sets and exams.
      </p>
      <Button asChild className="mt-5">
        <Link href="/learner/classes/join">Join Class</Link>
      </Button>
    </section>
  );
}

/**
 * Skeleton layout that matches the learner dashboard card structure.
 */
export function LoadingDashboard() {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.75fr)]">
        <div className="space-y-5">
          <Skeleton className="h-52 rounded-md border border-border" />
          <Skeleton className="h-80 rounded-md border border-border" />
        </div>
        <div className="space-y-5">
          <Skeleton className="h-64 rounded-md border border-border" />
          <Skeleton className="h-64 rounded-md border border-border" />
        </div>
      </div>
    </div>
  );
}
