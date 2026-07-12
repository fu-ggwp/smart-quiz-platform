import { ClipboardList, Eye, AlertTriangle, CheckCircle2, Hourglass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { learnerName, formatScore, formatDateTime, formatDuration } from "./attempt-helpers";

function statusConfig(status) {
  if (status === "submitted") {
    return {
      label: "Submitted",
      className: "border-success/30 bg-success/10 text-success",
      icon: CheckCircle2,
    };
  }

  return {
    label: "In progress",
    className: "border-warning/30 bg-warning/10 text-warning",
    icon: Hourglass,
  };
}

function StatusBadge({ status }) {
  if (!status) return <span className="text-sm font-bold text-muted-foreground">-</span>;
  const config = statusConfig(status);
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${config.className}`}>
      <Icon className="size-3.5" />
      {config.label}
    </span>
  );
}

function WarningBadge({ count }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">
      <AlertTriangle className="size-3.5" />
      {count || 0}
    </span>
  );
}

export function ResultTable({ rows = [], totalLearners = 0, onViewResult }) {
  if (!rows.length) {
    return (
      <section className="rounded-md border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-3 grid size-10 place-items-center rounded-md bg-muted text-muted-foreground">
          <ClipboardList className="size-5" />
        </div>
        <h2 className="text-base font-bold text-foreground">No results found</h2>
        <p className="mt-2 text-sm font-medium text-muted-foreground">
          Try changing the search, score mode, status, or sort filters.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold uppercase tracking-normal text-foreground">Result List</h2>
        <p className="text-sm font-bold text-muted-foreground">{rows.length} of {totalLearners} learners shown</p>
      </div>

      <section className="overflow-hidden rounded-md border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] table-fixed border-collapse text-left text-sm">
            <thead className="bg-muted text-xs font-bold uppercase text-muted-foreground">
              <tr>
                <th className="w-[240px] whitespace-nowrap px-3 py-3">Learner</th>
                <th className="w-[90px] whitespace-nowrap px-3 py-3">Score</th>
                <th className="w-[120px] whitespace-nowrap px-3 py-3">Attempt used</th>
                <th className="w-[130px] whitespace-nowrap px-3 py-3">Status</th>
                <th className="w-[130px] whitespace-nowrap px-3 py-3">Submitted</th>
                <th className="w-[95px] whitespace-nowrap px-3 py-3">Time</th>
                <th className="w-[95px] whitespace-nowrap px-3 py-3">Warnings</th>
                <th className="w-[120px] whitespace-nowrap px-3 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => {
                const attempt = row.selectedAttempt;
                return (
                  <tr key={row.learner_id} className="align-middle transition hover:bg-muted/40">
                    <td className="px-3 py-4">
                      <div className="truncate font-bold text-foreground">{learnerName(row.learner)}</div>
                      <div className="mt-1 truncate text-xs font-medium text-muted-foreground">{row.learner?.email || "No email"}</div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 font-bold text-foreground">{formatScore(attempt)}</td>
                    <td className="whitespace-nowrap px-3 py-4 font-medium text-muted-foreground">
                      {attempt ? `Attempt #${attempt.attempt_number}` : "-"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4">
                      <StatusBadge status={attempt?.status} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 font-medium text-muted-foreground">{formatDateTime(attempt?.submitted_at)}</td>
                    <td className="whitespace-nowrap px-3 py-4 font-medium text-muted-foreground">{formatDuration(attempt?.duration_seconds)}</td>
                    <td className="whitespace-nowrap px-3 py-4">
                      <WarningBadge count={attempt?.warning_count ?? 0} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-4">
                      {attempt ? (
                        <Button className="px-2" size="sm" onClick={() => onViewResult(row, attempt)}>
                          <Eye data-icon="inline-start" />
                          View result
                        </Button>
                      ) : (
                        <span className="text-xs font-bold text-muted-foreground">No attempt</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
