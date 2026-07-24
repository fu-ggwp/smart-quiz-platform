"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Editable question card used by manual entry, Excel import preview, and AI preview.
 */
export default function QuestionCardEditor({
  question,
  qIndex,
  errors = {},
  hasError = false,
  onFieldChange = () => {},
  onDelete = () => {},
  onAddOption = () => {},
  onDeleteOption = () => {},
  onOptionChange = () => {},
  readOnly = false,
}) {
  // Generated/imported questions may use `options`; server rows may use `answer_options`.
  const options = question.options || question.answer_options || [];

  return (
    <div
      className="relative rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4"
      data-editor-error={hasError ? "true" : undefined}
      tabIndex={hasError ? -1 : undefined}
    >

      {/* Header bar of question card */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-muted-foreground">
            Question #{qIndex + 1}
          </span>
          {question.source_question_id && (
            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
              Imported from Question Bank
            </span>
          )}
        </div>
        {!readOnly && (
          <Button
            onClick={onDelete}
            type="button"
            variant="ghost"
            size="icon"
            className="text-error hover:text-error hover:bg-error/10"
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>

      {/* Question text */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-foreground">Question
          <span className="text-error"> *</span></label>
        <textarea
          className="min-h-[60px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
          placeholder="Enter the question text"
          readOnly={readOnly}
          value={question.question_text}
          onChange={(e) => onFieldChange("question_text", e.target.value)}
        />
        {errors[`q_${qIndex}_text`] && (
          <p className="text-xs font-semibold text-error mt-0.5">{errors[`q_${qIndex}_text`]}</p>
        )}
      </div>

      {/* Question metadata */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground">Chapter</label>
        <Input
          placeholder="e.g. Chapter 2"
          readOnly={readOnly}
          value={question.chapter || ""}
          className="h-9 text-xs"
          onChange={(e) => onFieldChange("chapter", e.target.value)}
        />
      </div>

      {/* Options Editor */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-foreground">
            Answer Options<span className="text-error"> *</span>
          </label>
          {!readOnly && (
            <Button
              onClick={onAddOption}
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs text-primary"
            >
              <Plus size={14} />
              Add Option
            </Button>
          )}
        </div>

        <div className="space-y-2">
          {options.map((opt, optIndex) => (
            <div key={optIndex} className="flex items-center gap-3">
              <input
                type="checkbox"
                className="rounded border-input text-primary focus:ring-primary size-4 cursor-pointer disabled:cursor-default disabled:opacity-70"
                checked={opt.is_correct}
                disabled={readOnly}
                onChange={(e) => onOptionChange(optIndex, "is_correct", e.target.checked)}
                title="Mark as correct answer"
              />

              <Input
                placeholder={`Option ${optIndex + 1}`}
                readOnly={readOnly}
                value={opt.option_text}
                onChange={(e) => onOptionChange(optIndex, "option_text", e.target.value)}
              />

              {!readOnly && options.length > 2 && (
                <Button
                  onClick={() => onDeleteOption(optIndex)}
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground hover:text-error"
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        {errors[`q_${qIndex}_options`] && (
          <p className="text-xs font-semibold text-error mt-1">{errors[`q_${qIndex}_options`]}</p>
        )}
      </div>

      {/* Explanation */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-foreground">Answer Explanation</label>
        <textarea
          className="min-h-[40px] w-full rounded-xl border border-input bg-background px-3 py-1.5 text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
          placeholder="Explain why the correct answers are right (optional)"
          readOnly={readOnly}
          value={question.explanation || ""}
          onChange={(e) => onFieldChange("explanation", e.target.value)}
        />
      </div>
    </div>
  );
}
