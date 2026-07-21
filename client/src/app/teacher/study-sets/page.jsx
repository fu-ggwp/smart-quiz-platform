"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AlertCircle, Eye, Layers3, Plus, Search, SlidersHorizontal, Users } from "lucide-react";
import { AppPagination } from "@/components/common/app-pagination";
import { studySetsService } from "@/services/study-sets.service";
import ClassSelectorModal from "./create/class-selector-modal";
import ConfirmModal from "@/components/common/confirm-modal";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStudySets } from "@/hooks/use-study-sets";

const visibilityOptions = [
  { value: "all", label: "All visibility" },
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
  { value: "class-only", label: "Class Only" },
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
  const [pendingKeyword, setPendingKeyword] = useState("");
  const [pendingVisibility, setPendingVisibility] = useState("all");

  const [activeAssignSet, setActiveAssignSet] = useState(null);
  const [assignLoadingId, setAssignLoadingId] = useState(null);
  const [selectedClassIds, setSelectedClassIds] = useState([]);

  const [confirmData, setConfirmData] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    onCancel: null,
  });


  // Applied filters (used for query parameters)
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [appliedVisibility, setAppliedVisibility] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);

  const params = useMemo(() => ({
    keyword: appliedKeyword.trim() || undefined,
    visibility: appliedVisibility === "all" ? undefined : appliedVisibility,
    page: currentPage,
    limit: 10,
  }), [appliedKeyword, appliedVisibility, currentPage]);

  const { studySets, pagination, loading, error, reload } = useStudySets({
    mine: true,
    params,
  });

  const totalPages = pagination?.totalPages ?? 1;
  const activePage = pagination?.page ?? 1;

  function applyFilters() {
    setAppliedKeyword(pendingKeyword);
    setAppliedVisibility(pendingVisibility);
    setCurrentPage(1);
  }

  function resetFilters() {
    setPendingKeyword("");
    setPendingVisibility("all");

    setAppliedKeyword("");
    setAppliedVisibility("all");

    setCurrentPage(1);
  }

  const handleAssignClick = async (studySet) => {
    const studySetId = getStudySetId(studySet);

    const proceedWithAssign = async () => {
      setAssignLoadingId(studySetId);
      try {
        const res = await studySetsService.getOne(studySetId);
        const data = res.data || null;
        if (data) {
          const assignments = data.study_set_assignments || [];
          const classIds = assignments.map((a) => a.class_id);
          setSelectedClassIds(classIds);
          setActiveAssignSet(studySet);
        }
      } catch (err) {
        console.error("Failed to load assignments:", err);
      } finally {
        setAssignLoadingId(null);
      }
    };

    if (studySet.visibility === "private") {
      setConfirmData({
        isOpen: true,
        title: "Change Visibility to Class Only",
        message: "Assigning this study set to a class will change its visibility to 'Class Only'. Do you want to proceed?",
        onConfirm: () => {
          setConfirmData((prev) => ({ ...prev, isOpen: false }));
          proceedWithAssign();
        },
        onCancel: () => {
          setConfirmData((prev) => ({ ...prev, isOpen: false }));
        },
      });
    } else {
      await proceedWithAssign();
    }
  };

  const handleAssignConfirm = async (ids) => {
    if (!activeAssignSet) return;
    const studySetId = getStudySetId(activeAssignSet);
    const isClearingClassOnly = activeAssignSet.visibility === "class_only" && ids.length === 0;

    try {
      const payload = { classId: ids };
      if (activeAssignSet.visibility === "private" && ids.length > 0) {
        payload.visibility = "class_only";
      } else if (isClearingClassOnly) {
        payload.visibility = "private";
      }

      await studySetsService.update(studySetId, payload);
      setActiveAssignSet(null);
      reload();
    } catch (err) {
      console.error("Failed to update assignments:", err);
    }
  };

  const hasFiltersApplied = appliedKeyword || appliedVisibility !== "all";

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl space-y-6">
        <PageHeader />

        <FilterBar
          keyword={pendingKeyword}
          onApply={applyFilters}
          onKeywordChange={(event) => setPendingKeyword(event.target.value)}
          onReset={resetFilters}
          onVisibilityChange={setPendingVisibility}
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
            <StudySetsTable
              studySets={studySets}
              onAssignClick={handleAssignClick}
              assignLoadingId={assignLoadingId}
            />
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
      {activeAssignSet && (
        <ClassSelectorModal
          initialSelectedIds={selectedClassIds}
          onConfirm={handleAssignConfirm}
          onCancel={() => setActiveAssignSet(null)}
        />
      )}
      <ConfirmModal
        isOpen={confirmData.isOpen}
        title={confirmData.title}
        message={confirmData.message}
        onConfirm={confirmData.onConfirm}
        onCancel={confirmData.onCancel}
      />
    </main>
  );

}

function PageHeader() {
  return (
    <div className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Study Sets</h1>
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
  keyword,
  onApply,
  onKeywordChange,
  onReset,
  onVisibilityChange,
  visibility,
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-[minmax(240px,1fr)_minmax(150px,190px)_auto_auto]">
        <Field label="Search Study Sets">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-8"
              onChange={onKeywordChange}
              placeholder="Title, subject, owner"
              value={keyword}
            />
          </div>
        </Field>

        <SelectField
          label="Visibility"
          onChange={onVisibilityChange}
          options={visibilityOptions}
          value={visibility}
        />

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

function StudySetsTable({ studySets, onAssignClick, assignLoadingId }) {
  const router = useRouter();

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-muted text-left text-xs font-bold uppercase tracking-wide text-muted-foreground">
            <tr>
              {["Study Set", "Source", "Visibility", "Questions", "Learners", "Actions"].map(
                (header) => {
                  const isCentered = ["Questions", "Learners", "Visibility"].includes(header);
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

              return (
                <tr
                  className="align-middle hover:bg-muted/55 cursor-pointer transition-colors duration-150"
                  key={id}
                  onClick={() => router.push(`/teacher/study-sets/${id}`)}
                >
                  <td className="px-4 py-3 max-w-[200px] md:max-w-[320px]">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-foreground hover:text-primary transition-colors truncate" title={studySet.title}>{studySet.title}</p>
                      {studySet.study_set_materials && studySet.study_set_materials.length > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded" title={`${studySet.study_set_materials.length} material(s) attached`}>
                          📎 {studySet.study_set_materials.length}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {studySet.subject || "No subject"}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{getSourceName(studySet)}</td>
                  <td className="px-4 py-3 text-center">
                    <VisibilityBadge visibility={studySet.visibility} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-center">{getQuestionCount(studySet)}</td>
                  <td className="px-4 py-3 text-muted-foreground text-center">{getLearnerCount(studySet)}</td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() => onAssignClick(studySet)}
                        disabled={assignLoadingId === id}
                      >
                        {assignLoadingId === id ? "Loading..." : "Assign"}
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
      ? "bg-success/10 text-success ring-success/20"
      : normalized === "class-only"
        ? "bg-warning/10 text-warning ring-warning/20"
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

