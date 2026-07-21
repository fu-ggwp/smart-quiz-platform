"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppPagination } from "@/components/common/app-pagination";
import { Button } from "@/components/ui/button";
import { examsService } from "@/services/exams.service";

import { ExamFilters } from "./_components/exam-filters";
import { AvailableExamsTable } from "./_components/available-exams-table";
import { CompletedExamsTable } from "./_components/completed-exams-table";

const PAGE_SIZE = 5;
const INITIAL_FILTERS = {
  search: "",
  classId: "",
  sortBy: "latest",
};

const SORT_OPTIONS = [
  { value: "latest", label: "Latest updated" },
  { value: "start_asc", label: "Start time ascending" },
  { value: "start_desc", label: "Start time descending" },
  { value: "title_asc", label: "Exam title A-Z" },
];

const COMPLETED_SORT_OPTIONS = [
  { value: "latest_submitted", label: "Latest submitted" },
  { value: "oldest_submitted", label: "Oldest submitted" },
  { value: "score_desc", label: "Score: High to Low" },
  { value: "title_asc", label: "Exam title A-Z" },
];

function getErrorMessage(error) {
  return error?.response?.data?.error || error?.message || "Unable to load exams. Please try again.";
}

export default function LearnerExamsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get("tab");
  const activeTab = tabParam === "completed" ? "completed" : "available";

  const [filters, setFilters] = useState(() => {
    const defaultSort = activeTab === "available" ? "latest" : "latest_submitted";
    return { ...INITIAL_FILTERS, sortBy: defaultSort };
  });

  const [appliedFilters, setAppliedFilters] = useState(() => {
    const defaultSort = activeTab === "available" ? "latest" : "latest_submitted";
    return { ...INITIAL_FILTERS, sortBy: defaultSort, page: 1, pageSize: PAGE_SIZE };
  });

  const [exams, setExams] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pageSize: PAGE_SIZE, totalPages: 1, classes: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const queryKey = useMemo(() => JSON.stringify(appliedFilters), [appliedFilters]);

  const [prevQueryKey, setPrevQueryKey] = useState(queryKey);
  const [prevActiveTab, setPrevActiveTab] = useState(activeTab);

  if (queryKey !== prevQueryKey || activeTab !== prevActiveTab) {
    setPrevQueryKey(queryKey);
    setPrevActiveTab(activeTab);
    setLoading(true);
    setError("");
  }

  useEffect(() => {
    let ignore = false;

    const fetchPromise = activeTab === "available"
      ? examsService.listAvailable(JSON.parse(queryKey))
      : examsService.listMyAttempts(JSON.parse(queryKey));

    fetchPromise
      .then((result) => {
        if (ignore) return;
        const data = result?.data ?? {};
        setExams(data.items ?? []);
        setMeta({ total: 0, page: 1, pageSize: PAGE_SIZE, totalPages: 1, classes: [], ...data });
      })
      .catch((loadError) => {
        if (ignore) return;
        setError(getErrorMessage(loadError));
        setExams([]);
      })
      .finally(() => {
        if (ignore) return;
        setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [queryKey, activeTab]);

  function handleTabChange(tab) {
    router.replace(`/learner/exams?tab=${tab}`);
    const defaultSort = tab === "available" ? "latest" : "latest_submitted";
    const newFilters = {
      search: "",
      classId: "",
      sortBy: defaultSort,
    };
    setFilters(newFilters);
    setAppliedFilters({ ...newFilters, page: 1, pageSize: PAGE_SIZE });
  }

  function updateFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value }));
  }

  function applyFilters() {
    setAppliedFilters({ ...filters, page: 1, pageSize: PAGE_SIZE });
  }

  function resetFilters() {
    const defaultSort = activeTab === "available" ? "latest" : "latest_submitted";
    const cleared = {
      search: "",
      classId: "",
      sortBy: defaultSort,
    };
    setFilters(cleared);
    setAppliedFilters({ ...cleared, page: 1, pageSize: PAGE_SIZE });
  }

  function goToPage(page) {
    setAppliedFilters((current) => ({ ...current, page, pageSize: PAGE_SIZE }));
  }

  function openExam(examId) {
    router.push(`/learner/exams/${examId}`);
  }

  function viewAttemptDetail(examSessionId, examAttemptId) {
    router.push(`/learner/exams/${examSessionId}/result?attempt=${examAttemptId}`);
  }

  const sortOptions = activeTab === "available" ? SORT_OPTIONS : COMPLETED_SORT_OPTIONS;

  return (
    <main className="min-h-full bg-background px-4 py-5 text-foreground sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="border-b border-border pb-6">
          <h1 className="text-3xl font-bold tracking-normal">My Exams</h1>
        </div>

        {/* Custom Tabs Navigation */}
        <div className="flex gap-2 border-b border-border pb-px">
          <button
            type="button"
            onClick={() => handleTabChange("available")}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${
              activeTab === "available"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Available Exams
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("completed")}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${
              activeTab === "completed"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Completed Exams
          </button>
        </div>

        <ExamFilters
          filters={filters}
          updateFilter={updateFilter}
          classes={meta.classes}
          sortOptions={sortOptions}
          applyFilters={applyFilters}
          resetFilters={resetFilters}
        />

        {error ? <div className="rounded-md border border-error/30 bg-error/10 px-4 py-3 text-sm font-medium text-error">{error}</div> : null}
        {loading ? <div className="rounded-md border border-border bg-card px-4 py-6 text-sm text-muted-foreground">Loading exams...</div> : null}

        {!loading && !error && exams.length === 0 ? (
          <section className="rounded-md border border-dashed border-border bg-card px-4 py-16 text-center">
            <h2 className="text-base font-bold">
              {activeTab === "available" ? "No available exams yet" : "No completed exams yet"}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              {activeTab === "available"
                ? "You do not have any assigned exams. Join a class first, then exams scheduled by your teacher will appear here."
                : "You have not completed any exams yet."}
            </p>
            {activeTab === "available" && (
              <Button className="mt-5" onClick={() => router.push("/learner/classes/join")}>Join a Class</Button>
            )}
          </section>
        ) : null}

        {!loading && !error && exams.length > 0 ? (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {activeTab === "available" ? "Available Exams" : "Completed Exams"}
              </h2>
              <span className="text-sm font-medium text-muted-foreground">
                {meta.total ?? exams.length} {meta.total === 1 ? "exam" : "exams"} shown
              </span>
            </div>

            <section className="overflow-hidden rounded-md border border-border bg-card shadow-sm">
              {activeTab === "available" ? (
                <AvailableExamsTable exams={exams} onOpenExam={openExam} />
              ) : (
                <CompletedExamsTable exams={exams} onViewDetail={viewAttemptDetail} />
              )}
            </section>

            <AppPagination
              currentPage={meta.page}
              totalPages={meta.totalPages}
              onPageChange={goToPage}
            />
          </>
        ) : null}
      </section>
    </main>
  );
}
