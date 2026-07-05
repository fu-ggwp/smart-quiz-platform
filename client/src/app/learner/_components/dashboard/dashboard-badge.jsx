const STATUS_LABELS = {
  active_now: "Active now",
  upcoming: "Upcoming",
  in_progress: "In progress",
  not_started: "Not started",
  completed: "Completed",
};

const STATUS_TONES = {
  active_now: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  upcoming: "bg-blue-50 text-blue-700 ring-blue-200",
  in_progress: "bg-primary/10 text-primary ring-primary/20",
  not_started: "bg-amber-50 text-amber-700 ring-amber-200",
  completed: "bg-muted text-muted-foreground ring-border",
};

export function statusLabel(status) {
  return STATUS_LABELS[status] || status || "Open";
}

export function DashboardBadge({ status }) {
  const tone = STATUS_TONES[status] || "bg-muted text-muted-foreground ring-border";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${tone}`}>
      {statusLabel(status)}
    </span>
  );
}
