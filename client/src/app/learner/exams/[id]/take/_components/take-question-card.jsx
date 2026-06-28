import { Star } from "lucide-react";

export function TakeQuestionCard({
  activeQuestion,
  activeIndex,
  flaggedQuestions = {},
  onToggleFlag,
  selectedAnswers = {},
  onSelectOption,
  fontScale,
}) {
  const activeOptions = Array.isArray(activeQuestion?.answer_options)
    ? activeQuestion.answer_options
    : [];

  return (
    <section className="min-h-[398px] border border-slate-300 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h1 className="text-sm font-bold text-[#53608a]">
          QUESTION {activeIndex + 1} (SINGLE CHOICE)
        </h1>
        <button
          className={`flex h-8 items-center gap-1 border px-3 text-xs font-semibold ${
            flaggedQuestions[activeQuestion?.exam_question_id]
              ? "border-yellow-500 bg-yellow-100 text-yellow-800"
              : "border-yellow-200 text-yellow-600"
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
          <div className="min-h-[210px] border-b border-slate-200 px-6 py-9">
            <p
              className="max-w-4xl font-semibold leading-7 text-slate-800"
              style={{ fontSize: `${fontScale}rem` }}
            >
              {activeQuestion.question_text}
            </p>
          </div>

          <div
            className="space-y-4 px-5 py-5"
            style={{ fontSize: `${fontScale}rem` }}
          >
            {activeOptions.map((option, index) => {
              const checked = selectedAnswers[activeQuestion.exam_question_id]?.[0] === option.index;
              return (
                <label
                  key={`${activeQuestion.exam_question_id}-${option.index}`}
                  className="flex cursor-pointer items-center gap-3 text-sm text-slate-700"
                >
                  <input
                    checked={checked}
                    name={activeQuestion.exam_question_id}
                    onChange={() => onSelectOption(activeQuestion.exam_question_id, option.index)}
                    type="radio"
                    className="size-4 accent-[#5368b5]"
                  />
                  <span>({String.fromCharCode(105 + index)})</span>
                  <span>{option.text}</span>
                </label>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid min-h-[360px] place-items-center text-sm text-slate-500">
          No questions available.
        </div>
      )}
    </section>
  );
}
