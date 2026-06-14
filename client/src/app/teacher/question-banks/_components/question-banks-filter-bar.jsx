import { Search, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const statusOptions = [
  { value: "all", label: "All status" },
  { value: "Private", label: "Private" },
  { value: "Assigned", label: "Assigned" },
  { value: "Archived", label: "Archived" },
];

export function QuestionBanksFilterBar({
  keyword,
  onApply,
  onKeywordChange,
  onReset,
  onStatusChange,
  status,
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-[minmax(240px,1fr)_minmax(150px,190px)_auto_auto]">
        <Field label="Search Question Banks">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-8" onChange={onKeywordChange} placeholder="Title, description, or topic" value={keyword} />
          </div>
        </Field>

        <SelectField label="Status" onChange={onStatusChange} options={statusOptions} value={status} />

        <div className="flex items-end justify-end">
          <Button onClick={onApply} type="button">
            <Search className="size-4" />
            Apply filter
          </Button>
        </div>

        <div className="flex items-end justify-end">
          <Button onClick={onReset} type="button" variant="ghost">
            <SlidersHorizontal className="size-4" />
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({ children, label }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      {children}
    </label>
  );
}

function SelectField({ label, onChange, options, value }) {
  return (
    <Field label={label}>
      <select
        className="h-8 w-full rounded-2xl border border-transparent bg-input/50 px-2.5 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
        onChange={onChange}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}