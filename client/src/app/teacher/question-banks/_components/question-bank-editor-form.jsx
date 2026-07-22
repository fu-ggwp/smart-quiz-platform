"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, ChevronDown, ChevronRight, FileSpreadsheet, Loader2, Plus, Save, Sparkles, X } from "lucide-react";

import ExcelImporter from "@/components/question-creator/excel-importer";
import MaterialQuestionGenerator from "@/components/question-creator/material-question-generator";
import QuestionCardEditor from "@/components/question-creator/question-card-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PREMIUM_REQUIRED_MESSAGE } from "@/lib/premium";

import { getQuestionChapterLabel, groupQuestionsByChapter } from "../_lib/question-bank-editor";

const labels = {
  create: {
    title: "Create Question Bank",
    submit: "Create Question Bank",
    submitting: "Creating...",
  },
  edit: {
    title: "Edit Question Bank",
    submit: "Save Changes",
    submitting: "Saving...",
  },
};

/**
 * Shared create/edit form for question-bank metadata and question draft cards.
 */
export function QuestionBankEditorForm({
  actionSlot,
  backLabel = "Back",
  errors = {},
  form,
  mode,
  onAddOption,
  onAddQuestion,
  onCancel,
  onDeleteOption,
  onDeleteQuestion,
  onDismissSubmitError,
  onGenerateMaterial,
  onImportExcel,
  onMetadataChange,
  onOptionChange,
  onQuestionFieldChange,
  onSubmit,
  questions,
  submitting,
}) {
  const copy = labels[mode] || labels.edit;
  const [collapsedChapters, setCollapsedChapters] = useState({});

  // Group by chapter for readability, while each item keeps its original draft index.
  const questionGroups = useMemo(
    () => groupQuestionsByChapter(questions, (question) => question.groupChapter || getQuestionChapterLabel(question)),
    [questions],
  );

  function toggleChapter(chapter) {
    setCollapsedChapters((current) => ({
      ...current,
      [chapter]: !current[chapter],
    }));
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-4xl space-y-6">
        <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Button onClick={onCancel} size="sm" variant="ghost" className="mb-3 -ml-3" type="button">
              <ArrowLeft className="size-4" />
              {backLabel}
            </Button>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{copy.title}</h1>
          </div>
          {actionSlot}
        </header>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Question Bank Details */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
            <h2 className="border-b border-border pb-2 text-lg font-bold text-foreground">Question Bank Details</h2>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-semibold text-foreground">Title <span className="text-error">*</span></label>
                <Input name="title" placeholder="e.g. Grade 10 Algebra" value={form.title} onChange={onMetadataChange} />
                {errors.title && <p className="text-xs font-semibold text-error">{errors.title}</p>}
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-semibold text-foreground">Description</label>
                <textarea
                  className="min-h-[80px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  name="description"
                  placeholder="What subject, classes, or exam goals does this bank cover?"
                  value={form.description}
                  onChange={onMetadataChange}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">Subject</label>
                <Input name="subject" placeholder="e.g. Linear equations" value={form.subject} onChange={onMetadataChange} />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">Status</label>
                <select
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  name="status"
                  value={form.status}
                  onChange={onMetadataChange}
                >
                  <option value="Draft">Draft</option>
                  <option value="Ready">Ready</option>
                </select>
              </div>
            </div>
          </section>

          {errors.submit && (
            <div className="flex flex-col justify-between gap-4 rounded-2xl border border-error/20 bg-error/10 px-4 py-3.5 text-sm font-medium text-error sm:flex-row sm:items-center">
              <span>{errors.submit}</span>
              <div className="flex shrink-0 items-center gap-2">
                {errors.submit === PREMIUM_REQUIRED_MESSAGE && (
                  <Link
                    href="/plans"
                    className="inline-flex items-center justify-center rounded-xl bg-destructive px-4 py-2.5 text-center text-xs font-bold text-primary-foreground shadow-sm transition-colors hover:bg-destructive/90"
                  >
                    Upgrade Now
                  </Link>
                )}
                <Button
                  aria-label="Dismiss message"
                  className="size-9 rounded-xl p-0 text-error hover:bg-error/10 hover:text-error"
                  onClick={onDismissSubmitError}
                  type="button"
                  variant="ghost"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Question Editor Tools */}
          <section className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">Questions ({questions.length})</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {onImportExcel && (
                  <Button onClick={onImportExcel} type="button" variant="outline" className="gap-2">
                    <FileSpreadsheet className="size-4" />
                    Import from Excel
                  </Button>
                )}
                {onGenerateMaterial && (
                  <Button onClick={onGenerateMaterial} type="button" variant="outline" className="gap-2">
                    <Sparkles className="size-4" />
                    Generate from Material
                  </Button>
                )}
              </div>
            </div>

            {questions.length > 0 && (
              /* Questions Grouped by Chapter */
              <div className="space-y-6">
                {questionGroups.map((group) => {
                  const isExpanded = !collapsedChapters[group.chapter];

                  return (
                    <section key={group.chapter} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                      <button
                        className="flex w-full items-center justify-between gap-3 border-b border-border px-4 py-3 text-left hover:bg-muted/50"
                        onClick={() => toggleChapter(group.chapter)}
                        type="button"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          {isExpanded ? <ChevronDown className="size-4 shrink-0" /> : <ChevronRight className="size-4 shrink-0" />}
                          <span className="truncate text-sm font-bold text-foreground">{group.chapter}</span>
                        </span>
                        <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                          {group.questions.length} {group.questions.length === 1 ? "question" : "questions"}
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="space-y-4 bg-background p-4">
                          {group.questions.map(({ question, index }) => (
                            <QuestionCardEditor
                              key={question.question_id || index}
                              question={question}
                              qIndex={index}
                              errors={errors}
                              onFieldChange={(field, value) => onQuestionFieldChange(index, field, value)}
                              onDelete={() => onDeleteQuestion(index)}
                              onAddOption={() => onAddOption(index)}
                              onDeleteOption={(optionIndex) => onDeleteOption(index, optionIndex)}
                              onOptionChange={(optionIndex, field, value) => onOptionChange(index, optionIndex, field, value)}
                            />
                          ))}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            )}

            <Button onClick={onAddQuestion} type="button" variant="outline" className="h-12 w-full gap-2 rounded-2xl border-dashed">
              <Plus className="size-4" />
              Add Question Card
            </Button>
          </section>

          {/* Form Actions */}
          <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-end">
            <Button disabled={submitting} onClick={onCancel} type="button" variant="outline">
              Cancel
            </Button>
            <Button disabled={submitting} type="submit" className="gap-2">
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {submitting ? copy.submitting : copy.submit}
            </Button>
          </div>
        </form>
      </section>
    </main>
  );
}

/**
 * Modal wrapper for importing question drafts from an Excel worksheet.
 */
export function QuestionBankExcelImportModal({ onCancel, onQuestionsImported }) {
  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-neutral/60 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl">
        <ExcelImporter
          onCancel={onCancel}
          onQuestionsImported={onQuestionsImported}
        />
      </div>
    </div>
  );
}

/**
 * Modal wrapper for generating question drafts from PDF/DOCX material.
 */
export function QuestionBankMaterialGenerateModal({ generateQuestions, onCancel, onQuestionsGenerated }) {
  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-neutral/60 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl">
        <MaterialQuestionGenerator
          generateQuestions={generateQuestions}
          onCancel={onCancel}
          onQuestionsGenerated={onQuestionsGenerated}
        />
      </div>
    </div>
  );
}
