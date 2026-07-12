import { Star } from "lucide-react";

/**
 * Exam-taking question card. Keeps answer selection separate from sidebar navigation state.
 */
export function TakeQuestionCard({
  activeQuestion,
  activeIndex,
  flaggedQuestions = {},
  onToggleFlag,
  selectedAnswers = {},
  onSelectOption,
  fontScale,
}) {
  // Exam question options are already shaped for taking: { index, text }.
  const activeOptions = Array.isArray(activeQuestion?.answer_options)
    ? activeQuestion.answer_options
    : [];

  return (
    <section className="min-h-[398px] border border-border bg-card shadow-sm">
      {/* Question Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h1 className="text-sm font-bold text-muted-foreground">
          QUESTION {activeIndex + 1} (SINGLE CHOICE)
        </h1>
        <button
          className={`flex h-8 items-center gap-1 border px-3 text-xs font-semibold ${
            flaggedQuestions[activeQuestion?.exam_question_id]
              ? "border-warning bg-warning/20 text-warning"
              : "border-warning/30 text-warning"
          }`}
          onClick={() => activeQuestion && onToggleFlag(activeQuestion.exam_question_id)}
          type="button"
        >
          <Star className="size-4" />
          Flag
        </button>
      </div>

      {activeQuestion ? (
        <div>
          {/* Question Prompt */}
          <div className="min-h-[210px] border-b border-border px-6 py-9">
            <p
              className="max-w-4xl font-semibold leading-7 text-foreground"
              style={{ fontSize: `${fontScale}rem` }}
            >
              {activeQuestion.question_text}
            </p>
          </div>

          {/* Answer Options */}
          <div
            className="space-y-4 px-5 py-5"
            style={{ fontSize: `${fontScale}rem` }}
          >
            {activeOptions.map((option, index) => {
              const checked = selectedAnswers[activeQuestion.exam_question_id]?.[0] === option.index;
              return (
                <label
                  key={`${activeQuestion.exam_question_id}-${option.index}`}
                  className="flex cursor-pointer items-center gap-3 text-sm text-foreground"
                >
                  <input
                    checked={checked}
                    name={activeQuestion.exam_question_id}
                    onChange={() => onSelectOption(activeQuestion.exam_question_id, option.index)}
                    type="radio"
                    className="size-4 accent-primary"
                  />
                  <span>({String.fromCharCode(105 + index)})</span>
                  <span>{option.text}</span>
                </label>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid min-h-[360px] place-items-center text-sm text-muted-foreground">
          No questions available.
        </div>
      )}
    </section>
  );
}
