"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AlertCircle, Eye, Layers3, Plus, Search, SlidersHorizontal } from "lucide-react";
import { AppPagination } from "@/components/common/app-pagination";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStudySets } from "@/hooks/use-study-sets";

const visibilityOptions = [
  { value: "all", label: "All visibility" },
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
  { value: "class-only", label: "Class Only" },
  { value: "hidden", label: "Hidden" },
  { value: "archived", label: "Archived" },
];


const assignmentOptions = [
  { value: "all", label: "All assignments" },
  { value: "assigned", label: "Assigned to class" },
  { value: "unassigned", label: "Not assigned" },
];

function normalizeVisibility(value) {
  return value === "class_only" ? "class-only" : value || "private";
}

function formatVisibility(value) {
  const normalized = normalizeVisibility(value);

  if (normalized === "class-only") return "Class Only";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function getStudySetId(studySet) {
  return studySet.study_set_id ?? studySet.id;
}

function getAssignedClasses(studySet) {
  return studySet.assigned_class_ids ?? studySet.assignedClassIds ?? [];
}

function getSourceName(studySet) {
  return (
    studySet.source_question_bank_title ??
    studySet.question_bank_title ??
    studySet.source_question_bank_id ??
    "Manual set"
  );
}

function getQuestionCount(studySet) {
  return studySet.question_count ?? studySet.questionCount ?? 0;
}

function getLearnerCount(studySet) {
  return studySet.learners ?? studySet.learner_count ?? 0;
}

export default function TeacherStudySetsPage() {
  // Pending filters (changed in the UI but not applied yet)
  const [pendingQuery, setPendingQuery] = useState("");
  const [pendingVisibility, setPendingVisibility] = useState("all");
  const [pendingAssignment, setPendingAssignment] = useState("all");
  const [pendingSortBy, setPendingSortBy] = useState("latest");

  // Applied filters (used for query parameters)
  const [appliedQuery, setAppliedQuery] = useState("");
  const [appliedVisibility, setAppliedVisibility] = useState("all");
  const [appliedAssignment, setAppliedAssignment] = useState("all");
  const [appliedSortBy, setAppliedSortBy] = useState("latest");

  const [currentPage, setCurrentPage] = useState(1);

  const params = useMemo(() => ({
    keyword: appliedQuery.trim() || undefined,
    visibility: appliedVisibility === "all" ? undefined : appliedVisibility,
    assignment: appliedAssignment === "all" ? undefined : appliedAssignment,
    sortBy: appliedSortBy,
    page: currentPage,
    limit: 10,
  }), [appliedQuery, appliedVisibility, appliedAssignment, appliedSortBy, currentPage]);

  const { studySets, pagination, loading, error } = useStudySets({
    mine: true,
    params,
  });

  const totalPages = pagination?.totalPages ?? 1;
  const activePage = pagination?.page ?? 1;

  function applyFilters() {
    setAppliedQuery(pendingQuery);
    setAppliedVisibility(pendingVisibility);
    setAppliedAssignment(pendingAssignment);
    setAppliedSortBy(pendingSortBy);
    setCurrentPage(1);
  }

  function resetFilters() {
    setPendingQuery("");
    setPendingVisibility("all");
    setPendingAssignment("all");
    setPendingSortBy("latest");

    setAppliedQuery("");
    setAppliedVisibility("all");
    setAppliedAssignment("all");
    setAppliedSortBy("latest");

    setCurrentPage(1);
  }

  const hasFiltersApplied = appliedQuery || appliedVisibility !== "all" || appliedAssignment !== "all";

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl space-y-6">
        <PageHeader />

        <FilterBar
          assignment={pendingAssignment}
          onAssignmentChange={setPendingAssignment}
          onQueryChange={setPendingQuery}
          onReset={resetFilters}
          onApply={applyFilters}
          onSortChange={setPendingSortBy}
          onVisibilityChange={setPendingVisibility}
          query={pendingQuery}
          sortBy={pendingSortBy}
          visibility={pendingVisibility}
        />

        {loading ? (
          <StatePanel title="Loading study sets" description="Fetching your created study sets." />
        ) : error ? (
          <StatePanel
            action={
              <Button asChild>
                <Link href="/teacher/study-sets/create">
                  <Plus className="size-4" />
                  Create Study Set
                </Link>
              </Button>
            }
            icon={<AlertCircle className="size-5" />}
            title="Unable to load study sets"
            description="You have not created any study sets. Create one from a question bank when you are ready to assign materials."
          />
        ) : studySets.length ? (
          <>
            <StudySetsTable studySets={studySets} />
            <AppPagination
              currentPage={activePage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        ) : hasFiltersApplied ? (
          <StatePanel
            action={
              <Button onClick={resetFilters} type="button">
                Clear Filters
              </Button>
            }
            icon={<Search className="size-5" />}
            title="No study sets match your search"
            description="Try modifying your search queries or resetting all filters."
          />
        ) : (
          <StatePanel
            action={
              <Button asChild>
                <Link href="/teacher/study-sets/create">
                  <Plus className="size-4" />
                  Create Study Set
                </Link>
              </Button>
            }
            icon={<Layers3 className="size-5" />}
            title="No study sets yet"
            description="Create one from a question bank when you are ready to assign materials."
          />
        )}
      </section>
    </main>
  );

}

function PageHeader() {
  return (
    <div className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Study Sets</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Manage study sets created from question banks, check visibility, assigned classes, and learner activity.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/teacher/study-sets/create">
            <Plus className="size-4" />
            Create Study Set
          </Link>
        </Button>
      </div>
    </div>
  );
}

function FilterBar({
  assignment,
  onAssignmentChange,
  onQueryChange,
  onReset,
  onApply,
  onSortChange,
  onVisibilityChange,
  query,
  sortBy,
  visibility,
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="space-y-4">
        {/* Row 1: Search and Action Buttons */}
        <div className="grid gap-4 md:grid-cols-[1fr_auto_auto]">
          <Field label="Search Study Sets">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-8"
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder="Title, subject, topic, owner"
                value={query}
              />
            </div>
          </Field>

          <div className="flex items-end">
            <Button onClick={onApply} type="button">
              <Search className="size-4" />
              Apply filter
            </Button>
          </div>

          <div className="flex items-end">
            <Button onClick={onReset} type="button" variant="ghost">
              <SlidersHorizontal className="size-4" />
              Reset Filters
            </Button>
          </div>
        </div>

        {/* Row 2: Visibility, Assignment, and Sorting */}
        <div className="grid gap-4 md:grid-cols-3">
          <SelectField
            label="Visibility"
            onChange={onVisibilityChange}
            options={visibilityOptions}
            value={visibility}
          />

          <SelectField
            label="Assignment Filter"
            onChange={onAssignmentChange}
            options={assignmentOptions}
            value={assignment}
          />

          <SelectField
            label="Sort By"
            onChange={onSortChange}
            options={[
              { value: "latest", label: "Latest updated" },
              { value: "name-asc", label: "Name A-Z" },
              { value: "name-desc", label: "Name Z-A" },
            ]}
            value={sortBy}
          />
        </div>
      </div>
    </div>
  );
}

function StudySetsTable({ studySets }) {
  const router = useRouter();

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-muted text-left text-xs font-bold uppercase tracking-wide text-muted-foreground">
            <tr>
              {["Study Set", "Source", "Visibility", "Questions", "Assigned Classes", "Learners", "Actions"].map(
                (header) => {
                  const isCentered = ["Questions", "Assigned Classes", "Learners"].includes(header);
                  return (
                    <th className={`px-4 py-3 ${isCentered ? "text-center" : ""}`} key={header}>
                      {header}
                    </th>
                  );
                }
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {studySets.map((studySet) => {
              const id = getStudySetId(studySet);
              const assignedClasses = getAssignedClasses(studySet);

              return (
                <tr
                  className="align-middle hover:bg-muted/55 cursor-pointer transition-colors duration-150"
                  key={id}
                  onClick={() => router.push(`/teacher/study-sets/${id}`)}
                >
                  <td className="px-4 py-3">
                    <p className="font-bold text-foreground hover:text-primary transition-colors">{studySet.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {studySet.subject || "No subject"} - {studySet.topic || "No topic"}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{getSourceName(studySet)}</td>
                  <td className="px-4 py-3">
                    <VisibilityBadge visibility={studySet.visibility} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-center">{getQuestionCount(studySet)}</td>
                  <td className="px-4 py-3 text-muted-foreground text-center">
                    {assignedClasses.length ? assignedClasses.join(", ") : "Not assigned"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-center">{getLearnerCount(studySet)}</td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-wrap gap-2">
                      <Button asChild size="sm">
                        <Link href={`/teacher/study-sets/${id}/assign`}>Assign</Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function VisibilityBadge({ visibility }) {
  const normalized = normalizeVisibility(visibility);

  const toneClass =
    normalized === "public"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
      : normalized === "class-only"
        ? "bg-amber-50 text-amber-700 ring-amber-100"
        : normalized === "archived" || normalized === "hidden"
          ? "bg-rose-50 text-rose-700 ring-rose-100"
          : "bg-muted text-muted-foreground ring-border";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${toneClass}`}>
      {formatVisibility(visibility)}
    </span>
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
        onChange={(event) => onChange(event.target.value)}
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

function StatePanel({ action, description, icon, title }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
      {icon ? (
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {icon}
        </div>
      ) : null}
      <h3 className="text-base font-bold text-foreground">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

