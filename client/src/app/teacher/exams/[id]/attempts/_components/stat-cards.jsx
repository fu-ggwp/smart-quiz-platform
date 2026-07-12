import { Users, CheckCircle2, Hourglass, UserCheck } from "lucide-react";

function StatCard({ icon: Icon, label, value, tone = "blue" }) {
  const tones = {
    blue: "bg-info/10 text-info",
    green: "bg-success/10 text-success",
    amber: "bg-warning/10 text-warning",
    rose: "bg-error/10 text-error",
  };

  return (
    <section className="rounded-md border border-border bg-card p-3 shadow-sm">
      <div className="flex items-center gap-2">
        <span className={`grid size-8 shrink-0 place-items-center rounded-md ${tones[tone] ?? tones.blue}`}>
          <Icon className="size-4" />
        </span>
        <p className="min-w-0 text-sm font-semibold text-muted-foreground">{label}</p>
      </div>
      <p className="mt-3 truncate text-2xl font-bold text-foreground">{value}</p>
    </section>
  );
}

export function AttemptStats({ summary = {} }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={Users}
        label="Total attempts"
        value={summary.totalAttempts ?? 0}
      />
      <StatCard
        icon={CheckCircle2}
        label="Submitted attempts"
        value={summary.submittedCount ?? 0}
        tone="green"
      />
      <StatCard
        icon={Hourglass}
        label="In progress attempts"
        value={summary.inProgressCount ?? 0}
        tone="amber"
      />
      <StatCard
        icon={UserCheck}
        label="Participants"
        value={`${summary.uniqueLearners ?? 0}/${summary.classLearnersCount ?? 0}`}
        tone="rose"
      />
    </div>
  );
}
