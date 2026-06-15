"use client";

import Link from "next/link";
import { ArrowLeft, Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const statusOptions = [
  { value: "Private", label: "Private" },
  { value: "Assigned", label: "Assigned" },
];

export function QuestionBankForm({
  actionSlot,
  description,
  error,
  fieldErrors = {},
  form,
  onChange,
  onSubmit,
  submitLabel,
  submitting,
  title,
}) {
  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Button asChild size="sm" variant="ghost" className="mb-3 -ml-3">
              <Link href="/teacher/question-banks">
                <ArrowLeft className="size-4" />
                Back
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          </div>
          {actionSlot}
        </div>

        <form onSubmit={onSubmit} className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <FieldGroup>
            <TextField
              description="Use a clear title so you can find this bank later."
              error={fieldErrors.title}
              label="Title"
              name="title"
              onChange={onChange}
              placeholder="e.g. Grade 10 Algebra - Linear Equations"
              required
              value={form.title}
            />

            <TextAreaField
              description="Optional context for teachers who reuse this bank."
              error={fieldErrors.description}
              label="Description"
              name="description"
              onChange={onChange}
              placeholder="What topics, classes, or exam goals does this bank cover?"
              value={form.description}
            />

            <TextField
              error={fieldErrors.topic}
              label="Topic"
              name="topic"
              onChange={onChange}
              placeholder="e.g. Linear equations"
              value={form.topic}
            />

            <SelectField
              description="Private banks are being prepared. Assigned banks are ready for class and exam workflows."
              error={fieldErrors.status}
              label="Status"
              name="status"
              onChange={onChange}
              options={statusOptions}
              value={form.status}
            />

            {error && <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}

            <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-end">
              <Button asChild variant="outline">
                <Link href="/teacher/question-banks">Cancel</Link>
              </Button>
              <Button disabled={submitting} type="submit">
                {submitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                {submitting ? "Saving..." : submitLabel}
              </Button>
            </div>
          </FieldGroup>
        </form>
      </section>
    </main>
  );
}

function TextField({ description, error, label, name, onChange, required = false, value, ...props }) {
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={name}>
        {label}
        {required && <span className="text-destructive">*</span>}
      </FieldLabel>
      <Input aria-invalid={Boolean(error)} id={name} name={name} onChange={onChange} value={value} {...props} />
      {description && <FieldDescription>{description}</FieldDescription>}
      <FieldError>{error}</FieldError>
    </Field>
  );
}

function TextAreaField({ description, error, label, name, onChange, value, ...props }) {
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <textarea
        aria-invalid={Boolean(error)}
        className={cn(
          "min-h-28 w-full resize-none rounded-2xl border border-transparent bg-input/50 px-2.5 py-2 text-base outline-none transition-[color,box-shadow] duration-200 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm"
        )}
        id={name}
        name={name}
        onChange={onChange}
        value={value}
        {...props}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
      <FieldError>{error}</FieldError>
    </Field>
  );
}

function SelectField({ description, error, label, name, onChange, options, value }) {
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <select
        aria-invalid={Boolean(error)}
        className="h-8 w-full rounded-2xl border border-transparent bg-input/50 px-2.5 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20"
        id={name}
        name={name}
        onChange={onChange}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {description && <FieldDescription>{description}</FieldDescription>}
      <FieldError>{error}</FieldError>
    </Field>
  );
}