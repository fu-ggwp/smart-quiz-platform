"use client";

import { ArrowLeft, FileSpreadsheet, Loader2, Plus, Save, Sparkles } from "lucide-react";

import ExcelImporter from "@/components/question-creator/ExcelImporter";
import MaterialQuestionGenerator from "@/components/question-creator/MaterialQuestionGenerator";
import QuestionCardEditor from "@/components/question-creator/QuestionCardEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const labels = {
  create: {
    title: "Create Question Bank",
    description: "Create metadata and draft reusable questions in one place.",
    questionDescription: "Add prompts, options, and explanations directly.",
    emptyDescription: "This bank will be created without questions.",
    submit: "Create Question Bank",
    submitting: "Creating...",
  },
  edit: {
    title: "Edit Question Bank",
    description: "Update metadata and edit reusable questions in one place.",
    questionDescription: "Edit prompts, options, and explanations directly.",
    emptyDescription: "Add a question card or save this empty bank to remove all active questions.",
    submit: "Save Changes",
    submitting: "Saving...",
  },
};

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
            <p className="mt-2 text-sm text-muted-foreground">{copy.description}</p>
          </div>
          {actionSlot}
        </header>

        {errors.submit && (
          <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errors.submit}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
            <h2 className="border-b border-border pb-2 text-lg font-bold text-foreground">Question Bank Details</h2>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-semibold text-foreground">Title <span className="text-rose-500">*</span></label>
                <Input name="title" placeholder="e.g. Grade 10 Algebra" value={form.title} onChange={onMetadataChange} />
                {errors.title && <p className="text-xs font-semibold text-rose-500">{errors.title}</p>}
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-semibold text-foreground">Description</label>
                <textarea
                  className="min-h-[80px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  name="description"
                  placeholder="What topics, classes, or exam goals does this bank cover?"
                  value={form.description}
                  onChange={onMetadataChange}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">Topic</label>
                <Input name="topic" placeholder="e.g. Linear equations" value={form.topic} onChange={onMetadataChange} />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">Status</label>
                <select
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  name="status"
                  value={form.status}
                  onChange={onMetadataChange}
                >
                  <option value="Private">Private</option>
                  <option value="Assigned">Assigned</option>
                </select>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">Questions ({questions.length})</h2>
                <p className="text-sm text-muted-foreground">{copy.questionDescription}</p>
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

            {questions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
                {copy.emptyDescription}
              </div>
            ) : (
              <div className="space-y-6">
                {questions.map((question, index) => (
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

            <Button onClick={onAddQuestion} type="button" variant="outline" className="h-12 w-full gap-2 rounded-2xl border-dashed">
              <Plus className="size-4" />
              Add Question Card
            </Button>
          </section>

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

export function QuestionBankExcelImportModal({ onCancel, onQuestionsImported }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl">
        <ExcelImporter
          onCancel={onCancel}
          onQuestionsImported={onQuestionsImported}
        />
      </div>
    </div>
  );
}

export function QuestionBankMaterialGenerateModal({ generateQuestions, onCancel, onQuestionsGenerated }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
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
