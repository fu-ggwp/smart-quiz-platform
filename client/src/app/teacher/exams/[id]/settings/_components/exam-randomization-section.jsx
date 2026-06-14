import { ToggleRow } from "./exam-settings-fields";

export function ExamRandomizationSection({ form, locked, saving, onFieldChange }) {
  return (
    <section className="rounded-md border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="grid gap-3 md:grid-cols-2">
        <ToggleRow
          label="Randomize Questions"
          name="randomize_questions"
          checked={form.randomize_questions}
          disabled={locked || saving}
          onChange={onFieldChange}
        />
        <ToggleRow
          label="Randomize Answers"
          name="randomize_answers"
          checked={form.randomize_answers}
          disabled={locked || saving}
          onChange={onFieldChange}
        />
      </div>
    </section>
  );
}
