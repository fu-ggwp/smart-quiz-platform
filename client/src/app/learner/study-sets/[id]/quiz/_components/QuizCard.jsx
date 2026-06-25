import { ChevronLeft, ChevronRight, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function QuizCard({ 
  question, 
  questionNumber, 
  selectedOptionIds = [], // Array of selected option IDs
  selectedOptionId, // Fallback for single select
  onSelectOption, 
  onPrev, 
  onNext, 
  disablePrev, 
  isLast, 
  onSubmit 
}) {
  const currentSelections = Array.isArray(selectedOptionIds)
    ? selectedOptionIds
    : selectedOptionId
      ? [selectedOptionId]
      : [];

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
          const letter = String.fromCharCode(65 + idx); // A, B, C, D...

          return (
            <div
              key={opt.answer_option_id}
              onClick={() => onSelectOption(opt.answer_option_id)}
              className={`group flex items-center justify-between p-4 border rounded-2xl cursor-pointer transition-all duration-200 ${
                isSelected 
                  ? "border-indigo-600 bg-indigo-50/20 shadow-sm" 
                  : "border-neutral-200 hover:border-indigo-200 hover:bg-neutral-50/40"
              }`}
            >
              <div className="flex items-center gap-3.5 pr-2">
                <span className={`size-8 ${isMultiSelect ? "rounded-xl" : "rounded-full"} flex items-center justify-center text-sm font-bold border transition-colors ${
                  isSelected ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-neutral-500 border-neutral-200 group-hover:border-indigo-200 group-hover:text-indigo-600"
                }`}>
                  {letter}
                </span>
                <p className={`text-sm sm:text-base font-semibold ${isSelected ? "text-indigo-900" : "text-neutral-700"}`}>
                  {opt.option_text}
                </p>
              </div>
              {isSelected && (
                <div className={`size-5 ${isMultiSelect ? "rounded-md" : "rounded-full"} bg-indigo-600 flex items-center justify-center text-white shrink-0`}>
                  <svg className="size-3 fill-current" viewBox="0 0 20 20"><path d="M0 11l2-2 5 5L18 3l2 2L7 18z"/></svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Nút điều hướng phía dưới */}
      <div className="flex items-center justify-between pt-4 border-t border-neutral-100 mt-auto">
        <Button 
          variant="ghost" 
          onClick={onPrev} 
          disabled={disablePrev} 
          className="gap-1.5 font-semibold text-neutral-500 hover:text-neutral-900 disabled:opacity-40"
        >
          <ChevronLeft size={16} />
          <span>Prev</span>
        </Button>

        {!isLast ? (
          <Button onClick={onNext} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl px-5">
            <span>Next</span>
            <ChevronRight size={16} />
          </Button>
        ) : (
          <Button 
            onClick={onSubmit} 
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl px-5 gap-1.5 shadow-sm"
          >
            <Send size={14} />
            <span>Submit Quiz</span>
          </Button>
        )}
      </div>
    </div>
  );
}