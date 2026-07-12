import { Star, CheckCircle } from "lucide-react";

/**
 * Study-set review card that shows a question, its options, correct answer, and explanation.
 */
export function QuestionCard({
  question,
  index,
  isDifficult = false,
  isMastered = false,
  onToggleDifficult,
  onToggleMastered
}) {
  // Border color reflects learner review flags without changing the card contents.
  const statusClass = isDifficult 
    ? "border-warning/30 bg-warning/10" 
    : isMastered 
    ? "border-success/30 bg-success/10" 
    : "border-border bg-card";

  return (
    <div className={`relative rounded-2xl border p-6 shadow-sm hover:shadow-md transition-all duration-200 ${statusClass}`}>
      {/* Top-Right Control Buttons (Star & CheckCircle) */}
      <div className="absolute top-4 right-4 flex items-center gap-1 z-10" onClick={(e) => e.stopPropagation()}>
        <button 
          onClick={onToggleDifficult}
          className="p-1.5 hover:bg-muted rounded-full transition-colors"
          title={isDifficult ? "Remove from Difficult" : "Mark as Difficult"}
        >
          <Star className={`size-5 ${isDifficult ? "fill-warning text-warning" : "text-muted-foreground/50"}`} />
        </button>
        <button 
          onClick={onToggleMastered}
          className="p-1.5 hover:bg-muted rounded-full transition-colors"
          title={isMastered ? "Remove from Mastered" : "Mark as Mastered"}
        >
          <CheckCircle className={`size-5 ${isMastered ? "fill-success text-success" : "text-muted-foreground/50"}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* Left Column: Question & Options */}
        <div className="space-y-3 pr-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Question {index + 1}
          </p>
          <p className="text-lg font-bold text-foreground leading-relaxed">
            {question.question_text}
          </p>
          {/* Answer Options */}
          <div className="space-y-1.5 pl-1">
            {(question.answer_options || []).map((opt, oIdx) => (
              <p key={oIdx} className="text-sm text-foreground/80 leading-relaxed">
                {String.fromCharCode(97 + oIdx)}. {opt.option_text}
              </p>
            ))}
          </div>
        </div>

        {/* Right Column: Correct Answer & Explanation */}
        <div className="border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6 space-y-3 flex flex-col justify-center">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
              Correct Answer
            </span>
            {(question.answer_options || []).filter(opt => opt.is_correct).map((opt, oIdx) => (
              <p key={oIdx} className="text-base font-bold text-success leading-relaxed bg-success/10 border border-success/20 px-2.5 py-1 rounded-lg inline-block">
                {opt.option_text}
              </p>
            ))}
          </div>
          {question.explanation && (
            <div className="border-t border-dashed border-border/60 pt-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Explanation
              </span>
              <p className="text-sm text-muted-foreground italic leading-relaxed">
                {question.explanation}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default QuestionCard;
