import { AlertCircle, CheckCircle2, Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";

import { CheckboxField, SelectField, TextAreaField, TextField } from "./create-exam-fields";
import { getQuestionCount, RESULT_VISIBILITY_OPTIONS, STATUS_OPTIONS } from "./create-exam-options";
import { CreateExamSummary } from "./create-exam-summary";

export function CreateExamForm({
  availableQuestions,
  classes,
  error,
  fieldErrors,
  form,
  isSubmitting,
  onFieldChange,
  onInputChange,
  onSubmitExam,
  questionBanks,
  selectedBank,
  submittingAction,
}) {
  return (
    <form className="space-y-5" onSubmit={(event) => event.preventDefault()}>
      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="grid gap-5 lg:grid-cols-2">
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
            onChange={onInputChange}
            value={form.class_id}
          >
            {classes.length === 0 ? <option value="">No active classes available</option> : null}
            {classes.map((item) => (
              <option key={item.class_id} value={item.class_id}>
                {item.class_name}
              </option>
            ))}
          </SelectField>

          <SelectField
            error={fieldErrors.question_bank_id}
            label="Question Source"
            name="question_bank_id"
            onChange={onInputChange}
            value={form.question_bank_id}
          >
            {questionBanks.length === 0 ? <option value="">No question banks available</option> : null}
            {questionBanks.map((bank) => {
              const count = getQuestionCount(bank);
              return (
                <option disabled={count <= 0} key={bank.question_bank_id} value={bank.question_bank_id}>
                  {bank.title} ({count} questions)
                </option>
              );
            })}
          </SelectField>
          <SelectField error={fieldErrors.status} label="Status" name="status" onChange={onInputChange} value={form.status}>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectField>

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
            error={fieldErrors.attempt_limit}
            label="Allowed Attempts"
            min="1"
            name="attempt_limit"
            onChange={onInputChange}
            type="number"
            value={form.attempt_limit}
          />
          <TextField
            error={fieldErrors.question_count}
            label="Question Count"
            max={availableQuestions || undefined}
            min="1"
            name="question_count"
            onChange={onInputChange}
            type="number"
            value={form.question_count}
          />
          <SelectField
            error={fieldErrors.result_visibility}
            label="Result Visibility"
            name="result_visibility"
            onChange={onInputChange}
            value={form.result_visibility}
          >
            {RESULT_VISIBILITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
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
          <TextAreaField
            error={fieldErrors.description}
            label="Description"
            name="description"
            onChange={onInputChange}
            placeholder="Optional notes for this exam session"
            value={form.description}
          />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2">
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
        </div>

        <CreateExamSummary availableQuestions={availableQuestions} selectedBank={selectedBank} />
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
        <Button disabled={isSubmitting} onClick={() => onSubmitExam("draft")} type="button" variant="outline">
          {submittingAction === "draft" ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save as Draft
        </Button>
        <Button disabled={isSubmitting} onClick={() => onSubmitExam(form.status)} type="button">
          {submittingAction && submittingAction !== "draft" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <CheckCircle2 className="size-4" />
          )}
          Create Exam Session
        </Button>
      </div>
    </form>
  );
}
