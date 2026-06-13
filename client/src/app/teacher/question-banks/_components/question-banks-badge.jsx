export function QuestionBanksBadge({ children, tone }) {
  const toneClass =
    tone === "green"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
      : tone === "amber"
        ? "bg-amber-50 text-amber-700 ring-amber-100"
        : tone === "red"
          ? "bg-rose-50 text-rose-700 ring-rose-100"
          : "bg-muted text-muted-foreground ring-border";

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${toneClass}`}>{children}</span>;
}
