import Link from "next/link";

import { Button } from "@/components/ui/button";
import { DashboardBadge } from "./dashboard-badge";
import { DashboardState } from "./dashboard-state";

/**
 * Shows teacher-assigned practice, already sorted and limited by the backend.
 */
export function AssignedStudySetsPanel({ items }) {
  return (
    <section className="rounded-md border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">Assigned Practice</h2>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href="/learner/study-sets">View all</Link>
        </Button>
      </div>

      {/* Assigned Study Set Cards */}
      {items.length === 0 ? (
        <div className="mt-5">
          <DashboardState
            actionHref="/learner/classes/join"
            actionLabel="Join Class"
            message="No assigned practice yet."
          />
        </div>
      ) : (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {items.map((studySet) => (
            <article className="rounded-md border border-border bg-background p-4" key={studySet.studySetId}>
              <div className="flex flex-wrap items-center gap-2">
                <DashboardBadge status={studySet.status} />
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">
                  {studySet.className}
                </span>
              </div>
              <h3 className="mt-3 line-clamp-2 text-base font-bold text-foreground">{studySet.title}</h3>
              <p className="mt-1 truncate text-sm text-muted-foreground">{studySet.subject || "General"}</p>
              <p className="mt-3 text-sm font-semibold text-muted-foreground">{studySet.questionCount} questions</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <Button asChild size="sm" variant={studySet.status === "completed" ? "outline" : "default"}>
                  <Link href={studySet.practiceHref}>{studySet.status === "not_started" ? "Start" : "Continue"}</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href={studySet.href}>Open</Link>
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
