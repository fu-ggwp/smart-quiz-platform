import { Search, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  RESULT_VISIBILITY_OPTIONS,
  SORT_OPTIONS,
  STATUS_OPTIONS,
} from "./exam-session-options";

const EMPTY_SELECT_VALUE = "__all__";

function toSelectValue(value) {
  return value || EMPTY_SELECT_VALUE;
}

function fromSelectValue(value) {
  return value === EMPTY_SELECT_VALUE ? "" : value;
}

function SelectField({ id, label, value, onValueChange, options }) {
  return (
    <label htmlFor={id} className="flex flex-col gap-2 text-sm font-bold text-foreground">
      <span>{label}</span>
      <Select value={toSelectValue(value)} onValueChange={(next) => onValueChange(fromSelectValue(next))}>
        <SelectTrigger id={id} className="h-11 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option.value || EMPTY_SELECT_VALUE} value={toSelectValue(option.value)}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
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
        <label htmlFor="exam-search" className="flex flex-col gap-2 text-sm font-bold text-foreground">
          <span>Search Exam Sessions</span>
          <Input
            id="exam-search"
            value={filters.search}
            onChange={(event) => onUpdateFilter("search", event.target.value)}
            placeholder="Exam title, class, status"
            className="h-11"
          />
        </label>

        <SelectField
          id="status-filter"
          label="Status Filter"
          value={filters.status}
          onValueChange={(value) => onUpdateFilter("status", value)}
          options={STATUS_OPTIONS}
        />

        <SelectField
          id="class-filter"
          label="Class Filter"
          value={filters.classId}
          onValueChange={(value) => onUpdateFilter("classId", value)}
          options={[
            { value: "", label: "All classes" },
            ...classOptions.map((classItem) => ({
              value: String(classItem.class_id),
              label: classItem.class_name,
            })),
          ]}
        />

        <Button
          type="button"
          variant="outline"
          onClick={onApply}
          className="h-11 px-5 text-sm font-bold"
        >
          <Search data-icon="inline-start" aria-hidden="true" />
          Apply
        </Button>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-[minmax(180px,292px)_minmax(180px,292px)_1fr] md:items-end">
        <SelectField
          id="visibility-filter"
          label="Result Visibility"
          value={filters.resultVisibility}
          onValueChange={(value) => onUpdateFilter("resultVisibility", value)}
          options={RESULT_VISIBILITY_OPTIONS}
        />

        <SelectField
          id="sort-filter"
          label="Sort By"
          value={filters.sortBy}
          onValueChange={(value) => onUpdateFilter("sortBy", value)}
          options={SORT_OPTIONS}
        />

        <div className="flex justify-start md:justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={onReset}
            className="h-11 px-4 text-sm font-bold"
          >
            <SlidersHorizontal data-icon="inline-start" aria-hidden="true" />
            Reset Filters
          </Button>
        </div>
      </div>
    </section>
  );
}
