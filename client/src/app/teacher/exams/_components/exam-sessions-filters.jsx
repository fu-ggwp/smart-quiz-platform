import { Search, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  RESULT_VISIBILITY_OPTIONS,
  SORT_OPTIONS,
  STATUS_OPTIONS,
} from "./exam-session-options";

function SelectField({ id, label, value, onChange, children }) {
  return (
    <label htmlFor={id} className="space-y-2 text-sm font-bold text-foreground">
      <span>{label}</span>
      <select
        id={id}
        value={value}
        onChange={onChange}
        className="h-11 w-full rounded-md border border-border bg-card px-4 text-sm font-semibold text-foreground shadow-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
      >
        {children}
      </select>
    </label>
  );
}

export function ExamSessionsFilters({
  classOptions,
  filters,
  onApply,
  onReset,
  onUpdateFilter,
}) {
  return (
    <section className="rounded-md border border-border bg-card p-5 shadow-sm">
      <div className="grid gap-5 lg:grid-cols-[minmax(280px,1fr)_minmax(180px,292px)_minmax(180px,292px)_auto] lg:items-end">
        <label htmlFor="exam-search" className="space-y-2 text-sm font-bold text-foreground">
          <span>Search Exam Sessions</span>
          <Input
            id="exam-search"
            value={filters.search}
            onChange={(event) => onUpdateFilter("search", event.target.value)}
            placeholder="Exam title, class, status"
            className="h-11 rounded-md border-border bg-card px-4 text-sm font-semibold shadow-sm placeholder:font-medium placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/20"
          />
        </label>

        <SelectField
          id="status-filter"
          label="Status Filter"
          value={filters.status}
          onChange={(event) => onUpdateFilter("status", event.target.value)}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectField>

        <SelectField
          id="class-filter"
          label="Class Filter"
          value={filters.classId}
          onChange={(event) => onUpdateFilter("classId", event.target.value)}
        >
          <option value="">All classes</option>
          {classOptions.map((classItem) => (
            <option key={classItem.class_id} value={classItem.class_id}>
              {classItem.class_name}
            </option>
          ))}
        </SelectField>

        <Button
          type="button"
          variant="outline"
          onClick={onApply}
          className="h-11 rounded-md border-border bg-card px-5 text-sm font-bold text-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <Search className="size-5" aria-hidden="true" />
          Apply
        </Button>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-[minmax(180px,292px)_minmax(180px,292px)_1fr] md:items-end">
        <SelectField
          id="visibility-filter"
          label="Result Visibility"
          value={filters.resultVisibility}
          onChange={(event) => onUpdateFilter("resultVisibility", event.target.value)}
        >
          {RESULT_VISIBILITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectField>

        <SelectField
          id="sort-filter"
          label="Sort By"
          value={filters.sortBy}
          onChange={(event) => onUpdateFilter("sortBy", event.target.value)}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectField>

        <div className="flex justify-start md:justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={onReset}
            className="h-11 rounded-md px-4 text-sm font-bold text-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <SlidersHorizontal className="size-5" aria-hidden="true" />
            Reset Filters
          </Button>
        </div>
      </div>
    </section>
  );
}
