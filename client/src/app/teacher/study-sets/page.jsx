"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertCircle, Eye, Layers3, Plus, Search, SlidersHorizontal } from "lucide-react";

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

const subjectOptions = [
  { value: "all", label: "All subjects" },
  { value: "Biology", label: "Biology" },
  { value: "Chemistry", label: "Chemistry" },
  { value: "Mathematics", label: "Mathematics" },
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
  const { studySets, loading, error, reload } = useStudySets({ mine: true });

  const [query, setQuery] = useState("");
  const [visibility, setVisibility] = useState("all");
  const [subject, setSubject] = useState("all");
  const [assignment, setAssignment] = useState("all");
  const [sortBy, setSortBy] = useState("latest");

  const filteredStudySets = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return [...studySets]
      .filter((studySet) => {
        const assignedClasses = getAssignedClasses(studySet);
        const searchText = [
          studySet.title,
          studySet.subject,
          studySet.topic,
          studySet.description,
          studySet.ownerName,
          studySet.teacher_name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchesQuery = !keyword || searchText.includes(keyword);
        const matchesVisibility =
          visibility === "all" || normalizeVisibility(studySet.visibility) === visibility;
        const matchesSubject = subject === "all" || studySet.subject === subject;
        const matchesAssignment =
          assignment === "all" ||
          (assignment === "assigned" && assignedClasses.length > 0) ||
          (assignment === "unassigned" && assignedClasses.length === 0);

        return matchesQuery && matchesVisibility && matchesSubject && matchesAssignment;
      })
      .sort((a, b) => {
        if (sortBy === "name-asc") return (a.title ?? "").localeCompare(b.title ?? "");
        if (sortBy === "name-desc") return (b.title ?? "").localeCompare(a.title ?? "");

        return new Date(b.updated_at ?? b.created_at ?? 0) - new Date(a.updated_at ?? a.created_at ?? 0);
      });
  }, [studySets, query, visibility, subject, assignment, sortBy]);

  function resetFilters() {
    setQuery("");
    setVisibility("all");
    setSubject("all");
    setAssignment("all");
    setSortBy("latest");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl space-y-6">
        <PageHeader />

        <FilterBar
          assignment={assignment}
          onAssignmentChange={setAssignment}
          onQueryChange={setQuery}
          onReset={resetFilters}
          onSortChange={setSortBy}
          onSubjectChange={setSubject}
          onVisibilityChange={setVisibility}
          query={query}
          sortBy={sortBy}
          subject={subject}
          visibility={visibility}
        />

        {loading ? (
          <StatePanel title="Loading study sets" description="Fetching your created study sets." />
        ) : error ? (
          <StatePanel
            action={
              <Button onClick={reload} variant="secondary">
                Try Again
              </Button>
            }
            icon={<AlertCircle className="size-5" />}
            title="Unable to load study sets"
            description="You have not created any study sets. Create one from a question bank when you are ready to assign materials."
          />
        ) : filteredStudySets.length ? (
          <>
            <StudySetsTable studySets={filteredStudySets} />
            <PaginationBar count={filteredStudySets.length} />
          </>
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
    <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">Study Sets</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
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
  onSortChange,
  onSubjectChange,
  onVisibilityChange,
  query,
  sortBy,
  subject,
  visibility,
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-[minmax(240px,1fr)_repeat(2,minmax(170px,220px))_auto]">
          <Field label="Search Study Sets">
            <Input
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Title, subject, topic, owner"
              value={query}
            />
          </Field>

          <SelectField
            label="Visibility"
            onChange={onVisibilityChange}
            options={visibilityOptions}
            value={visibility}
          />

          <SelectField
            label="Subject Filter"
            onChange={onSubjectChange}
            options={subjectOptions}
            value={subject}
          />

          <div className="flex items-end">
            <Button type="button" variant="secondary">
              <Search className="size-4" />
              Apply
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[220px_220px_1fr_auto]">
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

          <div />

          <div className="flex items-end justify-end">
            <Button onClick={onReset} type="button" variant="ghost">
              <SlidersHorizontal className="size-4" />
              Reset Filters
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StudySetsTable({ studySets }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
            <tr>
              {["Study Set", "Source", "Visibility", "Questions", "Assigned Classes", "Learners", "Actions"].map(
                (header) => (
                  <th className="px-4 py-3" key={header}>
                    {header}
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {studySets.map((studySet) => {
              const id = getStudySetId(studySet);
              const assignedClasses = getAssignedClasses(studySet);

              return (
                <tr className="align-top hover:bg-slate-50" key={id}>
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-950">{studySet.title}</p>
                    <p className="text-xs text-slate-500">
                      {studySet.subject || "No subject"} - {studySet.topic || "No topic"}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{getSourceName(studySet)}</td>
                  <td className="px-4 py-3">
                    <VisibilityBadge visibility={studySet.visibility} />
                  </td>
                  <td className="px-4 py-3 text-slate-700">{getQuestionCount(studySet)}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {assignedClasses.length ? assignedClasses.join(", ") : "Not assigned"}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{getLearnerCount(studySet)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/teacher/study-sets/${id}`}>
                          <Eye className="size-4" />
                          Preview
                        </Link>
                      </Button>

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
          : "bg-slate-100 text-slate-700 ring-slate-200";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${toneClass}`}>
      {formatVisibility(visibility)}
    </span>
  );
}

function Field({ children, label }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
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
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
      {icon ? (
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-600">
          {icon}
        </div>
      ) : null}
      <h3 className="text-base font-bold text-slate-950">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

function PaginationBar({ count }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm">
      <span className="font-semibold text-slate-600">Showing {count} study sets</span>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="secondary">
          Previous
        </Button>
        <Button size="sm">1</Button>
        <Button size="sm" variant="secondary">
          2
        </Button>
        <Button size="sm" variant="secondary">
          Next
        </Button>
      </div>
    </div>
  );
}