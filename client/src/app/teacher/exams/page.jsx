"use client";

import Link from "next/link";
import { Plus, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useExams } from "@/hooks/use-exams";

const PAGE_SIZE = 5;

const INITIAL_FILTERS = {
  search: "",
  status: "",
  classId: "",
  resultVisibility: "",
  sortBy: "latest",
};

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Scheduled" },
  { value: "active", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "archived", label: "Archived" },
];

const RESULT_VISIBILITY_OPTIONS = [
  { value: "", label: "All visibility" },
  { value: "score_only", label: "Score only" },
  { value: "completion_only", label: "Completion only" },
];

const SORT_OPTIONS = [
  { value: "latest", label: "Latest updated" },
  { value: "start_asc", label: "Start time ascending" },
  { value: "start_desc", label: "Start time descending" },
  { value: "title_asc", label: "Exam title A-Z" },
];

const STATUS_STYLES = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  published: "border-amber-200 bg-amber-50 text-amber-700",
  draft: "border-slate-200 bg-slate-50 text-slate-600",
  closed: "border-rose-200 bg-rose-50 text-rose-700",
  archived: "border-zinc-200 bg-zinc-50 text-zinc-600",
};

const STATUS_LABELS = {
  active: "open",
  published: "scheduled",
  draft: "draft",
  closed: "closed",
  archived: "archived",
};

function formatDateTime(value) {
  if (!value) {
    return "Not scheduled";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not scheduled";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function getVisiblePages(totalPages) {
  return Array.from({ length: totalPages }, (_, index) => index + 1).slice(0, 5);
}

function SelectField({ id, label, value, onChange, children }) {
  return (
    <label htmlFor={id} className="space-y-2 text-sm font-semibold text-slate-700">
      <span>{label}</span>
      <select
        id={id}
        value={value}
        onChange={onChange}
        className="h-12 w-full rounded-md border border-slate-200 bg-white px-4 text-base text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
      >
        {children}
      </select>
    </label>
  );
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-sm font-bold ${
        STATUS_STYLES[status] ?? STATUS_STYLES.draft
      }`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function ActionLink({ href, children, primary = false }) {
  return (
    <Link
      href={href}
      className={`inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-semibold transition ${
        primary
          ? "border-teal-600 bg-teal-600 text-white hover:bg-teal-700"
          : "border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      {children}
    </Link>
  );
}

export default function TeacherExamsPage() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState({
    ...INITIAL_FILTERS,
    page: 1,
    pageSize: PAGE_SIZE,
  });

  const queryParams = useMemo(() => appliedFilters, [appliedFilters]);
  const { exams, meta, loading, error } = useExams({ params: queryParams });

  const classOptions = meta.classes ?? [];
  const visiblePages = getVisiblePages(meta.totalPages ?? 1);
  const showingText =
    meta.total === exams.length
      ? `Showing ${meta.total} exam sessions`
      : `Showing ${exams.length} of ${meta.total} exam sessions`;

  function updateFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value }));
  }

  function applyFilters() {
    setAppliedFilters({ ...filters, page: 1, pageSize: PAGE_SIZE });
  }

  function resetFilters() {
    setFilters(INITIAL_FILTERS);
    setAppliedFilters({ ...INITIAL_FILTERS, page: 1, pageSize: PAGE_SIZE });
  }

  function goToPage(page) {
    setAppliedFilters((current) => ({ ...current, page, pageSize: PAGE_SIZE }));
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-5 text-slate-950 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl space-y-7">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-7 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-normal text-slate-950">Exam Sessions</h1>
            <p className="mt-3 text-base text-slate-600">
              Teacher views official exam sessions and manages configuration or monitoring.
            </p>
          </div>
          <Button asChild className="h-12 rounded-md bg-teal-600 px-5 text-base font-bold hover:bg-teal-700">
            <Link href="/teacher/exams/create">
              <Plus className="size-5" aria-hidden="true" />
              Create Exam Session
            </Link>
          </Button>
        </header>

        <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-5 lg:grid-cols-[minmax(280px,1fr)_minmax(180px,292px)_minmax(180px,292px)_auto] lg:items-end">
            <label htmlFor="exam-search" className="space-y-2 text-sm font-semibold text-slate-700">
              <span>Search Exam Sessions</span>
              <Input
                id="exam-search"
                value={filters.search}
                onChange={(event) => updateFilter("search", event.target.value)}
                placeholder="Exam title, class, status"
                className="h-12 rounded-md border-slate-200 bg-white px-4 text-base shadow-sm placeholder:text-slate-400 focus-visible:border-teal-500 focus-visible:ring-teal-100"
              />
            </label>

            <SelectField
              id="status-filter"
              label="Status Filter"
              value={filters.status}
              onChange={(event) => updateFilter("status", event.target.value)}
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
              onChange={(event) => updateFilter("classId", event.target.value)}
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
              onClick={applyFilters}
              className="h-12 rounded-md border-slate-200 bg-white px-5 text-base font-bold text-slate-800 hover:bg-slate-50"
            >
              <Search className="size-5" aria-hidden="true" />
              Apply
            </Button>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-[292px_292px_1fr] md:items-end">
            <SelectField
              id="visibility-filter"
              label="Result Visibility"
              value={filters.resultVisibility}
              onChange={(event) => updateFilter("resultVisibility", event.target.value)}
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
              onChange={(event) => updateFilter("sortBy", event.target.value)}
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
                onClick={resetFilters}
                className="h-12 rounded-md px-4 text-base font-bold text-slate-700 hover:bg-slate-50"
              >
                <SlidersHorizontal className="size-5" aria-hidden="true" />
                Reset Filters
              </Button>
            </div>
          </div>
        </section>

        {error ? (
          <section className="rounded-md border border-rose-200 bg-rose-50 p-6 text-rose-700">
            Unable to load exam sessions. Please refresh and try again.
          </section>
        ) : null}

        {loading ? (
          <section className="rounded-md border border-slate-200 bg-white p-8 text-center text-slate-600">
            Loading exam sessions...
          </section>
        ) : null}

        {!loading && !error && exams.length === 0 ? (
          <section className="rounded-md border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
            <h2 className="text-lg font-bold text-slate-950">No exam sessions yet</h2>
            <p className="mx-auto mt-3 max-w-md text-base leading-6 text-slate-500">
              You have not created any exam sessions. Create a class and question bank first, then schedule an exam.
            </p>
            <Button asChild className="mt-6 h-12 rounded-md bg-teal-600 px-5 text-base font-bold hover:bg-teal-700">
              <Link href="/teacher/exams/create">Create Exam Session</Link>
            </Button>
          </section>
        ) : null}

        {!loading && !error && exams.length > 0 ? (
          <>
            <section className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] border-collapse text-left">
                  <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                    <tr>
                      <th className="w-[32%] px-5 py-4">Exam</th>
                      <th className="w-[16%] px-5 py-4">Class</th>
                      <th className="w-[14%] px-5 py-4">Start Time</th>
                      <th className="w-[10%] px-5 py-4">Status</th>
                      <th className="px-5 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {exams.map((exam) => (
                      <tr key={exam.exam_session_id} className="align-middle">
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-950">{exam.title}</div>
                          <div className="mt-1 text-sm text-slate-500">
                            {exam.description || "No description provided."}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {exam.classes?.class_name ?? "Unassigned class"}
                        </td>
                        <td className="px-5 py-4 text-slate-600">{formatDateTime(exam.start_at)}</td>
                        <td className="px-5 py-4">
                          <StatusBadge status={exam.status} />
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-2">
                            <ActionLink href={`/teacher/exams/${exam.exam_session_id}`}>Info</ActionLink>
                            <ActionLink href={`/teacher/exams/${exam.exam_session_id}/settings`}>
                              Configure
                            </ActionLink>
                            <ActionLink href={`/teacher/analytics?exam=${exam.exam_session_id}`}>Report</ActionLink>
                            <ActionLink href={`/teacher/exams/${exam.exam_session_id}/monitor`} primary>
                              Monitor
                            </ActionLink>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <footer className="flex flex-col gap-4 rounded-md border border-slate-200 bg-white px-5 py-4 text-slate-700 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-base font-semibold">{showingText}</div>
              <nav className="flex items-center gap-2" aria-label="Exam sessions pagination">
                <button
                  type="button"
                  onClick={() => goToPage(Math.max((meta.page ?? 1) - 1, 1))}
                  disabled={(meta.page ?? 1) <= 1}
                  className="h-10 rounded-md border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                {visiblePages.map((page) => (
                  <button
                    type="button"
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`h-10 min-w-10 rounded-md border px-3 text-sm font-bold transition ${
                      page === meta.page
                        ? "border-teal-600 bg-teal-600 text-white"
                        : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => goToPage(Math.min((meta.page ?? 1) + 1, meta.totalPages ?? 1))}
                  disabled={(meta.page ?? 1) >= (meta.totalPages ?? 1)}
                  className="h-10 rounded-md border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </footer>
          </>
        ) : null}
      </section>
    </main>
  );
}
