import { ArrowLeft, ClipboardList, CheckCircle2, Hourglass, AlertTriangle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  learnerName,
  formatScore,
  statusLabel,
  formatDuration,
  formatDateTime,
  attemptSelectLabel,
  optionLabels,
} from "./attempt-helpers";

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

export function AttemptDetailView({
  data,
  detail,
  onBack,
  onSelectAttempt,
  selectedAttemptId,
  scoreMode,
}) {
  const selectedAttempt = detail?.attempt;
  const learnerAttempts = detail?.learnerRow?.attempts ?? [];
  const loading = detail?.loading;
  const error = detail?.error;
  const result = detail?.result;

  return (
    <main className="min-h-full bg-muted/40 px-4 py-5 text-foreground sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-normal text-foreground">
              {learnerName(detail?.learnerRow?.learner)}
            </h1>
            <p className="mt-2 text-sm font-medium text-muted-foreground">
              Email: {detail?.learnerRow?.learner?.email || "No email"}
            </p>
          </div>
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft data-icon="inline-start" />
            Back to scoreboard
          </Button>
        </header>

        <section className="rounded-md border border-border bg-card p-4 shadow-sm">
          <select
            aria-label="Select attempt"
            className="h-10 w-full max-w-md rounded-md border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
            onChange={(event) => onSelectAttempt(event.target.value)}
            value={selectedAttemptId || ""}
          >
            {learnerAttempts.map((attempt) => (
              <option key={attempt.exam_attempt_id} value={attempt.exam_attempt_id}>
                {attemptSelectLabel(attempt, scoreMode, learnerAttempts)}
              </option>
            ))}
          </select>
        </section>

        {loading ? (
          <section className="rounded-md border border-border bg-card p-6 text-sm font-medium text-muted-foreground shadow-sm">
            Loading result detail...
          </section>
        ) : null}

        {error ? (
          <section className="rounded-md border border-border bg-card p-6 text-sm font-semibold text-destructive shadow-sm">
            {error}
          </section>
        ) : null}

        {!loading && !error ? (
          <>
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <StatCard icon={ClipboardList} label="Score" value={formatScore(selectedAttempt)} />
              <StatCard icon={ClipboardList} label="Attempt" value={selectedAttempt ? `#${selectedAttempt.attempt_number}` : "-"} />
              <StatCard
                icon={selectedAttempt?.status === "submitted" ? CheckCircle2 : Hourglass}
                label="Status"
                value={selectedAttempt ? statusLabel(selectedAttempt.status) : "-"}
                tone={selectedAttempt?.status === "submitted" ? "green" : "amber"}
              />
              <StatCard icon={Hourglass} label="Time spent" value={formatDuration(selectedAttempt?.duration_seconds)} />
              <StatCard icon={AlertTriangle} label="Warnings" value={selectedAttempt?.warning_count ?? 0} tone="rose" />
            </section>

            <section className="rounded-md border border-border bg-card p-4 shadow-sm">
              <dl className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
                <div className="min-w-0 rounded-md bg-muted/40 px-3 py-2">
                  <dt className="font-bold text-muted-foreground">Started at</dt>
                  <dd className="mt-1 truncate font-semibold text-foreground">{formatDateTime(selectedAttempt?.started_at)}</dd>
                </div>
                <div className="min-w-0 rounded-md bg-muted/40 px-3 py-2">
                  <dt className="font-bold text-muted-foreground">Submitted at</dt>
                  <dd className="mt-1 truncate font-semibold text-foreground">{formatDateTime(selectedAttempt?.submitted_at)}</dd>
                </div>
                <div className="min-w-0 rounded-md bg-muted/40 px-3 py-2">
                  <dt className="font-bold text-muted-foreground">Exam</dt>
                  <dd className="mt-1 truncate font-semibold text-foreground">{data.exam?.title}</dd>
                </div>
                <div className="min-w-0 rounded-md bg-muted/40 px-3 py-2">
                  <dt className="font-bold text-muted-foreground">Class</dt>
                  <dd className="mt-1 truncate font-semibold text-foreground">{data.exam?.classes?.class_name || "Class"}</dd>
                </div>
              </dl>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold uppercase tracking-normal text-foreground">Question Review</h2>
              {result?.review_available ? (
                <section className="overflow-hidden rounded-md border border-border bg-card shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[980px] table-fixed border-collapse text-left text-sm">
                      <thead className="bg-muted text-xs font-bold uppercase text-muted-foreground">
                        <tr>
                          <th className="w-[80px] px-3 py-3">Question</th>
                          <th className="w-[280px] px-3 py-3">Question content</th>
                          <th className="w-[130px] px-3 py-3">Learner answer</th>
                          <th className="w-[130px] px-3 py-3">Correct answer</th>
                          <th className="w-[120px] px-3 py-3">Result</th>
                          <th className="w-[240px] px-3 py-3">Explanation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {(result.questions ?? []).map((question, index) => (
                          <tr key={question.exam_question_id} className="align-top">
                            <td className="whitespace-nowrap px-3 py-4 font-bold text-foreground">Q{index + 1}</td>
                            <td className="px-3 py-4 font-medium text-foreground">{question.question_text}</td>
                            <td className="whitespace-nowrap px-3 py-4 font-medium text-muted-foreground">
                              {optionLabels(question, (option) => option.is_selected)}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 font-medium text-muted-foreground">
                              {optionLabels(question, (option) => option.is_correct)}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${
                                  question.is_correct
                                    ? "border-success/30 bg-success/10 text-success"
                                    : "border-error/30 bg-error/10 text-error"
                                }`}
                              >
                                {question.is_correct ? <CheckCircle2 className="size-3.5" /> : <XCircle className="size-3.5" />}
                                {question.is_correct ? "Correct" : "Incorrect"}
                              </span>
                            </td>
                            <td className="px-3 py-4 text-muted-foreground">{question.explanation || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              ) : (
                <section className="rounded-md border border-border bg-card p-6 text-sm font-semibold text-muted-foreground shadow-sm">
                  {result?.message || "Question review is available after the attempt is submitted."}
                </section>
              )}
            </section>
          </>
        ) : null}
      </section>
    </main>
  );
}
