"use client";

import { Check, Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Display options in the same order teachers saved them.
 */
function sortAnswerOptions(options = []) {
  return [...options].sort((left, right) => (left.display_order || 0) - (right.display_order || 0));
}

/**
 * Read-only preview card with optional answer/explanation reveal.
 */
export function QuestionPreviewCard({ className, index, isRevealed, onToggleReveal, question }) {
  const options = sortAnswerOptions(question?.answer_options || []);
  const questionId = question?.question_id;

  return (
    <article
      className={cn(
        "space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm transition duration-200 hover:shadow-md",
        className
      )}
    >
      {/* Question Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <span className="text-sm font-bold text-muted-foreground">Question #{index + 1}</span>
        <Button
          aria-label={isRevealed ? "Hide answer" : "Show answer"}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          disabled={!questionId}
          onClick={() => onToggleReveal(questionId)}
          size="icon"
          title={isRevealed ? "Hide Answer" : "Show Answer"}
          type="button"
          variant="ghost"
        >
          {isRevealed ? <EyeOff size={16} /> : <Eye size={16} />}
        </Button>
      </div>

      {/* Question Text */}
      <p className="break-words text-base font-medium leading-relaxed text-foreground">{question?.question_text}</p>

      {/* Answer Options */}
      <div className="grid gap-2.5 sm:grid-cols-2">
        {options.map((option, optionIndex) => {
          const showCorrectAnswer = isRevealed && option.is_correct;
          const optionKey = option.answer_option_id || `${questionId || "question"}-${optionIndex}`;

          return (
            <div
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3 text-sm transition duration-150",
                showCorrectAnswer
                  ? "border-success bg-success/10 font-semibold text-success"
                  : "border-border bg-muted/10 text-foreground"
              )}
              key={optionKey}
            >
              <div
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border text-xs",
                  showCorrectAnswer
                    ? "border-success bg-success text-primary-foreground"
                    : "border-border bg-muted/40 text-muted-foreground"
                )}
              >
                {showCorrectAnswer ? <Check size={12} /> : null}
              </div>
              <span className="w-full break-words">{option.option_text}</span>
            </div>
          );
        })}
      </div>

      {/* Explanation */}
      {isRevealed && question?.explanation ? (
        <div className="space-y-1 rounded-xl border border-primary/10 bg-primary/5 p-4 text-xs">
          <h4 className="font-bold text-primary">Explanation</h4>
          <p className="leading-relaxed text-muted-foreground">{question.explanation}</p>
        </div>
      ) : null}
    </article>
  );
}

export default QuestionPreviewCard;
