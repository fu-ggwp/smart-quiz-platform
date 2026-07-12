/**
 * Small status pill shared by list and detail pages.
 */
export function QuestionBanksBadge({ children, tone }) {
  const toneClass =
    tone === "green"
      ? "bg-success/10 text-success ring-success/20"
      : tone === "amber"
        ? "bg-warning/10 text-warning ring-warning/20"
        : tone === "red"
          ? "bg-error/10 text-error ring-error/20"
          : "bg-muted text-muted-foreground ring-border";

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${toneClass}`}>{children}</span>;
}

/**
 * Format backend timestamps for compact table metadata.
 */
export function formatDate(value) {
  if (!value) return "Not updated";
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

/**
 * Normalize backend status text for display.
 */
export function formatBankStatus(value) {
  if (!value) return "None";
  return value.charAt(0).toUpperCase() + value.slice(1).replaceAll("_", " ");
}

/**
 * Map bank status to badge tone names used by QuestionBanksBadge.
 */
export function getStatusTone(value) {
  if (value === "Ready") return "green";
  if (value === "Deleted") return "red";
  return "neutral";
}
