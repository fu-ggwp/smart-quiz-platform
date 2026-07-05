import Link from "next/link";
import { Building2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DashboardState } from "./dashboard-state";

export function ClassesPanel({ items }) {
  return (
    <section className="rounded-md border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">My Classes</h2>
          <p className="mt-1 text-sm text-muted-foreground">Classes you are enrolled in.</p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href="/learner/classes">View classes</Link>
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="mt-5">
          <DashboardState actionHref="/learner/classes/join" actionLabel="Join Class" message="No joined classes yet." />
        </div>
      ) : (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {items.map((classItem) => (
            <article className="grid gap-3 rounded-md border border-border bg-background p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center" key={classItem.classId}>
              <span className="inline-flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Building2 className="size-5" />
              </span>
              <div className="min-w-0">
                <h3 className="truncate text-base font-bold text-foreground">{classItem.className}</h3>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {classItem.teacherName}{classItem.gradeLevel ? ` - ${classItem.gradeLevel}` : ""}
                </p>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href={classItem.href}>Open</Link>
              </Button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
