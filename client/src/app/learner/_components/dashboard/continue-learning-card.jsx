import Link from "next/link";
import { PlayCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DashboardBadge } from "./dashboard-badge";
import { DashboardState } from "./dashboard-state";

function formatDateTime(value) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";

  return date.toLocaleString(undefined, {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  });
}

export function ContinueLearningCard({ item }) {
  return (
    <section className="rounded-md border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">Continue Learning</h2>
          <p className="mt-1 text-sm text-muted-foreground">Return to your latest study set.</p>
        </div>
      </div>

      {!item ? (
        <div className="mt-5">
          <DashboardState
            actionHref="/learner/classes/join"
            actionLabel="Join Class"
            message="No study activity yet."
          />
        </div>
      ) : (
        <article className="mt-5 rounded-md bg-background p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <PlayCircle className="size-5" />
            </span>
            <DashboardBadge status={item.status} />
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">
              {item.sourceLabel}
            </span>
          </div>
          <h3 className="mt-4 line-clamp-2 text-xl font-bold text-foreground">{item.title}</h3>
          <p className="mt-2 text-sm font-medium text-muted-foreground">
            {item.questionCount} questions - {formatDateTime(item.lastStudiedAt)}
          </p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <Button asChild>
              <Link href={item.href}>Continue</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={item.detailsHref}>Details</Link>
            </Button>
          </div>
        </article>
      )}
    </section>
  );
}
