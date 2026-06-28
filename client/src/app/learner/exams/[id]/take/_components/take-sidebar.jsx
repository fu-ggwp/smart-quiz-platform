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
    <aside className="border border-slate-300 bg-white p-3 shadow-sm">
      <h2 className="border-b border-slate-200 pb-3 text-center text-sm font-bold text-slate-600">Exam information</h2>

      <div className="mx-1 mt-4 border border-slate-100 bg-slate-50">
        <div className="bg-[#f3f3fb] px-4 py-3 text-sm font-semibold text-slate-600">
          Exam notes
        </div>
        <ul className="space-y-1 px-8 py-4 text-xs leading-5 text-slate-600">
          <li>Watch the remaining time carefully.</li>
          <li>Your answers are saved automatically.</li>
          <li>Stay on the exam screen.</li>
          <li>Contact the teacher if you have a problem.</li>
        </ul>
      </div>

      <div className="mx-1 border-t border-slate-200 pt-4">
        <p className="text-xs text-slate-500">Time remaining</p>
        <p className="mt-1 text-base font-bold text-[#53608a]">{formatTime(remainingSeconds)}</p>
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
                    ? "border-blue-700 bg-blue-600 text-white"
                    : flagged
                      ? "border-yellow-500 bg-yellow-100 text-yellow-800"
                      : answered
                        ? "border-blue-300 bg-blue-50 text-blue-700"
                        : "border-slate-300 bg-white text-slate-600"
                }`}
              >
                {index + 1}
              </button>
            );
          })}
        </div>

        <Button
          className="h-8 w-full rounded-sm border-slate-400 bg-white text-slate-700 hover:bg-slate-50"
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
