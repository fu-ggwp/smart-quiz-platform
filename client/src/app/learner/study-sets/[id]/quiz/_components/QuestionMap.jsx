export default function QuestionMap({ questions, currentIndex, selectedAnswers }) {
  return (
    <div className="bg-white border border-neutral-100 rounded-3xl p-6 shadow-sm space-y-6">
      <div>
        <h3 className="font-extrabold text-neutral-900 text-base">Question Progress</h3>
        <p className="text-xs text-neutral-400 mt-1">Quiz question navigation is sequential</p>
      </div>

      {/* Grid chỉ mục các câu hỏi */}
      <div className="grid grid-cols-5 gap-2.5">
        {questions.map((q, idx) => {
          const isCurrent = idx === currentIndex;
          const isAnswered = Array.isArray(selectedAnswers[q.question_id])
            ? selectedAnswers[q.question_id].length > 0
            : !!selectedAnswers[q.question_id];

          return (
            <div
              key={q.question_id}
              className={`h-10 rounded-xl font-bold text-sm border flex items-center justify-center transition-all duration-200 select-none ${
                isCurrent ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" :
                isAnswered ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                "bg-white text-neutral-400 border-neutral-200"
              }`}
            >
              {idx + 1}
            </div>
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
    </div>
  );
}