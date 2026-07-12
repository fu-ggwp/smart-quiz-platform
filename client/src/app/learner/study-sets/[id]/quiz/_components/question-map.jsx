export default function QuestionMap({ questions, currentIndex, selectedAnswers, checkedQuestions = {} }) {
  return (
    <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-6">
      <div>
        <h3 className="font-extrabold text-foreground text-base">Question Progress</h3>
        <p className="text-xs text-muted-foreground mt-1">Quiz question navigation is sequential</p>
      </div>

      {/* Grid chỉ mục các câu hỏi */}
      <div className="grid grid-cols-5 gap-2.5">
        {questions.map((q, idx) => {
          const isCurrent = idx === currentIndex;
          const isAnswered = !!checkedQuestions[q.question_id];

          let cellClass = "bg-background text-muted-foreground border-border";
          if (isAnswered) {
            const userSelected = selectedAnswers[q.question_id] || [];
            const correctOptionIds = (q.answer_options || []).filter(opt => opt.is_correct).map(opt => opt.answer_option_id);
            const isCorrect = correctOptionIds.length === userSelected.length && 
                              correctOptionIds.every(id => userSelected.includes(id));
            if (isCorrect) {
              cellClass = "bg-success text-primary-foreground border-success shadow-sm";
            } else {
              cellClass = "bg-error text-primary-foreground border-error shadow-sm";
            }
          } else if (isCurrent) {
            cellClass = "bg-primary text-primary-foreground border-primary shadow-sm";
          }

          return (
            <div
              key={q.question_id}
              className={`h-10 rounded-xl font-bold text-sm border flex items-center justify-center transition-all duration-200 select-none ${cellClass}`}
            >
              {idx + 1}
            </div>
          );
        })}
      </div>
    </div>
  );
}