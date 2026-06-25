import { Button } from "@/components/ui/button";

export default function QuestionMap({ questions, currentIndex, selectedAnswers, onSelectQuestion, onSubmit }) {
  return (
    <div className="bg-white border border-neutral-100 rounded-3xl p-6 shadow-sm space-y-6">
      <div>
        <h3 className="font-extrabold text-neutral-900 text-base">Question Map</h3>
        <p className="text-xs text-neutral-400 mt-1">Jump directly to any card</p>
      </div>

      {/* Grid chỉ mục các câu hỏi */}
      <div className="grid grid-cols-5 gap-2.5">
        {questions.map((q, idx) => {
          const isCurrent = idx === currentIndex;
          const isAnswered = Array.isArray(selectedAnswers[q.question_id])
            ? selectedAnswers[q.question_id].length > 0
            : !!selectedAnswers[q.question_id];

          return (
            <button
              key={q.question_id}
              onClick={() => onSelectQuestion(idx)}
              className={`h-10 rounded-xl font-bold text-sm border flex items-center justify-center transition-all duration-200 ${
                isCurrent ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" :
                isAnswered ? "bg-emerald-50 text-emerald-600 border-emerald-100 hover:border-emerald-300" :
                "bg-white text-neutral-400 border-neutral-200 hover:border-indigo-300 hover:text-indigo-600"
              }`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Chú thích màu sắc */}
      <div className="pt-4 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-400 font-semibold">
        <div className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-emerald-500"></span>
          <span>Answered</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-neutral-200"></span>
          <span>Unanswered</span>
        </div>
      </div>

      {/* Nút nộp bài cuối cùng */}
      <Button onClick={onSubmit} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 font-bold">
        Finish and Submit
      </Button>
    </div>
  );
}