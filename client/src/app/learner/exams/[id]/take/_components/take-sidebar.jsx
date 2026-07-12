import { CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatTime } from "./take-helpers";

export function TakeSidebar({
  remainingSeconds,
  questions = [],
  selectedAnswers = {},
  activeIndex,
  setActiveIndex,
  flaggedQuestions = {},
  onSubmit,
}) {
  return (
    <aside className="border border-border bg-card p-3 shadow-sm">
      <h2 className="border-b border-border pb-3 text-center text-sm font-bold text-muted-foreground">Exam information</h2>

      <div className="mx-1 mt-4 border border-border bg-background">
        <div className="bg-muted px-4 py-3 text-sm font-semibold text-muted-foreground">
          Exam notes
        </div>
        <ul className="space-y-1 px-8 py-4 text-xs leading-5 text-muted-foreground">
          <li>Watch the remaining time carefully.</li>
          <li>Your answers are saved automatically.</li>
          <li>Stay on the exam screen.</li>
          <li>Contact the teacher if you have a problem.</li>
        </ul>
      </div>

      <div className="mx-1 border-t border-border pt-4">
        <p className="text-xs text-muted-foreground">Time remaining</p>
        <p className="mt-1 text-base font-bold text-muted-foreground">{formatTime(remainingSeconds)}</p>
      </div>

      <div className="mx-1 mt-6">
        <div className="mb-3 grid grid-cols-5 gap-2">
          {questions.map((question, index) => {
            const answered = (selectedAnswers[question.exam_question_id] ?? []).length > 0;
            const active = index === activeIndex;
            const flagged = Boolean(flaggedQuestions[question.exam_question_id]);
            return (
              <button
                key={question.exam_question_id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`h-8 border text-sm font-bold ${
                  active
                    ? "border-info bg-info text-primary-foreground"
                    : flagged
                      ? "border-warning bg-warning/20 text-warning"
                      : answered
                        ? "border-info/40 bg-info/10 text-info"
                        : "border-border bg-card text-muted-foreground"
                }`}
              >
                {index + 1}
              </button>
            );
          })}
        </div>

        <Button
          className="h-8 w-full rounded-sm border-border bg-card text-foreground hover:bg-background"
          variant="outline"
          onClick={onSubmit}
        >
          <CheckSquare className="size-4" />
          Submit
        </Button>
      </div>
    </aside>
  );
}
