import { ChevronRight, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function QuizCard({ 
  question, 
  questionNumber, 
  selectedOptionIds = [], 
  onSelectOption, 
  isAnswerChecked, 
  onCheckAnswer, 
  onNextQuestion, 
  isLast, 
  onSubmit 
}) {
  const currentSelections = Array.isArray(selectedOptionIds) ? selectedOptionIds : [];
  const correctCount = (question?.answer_options || []).filter(opt => opt.is_correct).length;
  const isMultiSelect = correctCount > 1;

  return (
    <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 relative overflow-hidden min-h-[380px] flex flex-col justify-between">
      {/* Tiêu đề & Nội dung câu hỏi */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-primary tracking-wider uppercase block">
            Question {questionNumber}
          </span>
          {isMultiSelect && (
            <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded-md animate-pulse">
              Multiple Correct Answers
            </span>
          )}
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground leading-snug">
          {question?.question_text}
        </h2>
        {isMultiSelect && (
          <p className="text-xs text-muted-foreground italic">
            Select all options that apply.
          </p>
        )}
      </div>

      {/* Các lựa chọn đáp án */}
      <div className="space-y-3 my-6">
        {(question?.answer_options || []).map((opt, idx) => {
          const isSelected = currentSelections.includes(opt.answer_option_id);
          const isCorrectOption = opt.is_correct;
          const letter = String.fromCharCode(65 + idx); // A, B, C, D...

          let itemStyle = "border-border hover:border-primary/50 hover:bg-muted/40";
          let badgeStyle = "bg-background text-muted-foreground border-border group-hover:border-primary/50 group-hover:text-primary";

          if (isAnswerChecked) {
            if (isCorrectOption) {
              itemStyle = "border-emerald-500 bg-emerald-50/10 cursor-not-allowed";
              badgeStyle = "bg-emerald-500 text-white border-emerald-500";
            } else if (isSelected && !isCorrectOption) {
              itemStyle = "border-red-500 bg-red-50/10 cursor-not-allowed";
              badgeStyle = "bg-red-500 text-white border-red-500";
            } else {
              itemStyle = "border-muted bg-muted/20 cursor-not-allowed opacity-60";
              badgeStyle = "bg-muted text-muted-foreground border-border";
            }
          } else {
            if (isSelected) {
              itemStyle = "border-primary bg-primary/10 shadow-sm";
              badgeStyle = "bg-primary text-primary-foreground border-primary";
            }
          }

          return (
            <div
              key={opt.answer_option_id}
              onClick={() => !isAnswerChecked && onSelectOption(opt.answer_option_id)}
              className={`group flex items-center justify-between p-4 border rounded-2xl transition-all duration-200 ${
                !isAnswerChecked ? "cursor-pointer" : ""
              } ${itemStyle}`}
            >
              <div className="flex items-center gap-3.5 pr-2">
                <span className={`size-8 ${isMultiSelect ? "rounded-xl" : "rounded-full"} flex items-center justify-center text-sm font-bold border transition-colors ${badgeStyle}`}>
                  {letter}
                </span>
                <p className={`text-sm sm:text-base font-semibold ${isSelected ? "text-foreground font-bold" : "text-foreground/80"}`}>
                  {opt.option_text}
                </p>
              </div>
              
              {isAnswerChecked ? (
                <div className="flex items-center gap-2">
                  {isCorrectOption && (
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-md">
                      Correct Answer {isSelected && "• Your Choice"}
                    </span>
                  )}
                  {isSelected && !isCorrectOption && (
                    <span className="text-[10px] font-bold bg-red-100 text-red-800 px-2.5 py-0.5 rounded-md">
                      Your Choice
                    </span>
                  )}
                </div>
              ) : (
                isSelected && (
                  <div className={`size-5 ${isMultiSelect ? "rounded-md" : "rounded-full"} bg-primary flex items-center justify-center text-primary-foreground shrink-0`}>
                    <svg className="size-3 fill-current" viewBox="0 0 20 20"><path d="M0 11l2-2 5 5L18 3l2 2L7 18z"/></svg>
                  </div>
                )
              )}
            </div>
          );
        })}
      </div>

      {/* Giải thích đáp án nếu đã kiểm tra */}
      {isAnswerChecked && question?.explanation && (
        <div className="bg-muted/50 border border-border rounded-2xl p-4 space-y-1 my-4">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
            Explanation
          </span>
          <p className="text-sm text-foreground italic leading-relaxed">
            {question.explanation}
          </p>
        </div>
      )}

      {/* Nút điều hướng tuần tự */}
      <div className="flex items-center justify-end pt-4 border-t border-border mt-auto">
        {!isAnswerChecked ? (
          <Button 
            onClick={onCheckAnswer} 
            disabled={currentSelections.length === 0}
            className="font-bold rounded-xl px-6 py-2.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Check Answer
          </Button>
        ) : (
          !isLast ? (
            <Button onClick={onNextQuestion} className="font-bold rounded-xl px-5 py-2.5">
              <span>Next Question</span>
              <ChevronRight size={16} className="ml-1" />
            </Button>
          ) : (
            <Button 
              onClick={onSubmit} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl px-5 py-2.5 gap-1.5 shadow-sm"
            >
              <Send size={14} />
              <span>Finish & View Results</span>
            </Button>
          )
        )}
      </div>
    </div>
  );
}