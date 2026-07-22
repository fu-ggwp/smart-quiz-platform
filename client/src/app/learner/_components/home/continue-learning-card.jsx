import Link from "next/link";
import { PlayCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { HomeState } from "./home-state";

/**
 * Format the last-study timestamp for the continue-learning card.
 */
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

/**
 * Highlights the most recently studied set, or shows a join-class call to action.
 */
export function ContinueLearningCard({ item }) {
  return (
    <section className="rounded-md border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">Recent Learning</h2>
        </div>
      </div>

      {/* Empty State or Latest Study Set */}
      {!item ? (
        <div className="mt-2">
          <HomeState
            actionHref="/learner/classes/join"
            actionLabel="Join Class"
            message="No study activity yet."
          />
        </div>
      ) : (
        <article className="mt-2 rounded-md bg-background p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <PlayCircle className="size-5" />
            </span>
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">
              {item.sourceLabel}
            </span>
          </div>
          <h3 className="mt-4 line-clamp-2 text-xl font-bold text-foreground">{item.title}</h3>
          <p className="mt-2 text-sm font-medium text-muted-foreground">
            {item.questionCount} questions - {formatDateTime(item.lastStudiedAt)}
          </p>
          <div className="mt-5">
            <Button asChild>
              <Link className="w-full" href={item.detailsHref}>Study</Link>
            </Button>
          </div>
        </article>
      )}
    </section>
  );
}
