import {
  RESULT_VISIBILITY_OPTIONS,
  formatDateTime,
  getStatusLabel,
} from "../../../_components/exam-session-options";
import { editableStatusOptions } from "./exam-settings-utils";
import { FieldError, ReadOnlyField, StatusBadge, TextField } from "./exam-settings-fields";

export function ExamSessionSettingsSection({
  exam,
  form,
  fieldErrors,
  locked,
  saving,
  onFieldChange,
}) {
  return (
    <section className="rounded-md border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-foreground">Exam Session</h2>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            Current status: <StatusBadge status={exam.status} />
          </p>
        </div>
        <div className="text-sm font-medium text-muted-foreground">
          Last updated {formatDateTime(exam.updated_at)}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label="Exam Title"
          name="title"
          value={form.title}
          disabled={locked || saving}
          error={fieldErrors.title}
          onChange={onFieldChange}
        />
        <ReadOnlyField label="Class" value={exam.classes?.class_name} />
        <ReadOnlyField label="Question Source" value={exam.question_bank?.title} />
        {locked ? (
          <ReadOnlyField label="Status" value={getStatusLabel(exam.status)} />
        ) : (
          <label className="space-y-2 text-sm font-bold text-foreground">
            <span>Status</span>
            <select
              value={form.status}
              disabled={saving}
              aria-invalid={Boolean(fieldErrors.status)}
              onChange={(event) => onFieldChange("status", event.target.value)}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20"
            >
              {editableStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <FieldError message={fieldErrors.status} />
          </label>
        )}
        <TextField
          label="Start Time"
          name="start_at"
          type="datetime-local"
          value={form.start_at}
          disabled={locked || saving}
          error={fieldErrors.start_at}
          onChange={onFieldChange}
        />
        <TextField
          label="End Time"
          name="end_at"
          type="datetime-local"
          value={form.end_at}
          disabled={locked || saving}
          error={fieldErrors.end_at}
          onChange={onFieldChange}
        />
        <TextField
          label="Duration Minutes"
          name="duration_minutes"
          type="number"
          min="1"
          value={form.duration_minutes}
          disabled={locked || saving}
          error={fieldErrors.duration_minutes}
          onChange={onFieldChange}
        />
        <TextField
          label="Allowed Attempts"
          name="attempt_limit"
          type="number"
          min="1"
          value={form.attempt_limit}
          disabled={locked || saving}
          error={fieldErrors.attempt_limit}
          onChange={onFieldChange}
        />
        <TextField
          label="Question Count"
          name="question_count"
          type="number"
          min="1"
          value={form.question_count}
          disabled={locked || saving}
          error={fieldErrors.question_count}
          onChange={onFieldChange}
        />
        <label className="space-y-2 text-sm font-bold text-foreground">
          <span>Result Visibility</span>
          <select
            value={form.result_visibility}
            disabled={locked || saving}
            aria-invalid={Boolean(fieldErrors.result_visibility)}
            onChange={(event) => onFieldChange("result_visibility", event.target.value)}
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20"
          >
            {RESULT_VISIBILITY_OPTIONS.filter((option) => option.value).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <FieldError message={fieldErrors.result_visibility} />
        </label>
        <TextField
          label="Exam Access Code"
          name="access_code"
          value={form.access_code}
          disabled={locked || saving}
          error={fieldErrors.access_code}
          onChange={onFieldChange}
        />
      </div>

      <label className="mt-4 block space-y-2 text-sm font-bold text-foreground">
        <span>Description</span>
        <textarea
          value={form.description}
          disabled={locked || saving}
          onChange={(event) => onFieldChange("description", event.target.value)}
          className="min-h-24 w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
          placeholder="Optional notes for this exam session"
        />
      </label>
    </section>
  );
}
