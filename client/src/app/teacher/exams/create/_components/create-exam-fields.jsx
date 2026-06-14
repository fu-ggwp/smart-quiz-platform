import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

export function FieldMessage({ error }) {
  if (!error) return null;
  return <p className="text-xs font-medium text-destructive">{error}</p>;
}

export function TextField({ error, label, ...props }) {
  return (
    <label className="space-y-1.5">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <Input aria-invalid={Boolean(error)} {...props} />
      <FieldMessage error={error} />
    </label>
  );
}

export function TextAreaField({ error, label, ...props }) {
  return (
    <label className="space-y-1.5 lg:col-span-2">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <textarea
        aria-invalid={Boolean(error)}
        className="min-h-24 w-full resize-y rounded-2xl border border-transparent bg-input/50 px-3 py-2 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20"
        {...props}
      />
      <FieldMessage error={error} />
    </label>
  );
}

export function SelectField({ children, error, label, ...props }) {
  return (
    <label className="space-y-1.5">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <select
        aria-invalid={Boolean(error)}
        className="h-8 w-full rounded-2xl border border-transparent bg-input/50 px-2.5 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20"
        {...props}
      >
        {children}
      </select>
      <FieldMessage error={error} />
    </label>
  );
}

export function CheckboxField({ checked, label, onCheckedChange }) {
  return (
    <label className="flex min-h-11 items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground">
      <Checkbox checked={checked} onCheckedChange={onCheckedChange} />
      <span>{label}</span>
    </label>
  );
}
