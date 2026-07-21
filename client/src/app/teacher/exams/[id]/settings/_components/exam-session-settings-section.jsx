import {
  RESULT_VISIBILITY_OPTIONS,
  formatClassLabel,
  formatDateTime,
  getStatusLabel,
} from "../../../_components/exam-session-options";
import { ListChecks, Shuffle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { editableStatusOptions } from "./exam-settings-utils";
import {
  ReadOnlyField,
  SelectField,
  SelectItem,
  StatusBadge,
  TextAreaField,
  TextField,
  ToggleRow,
} from "./exam-settings-fields";

export function ExamSessionSettingsSection({
  exam,
  form,
  fieldErrors,
  locked,
  saving,
  onFieldChange,
  onOpenQuestionPicker,
  onSelectionModeChange,
  selectedQuestionCount,
  selectedQuestions,
  selectionMode,
}) {
  const disabled = locked || saving;

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-muted-foreground">
          Current status: <StatusBadge status={exam.status} />
        </p>
        <p className="text-sm font-medium text-muted-foreground">Last updated {formatDateTime(exam.updated_at)}</p>
      </div>

      <Card className="border border-border shadow-sm">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-lg font-semibold">Basic Info</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <TextField
            label="Exam Title"
            name="title"
            value={form.title}
            disabled={disabled}
            error={fieldErrors.title}
            onChange={onFieldChange}
          />
          <ReadOnlyField label="Class" value={formatClassLabel(exam.classes)} />
          <TextAreaField
            label="Description"
            name="description"
            value={form.description}
            disabled={disabled}
            onChange={onFieldChange}
            placeholder="Optional notes for this exam session"
          />
        </CardContent>
      </Card>

      <Card className="border border-border shadow-sm">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-lg font-semibold">Question Bank</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5">
          <ReadOnlyField label="Question Source" value={exam.question_bank?.title} />

          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelectionModeChange("random")}
                className={`rounded-2xl border px-4 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                  selectionMode === "random" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                }`}
              >
                <span className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <Shuffle className="size-4" />
                  Random pick
                </span>
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelectionModeChange("manual")}
                className={`rounded-2xl border px-4 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                  selectionMode === "manual" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                }`}
              >
                <span className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <ListChecks className="size-4" />
                  Manual pick
                </span>
              </button>
            </div>

            <div className="rounded-2xl border border-border p-4">
              {selectionMode === "random" ? (
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                  <TextField
                    label="Random Question Count"
                    name="question_count"
                    type="number"
                    min="1"
                    value={form.question_count}
                    disabled={disabled}
                    error={fieldErrors.question_count}
                    onChange={onFieldChange}
                  />
                  <Button disabled={disabled} onClick={() => onOpenQuestionPicker("random")} type="button">
                    <Shuffle className="size-4" />
                    Pick Random Questions
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Manual Question Selection</p>
                  </div>
                  <Button disabled={disabled} onClick={() => onOpenQuestionPicker("manual")} type="button">
                    <ListChecks className="size-4" />
                    Manage Questions
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
              {fieldErrors.question_count ? (
                <p className="mt-2 text-sm font-medium text-error">{fieldErrors.question_count}</p>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border shadow-sm">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-lg font-semibold">Timing & Status</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          {locked ? (
            <ReadOnlyField label="Status" value={getStatusLabel(exam.status)} />
          ) : (
            <SelectField
              label="Status"
              name="status"
              value={form.status}
              disabled={saving}
              error={fieldErrors.status}
              onChange={onFieldChange}
            >
              {editableStatusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectField>
          )}
          <TextField
            label="Duration Minutes"
            name="duration_minutes"
            type="number"
            min="1"
            value={form.duration_minutes}
            disabled={disabled}
            error={fieldErrors.duration_minutes}
            onChange={onFieldChange}
          />
          <TextField
            label="Start Time"
            name="start_at"
            type="datetime-local"
            value={form.start_at}
            disabled={disabled}
            error={fieldErrors.start_at}
            onChange={onFieldChange}
          />
          <TextField
            label="End Time"
            name="end_at"
            type="datetime-local"
            value={form.end_at}
            disabled={disabled}
            error={fieldErrors.end_at}
            onChange={onFieldChange}
          />
        </CardContent>
      </Card>

      <Card className="border border-border shadow-sm">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-lg font-semibold">Rules</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <TextField
            label="Allowed Attempts"
            name="attempt_limit"
            type="number"
            min="1"
            value={form.attempt_limit}
            disabled={disabled}
            error={fieldErrors.attempt_limit}
            onChange={onFieldChange}
          />
          <SelectField
            label="Result Visibility"
            name="result_visibility"
            value={form.result_visibility}
            disabled={disabled}
            error={fieldErrors.result_visibility}
            onChange={onFieldChange}
          >
            {RESULT_VISIBILITY_OPTIONS.filter((option) => option.value).map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectField>
          <TextField
            label="Exam Access Code"
            name="access_code"
            value={form.access_code}
            disabled={disabled}
            error={fieldErrors.access_code}
            onChange={onFieldChange}
          />
          <div className="grid gap-3 md:col-span-2 sm:grid-cols-2">
            <ToggleRow
              label="Randomize Questions"
              name="randomize_questions"
              checked={form.randomize_questions}
              disabled={disabled}
              onChange={onFieldChange}
            />
            <ToggleRow
              label="Randomize Answers"
              name="randomize_answers"
              checked={form.randomize_answers}
              disabled={disabled}
              onChange={onFieldChange}
            />
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
