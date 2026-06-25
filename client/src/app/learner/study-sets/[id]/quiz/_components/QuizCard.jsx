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
    <div className="bg-white border border-neutral-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 relative overflow-hidden min-h-[380px] flex flex-col justify-between">
      {/* Tiêu đề & Nội dung câu hỏi */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-indigo-600 tracking-wider uppercase block">
            Question {questionNumber}
          </span>
          {isMultiSelect && (
            <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded-md animate-pulse">
              Multiple Correct Answers
            </span>
          )}
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 leading-snug">
          {question?.question_text}
        </h2>
        {isMultiSelect && (
          <p className="text-xs text-neutral-500 italic">
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

          let itemStyle = "border-neutral-200 hover:border-indigo-200 hover:bg-neutral-50/40";
          let badgeStyle = "bg-white text-neutral-500 border-neutral-200 group-hover:border-indigo-200 group-hover:text-indigo-600";

          if (isAnswerChecked) {
            if (isCorrectOption) {
              itemStyle = "border-emerald-500 bg-emerald-50/10 cursor-not-allowed";
              badgeStyle = "bg-emerald-500 text-white border-emerald-500";
            } else if (isSelected && !isCorrectOption) {
              itemStyle = "border-red-500 bg-red-50/10 cursor-not-allowed";
              badgeStyle = "bg-red-500 text-white border-red-500";
            } else {
              itemStyle = "border-neutral-100 bg-neutral-50/20 cursor-not-allowed opacity-60";
              badgeStyle = "bg-neutral-100 text-neutral-400 border-neutral-200";
            }
          } else {
            if (isSelected) {
              itemStyle = "border-indigo-600 bg-indigo-50/20 shadow-sm";
              badgeStyle = "bg-indigo-600 text-white border-indigo-600";
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
                <p className={`text-sm sm:text-base font-semibold ${isSelected ? "text-indigo-900" : "text-neutral-700"}`}>
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
                  <div className={`size-5 ${isMultiSelect ? "rounded-md" : "rounded-full"} bg-indigo-600 flex items-center justify-center text-white shrink-0`}>
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
        <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-4 space-y-1 my-4">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
            Explanation
          </span>
          <p className="text-sm text-neutral-600 italic leading-relaxed">
            {question.explanation}
          </p>
        </div>
      )}

      {/* Nút điều hướng tuần tự */}
      <div className="flex items-center justify-end pt-4 border-t border-neutral-100 mt-auto">
        {!isAnswerChecked ? (
          <Button 
            onClick={onCheckAnswer} 
            disabled={currentSelections.length === 0}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-6 py-2.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Check Answer
          </Button>
        ) : (
          !isLast ? (
            <Button onClick={onNextQuestion} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-5 py-2.5">
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