import Link from "next/link";
import { CalendarClock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { HomeBadge } from "./home-badge";
import { HomeState } from "./home-state";

/**
 * Format exam start time for compact home page cards.
 */
function formatDateTime(value) {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not scheduled";

  return date.toLocaleString(undefined, {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  });
}

/**
 * Shows active/upcoming exams from the learner home page payload.
 */
export function UpcomingExamsPanel({ items }) {
  return (
    <section className="rounded-md border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">Exams</h2>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href="/learner/exams">View exams</Link>
        </Button>
      </div>

      {/* Exam Cards */}
      {items.length === 0 ? (
        <div className="mt-5">
          <HomeState message="No other active exams right now." />
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {items.map((exam) => (
            <article className="rounded-md border border-border bg-background p-4" key={exam.examSessionId}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <HomeBadge status={exam.status} />
                  <h3 className="mt-3 truncate text-base font-bold text-foreground">{exam.title}</h3>
                  <p className="mt-1 truncate text-sm text-muted-foreground">{exam.className}</p>
                </div>
                <CalendarClock className="size-5 shrink-0 text-muted-foreground" />
              </div>
              <dl className="mt-3 space-y-1 text-sm font-medium text-muted-foreground">
                <div className="flex items-center justify-between gap-3">
                  <dt>Start at</dt>
                  <dd className="text-right text-foreground">{formatDateTime(exam.startAt)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt>End at</dt>
                  <dd className="text-right text-foreground">{formatDateTime(exam.endAt)}</dd>
                </div>
                {exam.durationMinutes ? (
                  <div className="flex items-center justify-between gap-3">
                    <dt>Duration</dt>
                    <dd className="text-right text-foreground">{exam.durationMinutes} minutes</dd>
                  </div>
                ) : null}
              </dl>
              <Button asChild className="mt-4 w-full" size="sm" variant="outline">
                <Link href={exam.href}>Open</Link>
              </Button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
