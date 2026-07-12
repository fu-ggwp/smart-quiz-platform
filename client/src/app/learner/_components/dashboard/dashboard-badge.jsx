const STATUS_LABELS = {
  active_now: "Active now",
  upcoming: "Upcoming",
  in_progress: "In progress",
  not_started: "Not started",
  completed: "Completed",
};

const STATUS_TONES = {
  active_now: "bg-success/10 text-success ring-success/30",
  upcoming: "bg-info/10 text-info ring-info/30",
  in_progress: "bg-primary/10 text-primary ring-primary/20",
  not_started: "bg-warning/10 text-warning ring-warning/30",
  completed: "bg-muted text-muted-foreground ring-border",
};

/**
 * Convert backend status keys into learner-facing badge text.
 */
export function statusLabel(status) {
  return STATUS_LABELS[status] || status || "Open";
}

/**
 * Shared dashboard status badge for study sets and exams.
 */
export function DashboardBadge({ status }) {
  const tone = STATUS_TONES[status] || "bg-muted text-muted-foreground ring-border";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${tone}`}>
      {statusLabel(status)}
    </span>
  );
}
