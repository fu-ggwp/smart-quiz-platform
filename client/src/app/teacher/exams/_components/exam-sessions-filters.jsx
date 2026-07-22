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
  formatClassLabel,
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
    <label htmlFor={id} className="block space-y-1.5">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <Select value={toSelectValue(value)} onValueChange={(next) => onValueChange(fromSelectValue(next))}>
        <SelectTrigger id={id} className="w-full">
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
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-[minmax(240px,1fr)_auto_auto] md:items-end">
        <label
          htmlFor="exam-search"
          className="block space-y-1.5"
        >
          <span className="text-sm font-semibold text-foreground">Search Exam Sessions</span>
          <Input
            id="exam-search"
            value={filters.search}
            onChange={(event) => onUpdateFilter("search", event.target.value)}
            placeholder="Exam title, class, status"
          />
        </label>

        <Button
          type="button"
          onClick={onApply}
          className="w-full md:w-auto"
        >
          <Search data-icon="inline-start" aria-hidden="true" />
          Apply
        </Button>

        <div className="flex items-end md:justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={onReset}
            className="w-full md:w-auto"
          >
            <SlidersHorizontal data-icon="inline-start" aria-hidden="true" />
            Reset Filters
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(150px,180px)_minmax(180px,240px)_minmax(150px,180px)_minmax(150px,180px)]">
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
              label: formatClassLabel(classItem),
            })),
          ]}
        />

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
      </div>
    </section>
  );
}
