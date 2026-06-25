import { useState } from "react";
import { CheckCircle2, XCircle, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function AnswersReviewList({ questions, answers }) {
  const [showOnlyWrong, setShowOnlyWrong] = useState(false);

  // Lọc danh sách câu hỏi dựa theo checkbox "Chỉ hiện câu sai"
  const filteredQuestions = questions.filter(q => {
    if (!showOnlyWrong) return true;
    const ans = answers.find(a => a.question_id === q.question_id);
    return ans ? ans.is_correct === false : true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Toggle bộ lọc */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-neutral-100 p-5 rounded-2xl shadow-sm">
        <div>
          <h3 className="font-extrabold text-neutral-900 text-lg">Review Answers</h3>
          <p className="text-xs text-neutral-400 mt-0.5">Check detail correctness and explanations</p>
        </div>

        {/* Toggle chỉ hiện câu sai (UC-21) */}
        <label className="flex items-center gap-2.5 cursor-pointer select-none bg-neutral-50 border border-neutral-200 px-4 py-2 rounded-xl hover:bg-neutral-100 transition-colors">
          <input 
            type="checkbox" 
            checked={showOnlyWrong} 
            onChange={(e) => setShowOnlyWrong(e.target.checked)} 
            className="size-4 rounded text-indigo-600 border-neutral-300 focus:ring-indigo-500 cursor-pointer"
          />
          <span className="text-xs font-bold text-neutral-700">Show Only Wrong Answers</span>
        </label>
      </div>

      {/* Danh sách câu hỏi */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="bg-white border border-neutral-100 rounded-3xl p-8 text-center text-neutral-400 italic">
            No questions match the filter criteria.
          </div>
        ) : (
          filteredQuestions.map((q, qIdx) => {
            const userAns = answers.find(a => a.question_id === q.question_id);
            const userSelectedOptionIds = userAns?.selected_answer_option_ids || [];
            const isCorrect = userAns ? userAns.is_correct : false;

            return (
              <div 
                key={q.question_id}
                className={`bg-white border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 transition-all duration-200 ${
                  isCorrect 
                    ? "border-emerald-100 hover:border-emerald-200" 
                    : "border-red-100 hover:border-red-200"
                }`}
              >
                {/* Trạng thái và Tiêu đề câu hỏi */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <span className="text-xs font-extrabold text-neutral-400 tracking-wider uppercase block">
                      Question {qIdx + 1}
                    </span>
                    <h4 className="text-lg font-bold text-neutral-900 leading-snug">
                      {q.question_text}
                    </h4>
                  </div>

                  {/* Icon Check / X */}
                  <div className="shrink-0 pt-1">
                    {isCorrect ? (
                      <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full text-xs font-bold">
                        <CheckCircle2 size={14} />
                        <span>Correct</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-600 bg-red-50 border border-red-100 px-3 py-1 rounded-full text-xs font-bold animate-shake">
                        <XCircle size={14} />
                        <span>Incorrect</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Danh sách các đáp án lựa chọn */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(q.answer_options || []).map((opt, optIdx) => {
                    const isUserSelection = userSelectedOptionIds.includes(opt.answer_option_id);
                    const isCorrectOption = opt.is_correct;
                    const letter = String.fromCharCode(65 + optIdx);

                    // Thiết lập màu sắc viền/nền tương ứng
                    let itemStyle = "border-neutral-200 bg-white";
                    let badgeStyle = "bg-neutral-100 text-neutral-500 border-neutral-200";

                    if (isCorrectOption) {
                      itemStyle = "border-emerald-500 bg-emerald-50/10";
                      badgeStyle = "bg-emerald-500 text-white border-emerald-500";
                    } else if (isUserSelection && !isCorrectOption) {
                      itemStyle = "border-red-500 bg-red-50/10";
                      badgeStyle = "bg-red-500 text-white border-red-500";
                    }

                    return (
                      <div 
                        key={opt.answer_option_id}
                        className={`flex items-center justify-between p-3.5 border rounded-2xl ${itemStyle}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`size-7 rounded-lg flex items-center justify-center text-xs font-bold border ${badgeStyle}`}>
                            {letter}
                          </span>
                          <span className="text-sm font-semibold text-neutral-800">{opt.option_text}</span>
                        </div>

                        {/* Nhãn hiển thị trạng thái đáp án */}
                        {isCorrectOption && (
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                            Correct Answer {isUserSelection && "• Your Choice"}
                          </span>
                        )}
                        {isUserSelection && !isCorrectOption && (
                          <span className="text-[10px] font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded-md">
                            Your Choice
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Giải thích đáp án (Nếu có) */}
                {q.explanation && (
                  <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-4 space-y-1">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                      Explanation
                    </span>
                    <p className="text-sm text-neutral-600 italic leading-relaxed">
                      {q.explanation}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}