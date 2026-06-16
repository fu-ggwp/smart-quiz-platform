import { getStatusClassName, getStatusLabel } from "../../../_components/exam-session-options";

export function FieldError({ message }) {
  if (!message) return null;
  return <p className="text-xs font-medium text-destructive">{message}</p>;
}

export function TextField({ label, name, value, onChange, error, disabled, type = "text", min }) {
  return (
    <label className="space-y-2 text-sm font-bold text-foreground">
      <span>{label}</span>
      <input
        name={name}
        type={type}
        min={min}
        value={value}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(name, event.target.value)}
        className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20"
      />
      <FieldError message={error} />
    </label>
  );
}

export function ReadOnlyField({ label, value }) {
  return (
    <div className="space-y-2 text-sm font-bold text-foreground">
      <span>{label}</span>
      <div className="flex h-10 items-center rounded-md border border-border bg-muted px-3 text-sm font-medium text-muted-foreground">
        <span className="truncate">{value || "Not set"}</span>
      </div>
    </div>
  );
}

export function ToggleRow({ label, name, checked, onChange, disabled }) {
  return (
    <label className="flex h-12 items-center gap-3 rounded-md border border-border bg-background px-3 text-sm font-bold text-foreground">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(name, event.target.checked)}
        className="size-4 accent-primary disabled:cursor-not-allowed"
      />
      <span>{label}</span>
    </label>
  );
}

export function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold leading-none ${getStatusClassName(
        status
      )}`}
    >
      {getStatusLabel(status)}
    </span>
  );
}
