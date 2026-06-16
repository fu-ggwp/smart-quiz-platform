import { RotateCcw, Save } from "lucide-react";

export function ExamSettingsActions({ locked, saving, onCancel }) {
  return (
    <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
      <button
        type="button"
        disabled={saving}
        onClick={onCancel}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-bold hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
      >
        <RotateCcw className="size-4" />
        Cancel
      </button>
      <button
        type="submit"
        disabled={locked || saving}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-primary bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-[color-mix(in_oklch,var(--color-primary),var(--color-foreground)_10%)] disabled:pointer-events-none disabled:opacity-50"
      >
        <Save className="size-4" />
        {saving ? "Saving..." : "Save Exam Settings"}
      </button>
    </div>
  );
}
