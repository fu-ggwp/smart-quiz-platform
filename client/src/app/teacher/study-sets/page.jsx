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
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 10;

  const handleQueryChange = (val) => {
    setQuery(val);
    setCurrentPage(1);
  };
  const handleVisibilityChange = (val) => {
    setVisibility(val);
    setCurrentPage(1);
  };
  const handleSubjectChange = (val) => {
    setSubject(val);
    setCurrentPage(1);
  };
  const handleAssignmentChange = (val) => {
    setAssignment(val);
    setCurrentPage(1);
  };
  const handleSortChange = (val) => {
    setSortBy(val);
    setCurrentPage(1);
  };

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

  const totalPages = Math.ceil(filteredStudySets.length / ITEMS_PER_PAGE);
  const activePage = Math.min(Math.max(1, currentPage), totalPages || 1);

  const paginatedStudySets = useMemo(() => {
    const startIndex = (activePage - 1) * ITEMS_PER_PAGE;
    return filteredStudySets.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredStudySets, activePage]);

  function resetFilters() {
    setQuery("");
    setVisibility("all");
    setSubject("all");
    setAssignment("all");
    setSortBy("latest");
    setCurrentPage(1);
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl space-y-6">
        <PageHeader />

        <FilterBar
          assignment={assignment}
          onAssignmentChange={handleAssignmentChange}
          onQueryChange={handleQueryChange}
          onReset={resetFilters}
          onSortChange={handleSortChange}
          onSubjectChange={handleSubjectChange}
          onVisibilityChange={handleVisibilityChange}
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
        ) : filteredStudySets.length ? (
          <>
            <StudySetsTable studySets={paginatedStudySets} />
            <AppPagination
              currentPage={activePage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
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
  onSortChange,
  onSubjectChange,
  onVisibilityChange,
  query,
  sortBy,
  subject,
  visibility,
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
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

