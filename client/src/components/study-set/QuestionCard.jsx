import { Star, CheckCircle } from "lucide-react";

export function QuestionCard({
  question,
  index,
  isDifficult = false,
  isMastered = false,
  onToggleDifficult,
  onToggleMastered
}) {
  const statusClass = isDifficult 
    ? "border-amber-200 bg-amber-50/20" 
    : isMastered 
    ? "border-emerald-200 bg-emerald-50/20" 
    : "border-border bg-card";

  return (
    <div className={`relative rounded-2xl border p-6 shadow-sm hover:shadow-md transition-all duration-200 ${statusClass}`}>
      {/* Top-Right Control Buttons (Star & CheckCircle) */}
      <div className="absolute top-4 right-4 flex items-center gap-1 z-10" onClick={(e) => e.stopPropagation()}>
        <button 
          onClick={onToggleDifficult}
          className="p-1.5 hover:bg-neutral-100 rounded-full transition-colors"
          title={isDifficult ? "Remove from Difficult" : "Mark as Difficult"}
        >
          <Star className={`size-5 ${isDifficult ? "fill-amber-400 text-amber-500" : "text-neutral-300"}`} />
        </button>
        <button 
          onClick={onToggleMastered}
          className="p-1.5 hover:bg-neutral-100 rounded-full transition-colors"
          title={isMastered ? "Remove from Mastered" : "Mark as Mastered"}
        >
          <CheckCircle className={`size-5 ${isMastered ? "fill-emerald-500 text-emerald-600" : "text-neutral-300"}`} />
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
          {/* Render Options */}
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
              <p key={oIdx} className="text-base font-bold text-emerald-600 leading-relaxed bg-emerald-50/40 border border-emerald-100/50 px-2.5 py-1 rounded-lg inline-block">
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
