import { AlertCircle, CheckCircle2, ListChecks, Loader2, Save, Shuffle } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { CheckboxField, SelectField, SelectItem, TextAreaField, TextField } from "./create-exam-fields";
import { formatClassLabel, getQuestionCount, RESULT_VISIBILITY_OPTIONS, STATUS_OPTIONS } from "./create-exam-options";

export function CreateExamForm({
  availableQuestions,
  classes,
  error,
  fieldErrors,
  form,
  isSubmitting,
  onFieldChange,
  onInputChange,
  onOpenQuestionPicker,
  onSelectionModeChange,
  onSubmitExam,
  questionBanks,
  selectedQuestionCount,
  selectedQuestions,
  selectionMode,
  submittingAction,
}) {
  const canPickQuestions = Boolean(form.question_bank_id) && availableQuestions > 0;

  return (
    <form className="flex flex-col gap-5" onSubmit={(event) => event.preventDefault()}>
      <div className="flex flex-col gap-5">
        <Card className="border border-border shadow-sm">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-lg font-semibold">Basic Info</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 lg:grid-cols-2">
            <TextField
              error={fieldErrors.title}
              label="Exam Title"
              name="title"
              onChange={onInputChange}
              placeholder="Biology 12A Midterm"
              value={form.title}
            />
            <SelectField
              error={fieldErrors.class_id}
              label="Class"
              name="class_id"
              onValueChange={onFieldChange}
              placeholder="Select class"
              value={form.class_id}
            >
              {classes.length === 0 ? <SelectItem disabled value="no-classes">No active classes available</SelectItem> : null}
              {classes.map((item) => (
                <SelectItem key={item.class_id} value={item.class_id}>
                  {formatClassLabel(item)}
                </SelectItem>
              ))}
            </SelectField>
            <TextAreaField
              error={fieldErrors.description}
              label="Description"
              name="description"
              onChange={onInputChange}
              placeholder="Optional notes for this exam session"
              value={form.description}
            />
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-lg font-semibold">Question Bank</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5">
            <SelectField
              error={fieldErrors.question_bank_id}
              label="Question Source"
              name="question_bank_id"
              onValueChange={onFieldChange}
              placeholder="Select question bank"
              value={form.question_bank_id}
            >
              {questionBanks.length === 0 ? <SelectItem disabled value="no-question-banks">No question banks available</SelectItem> : null}
              {questionBanks.map((bank) => {
                const count = getQuestionCount(bank);
                return (
                  <SelectItem disabled={count <= 0} key={bank.question_bank_id} value={bank.question_bank_id}>
                    {bank.title} ({count} questions)
                  </SelectItem>
                );
              })}
            </SelectField>

            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => onSelectionModeChange("random")}
                  className={`rounded-2xl border px-4 py-3 text-left transition-colors ${
                    selectionMode === "random" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <Shuffle className="size-4" />
                    Random pick
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Randomly tick questions first, then review them.
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectionModeChange("manual")}
                  className={`rounded-2xl border px-4 py-3 text-left transition-colors ${
                    selectionMode === "manual" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <ListChecks className="size-4" />
                    Manual pick
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Choose exact questions by chapter.
                  </span>
                </button>
              </div>

              <div className="rounded-2xl border border-border p-4">
                {selectionMode === "random" ? (
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                    <TextField
                      error={fieldErrors.question_count}
                      label="Random Question Count"
                      max={availableQuestions || undefined}
                      min="1"
                      name="question_count"
                      onChange={onInputChange}
                      type="number"
                      value={form.question_count}
                    />
                    <Button
                      disabled={!canPickQuestions}
                      onClick={() => onOpenQuestionPicker("random")}
                      type="button"
                    >
                      <Shuffle className="size-4" />
                      Pick Random Questions
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Manual Question Selection</p>
                    </div>
                    <Button
                      disabled={!canPickQuestions}
                      onClick={() => onOpenQuestionPicker("manual")}
                      type="button"
                    >
                      <ListChecks className="size-4" />
                      Choose Questions
                    </Button>
                  </div>
                )}

                <div className="mt-4 rounded-xl bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                  Selected: <span className="font-bold text-foreground">{selectedQuestionCount}</span> questions
                  {selectedQuestions.length ? (
                    <span className="ml-2">
                      ({selectedQuestions.slice(0, 2).map((question) => question.question_text).join("; ")}
                      {selectedQuestions.length > 2 ? "..." : ""})
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-lg font-semibold">Timing & Status</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 lg:grid-cols-2">
            <SelectField error={fieldErrors.status} label="Status" name="status" onValueChange={onFieldChange} value={form.status}>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectField>
            <TextField
              error={fieldErrors.duration_minutes}
              label="Duration Minutes"
              min="1"
              name="duration_minutes"
              onChange={onInputChange}
              type="number"
              value={form.duration_minutes}
            />
            <TextField
              error={fieldErrors.start_at}
              label="Start Time"
              name="start_at"
              onChange={onInputChange}
              type="datetime-local"
              value={form.start_at}
            />
            <TextField
              error={fieldErrors.end_at}
              label="End Time"
              name="end_at"
              onChange={onInputChange}
              type="datetime-local"
              value={form.end_at}
            />
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-lg font-semibold">Rules</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 lg:grid-cols-2">
            <TextField
              error={fieldErrors.attempt_limit}
              label="Allowed Attempts"
              min="1"
              name="attempt_limit"
              onChange={onInputChange}
              type="number"
              value={form.attempt_limit}
            />
            <SelectField
              error={fieldErrors.result_visibility}
              label="Result Visibility"
              name="result_visibility"
              onValueChange={onFieldChange}
              value={form.result_visibility}
            >
              {RESULT_VISIBILITY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectField>
            <TextField
              error={fieldErrors.access_code}
              label="Exam Access Code"
              name="access_code"
              onChange={onInputChange}
              placeholder="Auto-generated if blank"
              value={form.access_code}
            />
            <div className="grid gap-3 lg:col-span-2 sm:grid-cols-2">
              <CheckboxField
                checked={form.randomize_questions}
                label="Randomize Questions"
                onCheckedChange={(checked) => onFieldChange("randomize_questions", Boolean(checked))}
              />
              <CheckboxField
                checked={form.randomize_answers}
                label="Randomize Answers"
                onCheckedChange={(checked) => onFieldChange("randomize_answers", Boolean(checked))}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
        <Button disabled={isSubmitting} onClick={() => onSubmitExam("draft")} type="button" variant="outline">
          {submittingAction === "draft" ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Save data-icon="inline-start" />}
          Save as Draft
        </Button>
        <Button disabled={isSubmitting} onClick={() => onSubmitExam(form.status)} type="button">
          {submittingAction && submittingAction !== "draft" ? (
            <Loader2 className="animate-spin" data-icon="inline-start" />
          ) : (
            <CheckCircle2 data-icon="inline-start" />
          )}
          Create Exam Session
        </Button>
      </div>
    </form>
  );
}
