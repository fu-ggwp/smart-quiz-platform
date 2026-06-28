import { Search } from "lucide-react";
import { statusOptions, sortOptions } from "./attempt-helpers";

export function Filters({ filters, onChange, scoreOptions }) {
  return (
    <section className="rounded-md border border-border bg-card p-4 shadow-sm">
      <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_190px_150px_210px]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className="h-10 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm font-semibold text-foreground outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
            onChange={(event) => onChange((current) => ({ ...current, search: event.target.value }))}
            placeholder="Search learner by name or email"
            value={filters.search}
          />
        </label>
        <select
          aria-label="Score shown"
          className="h-10 rounded-md border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
          onChange={(event) => onChange((current) => ({ ...current, scoreMode: event.target.value }))}
          value={filters.scoreMode}
        >
          {scoreOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Status"
          className="h-10 rounded-md border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
          onChange={(event) => onChange((current) => ({ ...current, status: event.target.value }))}
          value={filters.status}
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Sort"
          className="h-10 rounded-md border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
          onChange={(event) => onChange((current) => ({ ...current, sortBy: event.target.value }))}
          value={filters.sortBy}
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}
