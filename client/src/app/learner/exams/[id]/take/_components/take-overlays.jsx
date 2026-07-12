import { Button } from "@/components/ui/button";

export function LoadingView() {
  return (
    <main className="fixed inset-0 z-50 grid place-items-center bg-background text-sm text-muted-foreground">
      Loading exam...
    </main>
  );
}

export function ErrorView({ error, examId, onBack }) {
  return (
    <main className="fixed inset-0 z-50 grid place-items-center bg-background p-6">
      <section className="w-full max-w-xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm font-semibold text-error">{error || "Exam attempt not found."}</p>
        <Button className="mt-4 rounded-sm" variant="outline" onClick={onBack}>
          Back to exam
        </Button>
      </section>
    </main>
  );
}

export function SubmittedView({ submitted, examId, onViewResults, onBackToList }) {
  const canReviewAnswers = submitted.result_visibility === "question_answer";

  return (
    <main className="fixed inset-0 z-50 grid place-items-center bg-background p-6">
      <section className="w-full max-w-xl border border-border bg-card p-6 text-center shadow-sm">
        <h1 className="text-xl font-bold text-foreground">Exam submitted successfully</h1>
        {submitted.result_visibility === "score_only" || canReviewAnswers ? (
          <p className="mt-3 text-sm text-muted-foreground">Score: {submitted.total_score} / {submitted.max_score}</p>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Your completion status has been saved.</p>
        )}
        <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
          {canReviewAnswers ? (
            <Button className="rounded-sm" onClick={onViewResults}>
              View question answers
            </Button>
          ) : null}
          <Button
            className="rounded-sm"
            variant={canReviewAnswers ? "outline" : "default"}
            onClick={onBackToList}
          >
            Back to exams
          </Button>
        </div>
      </section>
    </main>
  );
}
