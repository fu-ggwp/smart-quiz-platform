import { FileSpreadsheet, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExportMenu({ open, options, onChange, onClose, onExport }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-neutral/40 px-4 py-6">
      <section className="w-full max-w-xl rounded-md border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
          <h2 className="inline-flex items-center gap-2 text-base font-bold text-foreground">
            <FileSpreadsheet className="size-4 text-success" />
            Export results
          </h2>
          <Button size="sm" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="space-y-4 px-5 py-4">
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <input
                checked={options.mode === "current"}
                className="size-4 accent-info"
                name="export-mode"
                onChange={() => onChange((current) => ({ ...current, mode: "current" }))}
                type="radio"
              />
              Export current scoreboard view
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <input
                checked={options.mode === "all"}
                className="size-4 accent-info"
                name="export-mode"
                onChange={() => onChange((current) => ({ ...current, mode: "all" }))}
                type="radio"
              />
              Export all attempts
            </label>
          </div>
          <div className="grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
            <label className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <input
                checked={options.includeTime}
                className="size-4 accent-info"
                onChange={(event) => onChange((current) => ({ ...current, includeTime: event.target.checked }))}
                type="checkbox"
              />
              Include time spent
            </label>
            <label className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <input
                checked={options.includeWarnings}
                className="size-4 accent-info"
                onChange={(event) => onChange((current) => ({ ...current, includeWarnings: event.target.checked }))}
                type="checkbox"
              />
              Include warnings
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onExport}>
            <Download data-icon="inline-start" />
            Export
          </Button>
        </div>
      </section>
    </div>
  );
}
