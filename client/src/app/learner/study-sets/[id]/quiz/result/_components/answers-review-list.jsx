import { useState } from "react";
import { CheckCircle2, Loader2, Sparkles, XCircle } from "lucide-react";
import { aiService } from "@/services/ai.service";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function getAiExplanationError(error) {
  const status = error?.response?.status;
  const message = error?.response?.data?.error;

  if (status === 403) {
    return message || "AI explanations are available for Premium accounts only.";
  }

  if (status === 503 || status === 502) {
    return message || "AI explanation is currently unavailable. Please try again later.";
  }

  return message || "Could not generate AI explanation. Please try again.";
}

export default function AnswersReviewList({ sessionId, questions, answers }) {
  const [showOnlyWrong, setShowOnlyWrong] = useState(false);
  const [aiExplanations, setAiExplanations] = useState({});

  async function handleGenerateAiExplanation(questionId) {
    if (!sessionId || !questionId) return;

    setAiExplanations((current) => ({
      ...current,
      [questionId]: { status: "loading", text: "", error: "" },
    }));

    try {
      const response = await aiService.generateStudySetAnswerExplanation(sessionId, questionId);
      const aiExplanation = response?.data?.aiExplanation || response?.aiExplanation || "";

      setAiExplanations((current) => ({
        ...current,
        [questionId]: { status: "success", text: aiExplanation, error: "" },
      }));
    } catch (error) {
      setAiExplanations((current) => ({
        ...current,
        [questionId]: { status: "error", text: "", error: getAiExplanationError(error) },
      }));
    }
  }

  // Lọc danh sách câu hỏi dựa theo checkbox "Chỉ hiện câu sai"
  const filteredQuestions = questions.filter(q => {
    if (!showOnlyWrong) return true;
    const ans = answers.find(a => a.question_id === q.question_id);
    return ans ? ans.is_correct === false : true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Toggle bộ lọc */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-5 rounded-2xl shadow-sm">
        <div>
          <h3 className="font-extrabold text-foreground text-lg">Review Answers</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Check detail correctness and explanations</p>
        </div>

        {/* Toggle chỉ hiện câu sai (UC-21) */}
        <label className="flex items-center gap-2.5 cursor-pointer select-none bg-muted border border-border px-4 py-2 rounded-xl hover:bg-muted/80 transition-colors">
          <input 
            type="checkbox" 
            checked={showOnlyWrong} 
            onChange={(e) => setShowOnlyWrong(e.target.checked)} 
            className="size-4 rounded accent-primary border-border cursor-pointer text-foreground"
          />
          <span className="text-xs font-bold text-foreground">Show Only Wrong Answers</span>
        </label>
      </div>

      {/* Danh sách câu hỏi */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="bg-card border border-border rounded-3xl p-8 text-center text-muted-foreground italic">
            No questions match the filter criteria.
          </div>
        ) : (
          filteredQuestions.map((q, qIdx) => {
            const userAns = answers.find(a => a.question_id === q.question_id);
            const userSelectedOptionIds = userAns?.selected_answer_option_ids || [];
            const isCorrect = userAns ? userAns.is_correct : false;
            const aiState = aiExplanations[q.question_id] || { status: "idle", text: "", error: "" };
            const isAiLoading = aiState.status === "loading";

            return (
              <div 
                key={q.question_id}
                className={`bg-card border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 transition-all duration-200 ${
                  isCorrect 
                    ? "border-success/20 hover:border-success/30" 
                    : "border-error/20 hover:border-error/30"
                }`}
              >
                {/* Trạng thái và Tiêu đề câu hỏi */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <span className="text-xs font-extrabold text-muted-foreground tracking-wider uppercase block">
                      Question {qIdx + 1}
                    </span>
                    <h4 className="text-lg font-bold text-foreground leading-snug">
                      {q.question_text}
                    </h4>
                  </div>

                  {/* Icon Check / X */}
                  <div className="shrink-0 pt-1">
                    {isCorrect ? (
                      <span className="flex items-center gap-1 text-success bg-success/10 border border-success/20 px-3 py-1 rounded-full text-xs font-bold">
                        <CheckCircle2 size={14} />
                        <span>Correct</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-error bg-error/10 border border-error/20 px-3 py-1 rounded-full text-xs font-bold animate-shake">
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
                    let itemStyle = "border-border bg-card";
                    let badgeStyle = "bg-muted text-muted-foreground border-border";

                    if (isCorrectOption) {
                      itemStyle = "border-success bg-success/10";
                      badgeStyle = "bg-success text-primary-foreground border-success";
                    } else if (isUserSelection && !isCorrectOption) {
                      itemStyle = "border-error bg-error/10";
                      badgeStyle = "bg-error text-primary-foreground border-error";
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
                          <span className="text-sm font-semibold text-foreground">{opt.option_text}</span>
                        </div>

                        {/* Nhãn hiển thị trạng thái đáp án */}
                        {isCorrectOption && (
                          <span className="text-[10px] font-bold bg-success/20 text-success px-2 py-0.5 rounded-md">
                            Correct Answer {isUserSelection && "• Your Choice"}
                          </span>
                        )}
                        {isUserSelection && !isCorrectOption && (
                          <span className="text-[10px] font-bold bg-error/20 text-error px-2 py-0.5 rounded-md">
                            Your Choice
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Giải thích đáp án (Nếu có) */}
                {q.explanation && (
                  <div className="bg-muted/50 border border-border rounded-2xl p-4 space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Explanation
                    </span>
                    <p className="text-sm text-foreground italic leading-relaxed">
                      {q.explanation}
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <Button
                    type="button"
                    onClick={() => handleGenerateAiExplanation(q.question_id)}
                    disabled={isAiLoading || !sessionId}
                    variant="outline"
                    className="gap-2 rounded-xl font-bold text-xs px-4 py-2 h-auto"
                  >
                    {isAiLoading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Sparkles size={14} />
                    )}
                    <span>{isAiLoading ? "Generating..." : "AI Explanation"}</span>
                  </Button>

                  {aiState.status === "error" && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-error/20 bg-error/10 px-4 py-3.5 text-sm font-medium text-error">
                      <span>{aiState.error}</span>
                      {aiState.error.includes("Premium") && (
                        <Link
                          href="/upgrade"
                          className="shrink-0 inline-flex items-center justify-center rounded-xl bg-destructive text-primary-foreground hover:bg-destructive/90 font-bold px-4 py-2.5 text-xs text-center transition-colors shadow-sm"
                        >
                          Upgrade Now
                        </Link>
                      )}
                    </div>
                  )}

                  {aiState.status === "success" && aiState.text && (
                    <div className="rounded-2xl border border-border bg-muted/50 p-4 space-y-1">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
                        AI Explanation
                      </span>
                      <p className="text-sm text-foreground leading-relaxed">
                        {aiState.text}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
