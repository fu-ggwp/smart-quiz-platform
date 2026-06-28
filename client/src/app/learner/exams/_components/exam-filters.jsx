import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExamFilters({
  filters,
  updateFilter,
  classes = [],
  sortOptions = [],
  applyFilters,
}) {
  return (
    <section className="rounded-md border border-border bg-card p-4 shadow-sm">
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto]">
        <label className="space-y-2 text-sm font-bold">
          <span>Search Exams</span>
          <input
            value={filters.search}
            onChange={(event) => updateFilter("search", event.target.value)}
            placeholder="Search exams..."
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none"
          />
        </label>
        <label className="space-y-2 text-sm font-bold">
          <span>Class Filter</span>
          <select
            value={filters.classId}
            onChange={(event) => updateFilter("classId", event.target.value)}
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none"
          >
            <option value="">All classes</option>
            {classes.map((item) => (
              <option key={item.class_id || item.class_name} value={item.class_id}>
                {item.class_name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-sm font-bold">
          <span>Sort By</span>
          <select
            value={filters.sortBy}
            onChange={(event) => updateFilter("sortBy", event.target.value)}
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <Button type="button" variant="outline" onClick={applyFilters}>
            <Search className="size-4" />
            Apply
          </Button>
        </div>
      </div>
    </section>
  );
}
