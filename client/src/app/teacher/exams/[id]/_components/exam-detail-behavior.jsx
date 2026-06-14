function BooleanItem({ label, enabled }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-background p-3">
      <span className="text-sm font-bold text-foreground">{label}</span>
      <span
        className={`rounded-full border px-2.5 py-1 text-xs font-bold ${
          enabled
            ? "border-auth-action/30 bg-auth-action/10 text-auth-action"
            : "border-border bg-muted text-muted-foreground"
        }`}
      >
        {enabled ? "Enabled" : "Disabled"}
      </span>
    </div>
  );
}

export function ExamDetailBehavior({ exam }) {
  return (
    <section className="rounded-md border border-border bg-card p-4 shadow-sm sm:p-5">
      <h2 className="text-base font-bold text-foreground">Behavior</h2>
      <div className="mt-4 space-y-3">
        <BooleanItem label="Randomize Questions" enabled={exam.randomize_questions} />
        <BooleanItem label="Randomize Answers" enabled={exam.randomize_answers} />
      </div>
    </section>
  );
}
