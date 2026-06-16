"use client";

import { LockKeyhole, Search, SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { examsService } from "@/services/exams.service";

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

function formatDateTime(value) {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not scheduled";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function getErrorMessage(error) {
  return error?.response?.data?.error || error?.message || "Unable to load exams. Please try again.";
}

export default function LearnerExamsPage() {
  const router = useRouter();
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState({ ...INITIAL_FILTERS, page: 1, pageSize: PAGE_SIZE });
  const [exams, setExams] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pageSize: PAGE_SIZE, totalPages: 1, classes: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const queryKey = useMemo(() => JSON.stringify(appliedFilters), [appliedFilters]);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError("");

    examsService
      .listAvailable(JSON.parse(queryKey))
      .then((result) => {
        if (ignore) return;
        const data = result?.data ?? {};
        setExams(data.items ?? []);
        setMeta({ total: 0, page: 1, pageSize: PAGE_SIZE, totalPages: 1, classes: [], ...data });
      })
      .catch((loadError) => {
        if (ignore) return;
        setError(getErrorMessage(loadError));
      })
      .finally(() => {
        if (ignore) return;
        setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [queryKey]);

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

  function openExam(examId) {
    router.push(`/learner/exams/${examId}`);
  }

  return (
    <main className="min-h-screen bg-background px-4 py-5 text-foreground sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="border-b border-border pb-6">
          <h1 className="text-3xl font-bold tracking-normal">Available Exams</h1>
          <p className="mt-2 text-sm text-muted-foreground">Active exams assigned to your classes.</p>
        </div>

        <section className="rounded-md border border-border bg-card p-4 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto]">
            <label className="space-y-2 text-sm font-bold">
              <span>Search Exams</span>
              <input
                value={filters.search}
                onChange={(event) => updateFilter("search", event.target.value)}
                placeholder="Search by title or class"
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
                {(meta.classes ?? []).map((item) => (
                  <option key={item.class_id} value={item.class_id}>{item.class_name}</option>
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
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <div className="flex items-end">
              <Button type="button" variant="outline" onClick={applyFilters}>
                <Search className="size-4" />
                Apply
              </Button>
            </div>
            <div className="flex items-center gap-2 lg:col-span-4">
              <Button type="button" variant="ghost" onClick={resetFilters}>
                <SlidersHorizontal className="size-4" />
                Reset Filters
              </Button>
            </div>
          </div>
        </section>

        {error ? <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</div> : null}
        {loading ? <div className="rounded-md border border-border bg-card px-4 py-6 text-sm text-muted-foreground">Loading exams...</div> : null}

        {!loading && !error && exams.length === 0 ? (
          <section className="rounded-md border border-dashed border-border bg-card px-4 py-16 text-center">
            <h2 className="text-base font-bold">No available exams yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              You do not have any assigned exams. Join a class first, then exams scheduled by your teacher will appear here.
            </p>
            <Button className="mt-5" onClick={() => router.push("/learner/classes/join")}>Join a Class</Button>
          </section>
        ) : null}

        {!loading && !error && exams.length > 0 ? (
          <>
            <section className="overflow-hidden rounded-md border border-border bg-card shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] table-fixed border-collapse text-left text-sm">
                  <thead className="bg-muted text-xs font-bold uppercase text-muted-foreground">
                    <tr>
                      <th className="w-[42%] px-4 py-3">Exam</th>
                      <th className="w-[24%] px-4 py-3">Class</th>
                      <th className="w-[18%] px-4 py-3">Start Time</th>
                      <th className="w-[16%] px-4 py-3 text-center">Tools</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {exams.map((exam) => (
                      <tr
                        key={exam.exam_session_id}
                        className="align-middle transition hover:bg-muted/40"
                      >
                        <td className="px-4 py-4">
                          <div className="truncate font-bold">{exam.title}</div>
                          <div className="mt-1 text-xs font-medium text-muted-foreground">{exam.duration_minutes} minutes</div>
                        </td>
                        <td className="px-4 py-4 font-medium text-muted-foreground">{exam.classes?.class_name ?? "Class"}</td>
                        <td className="px-4 py-4 font-medium text-muted-foreground">{formatDateTime(exam.start_at)}</td>
                        <td className="px-4 py-4 text-center">
                          <Button type="button" variant="outline" size="sm" onClick={() => openExam(exam.exam_session_id)}>
                            <LockKeyhole className="size-4" />
                            Enter Code
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-3 text-sm font-medium text-muted-foreground">
              <span>Showing {exams.length} of {meta.total} available exams</span>
              <div className="flex gap-2">
                <Button variant="outline" disabled={meta.page <= 1} onClick={() => goToPage(meta.page - 1)}>Previous</Button>
                <Button variant="outline" disabled>{meta.page}</Button>
                <Button variant="outline" disabled={meta.page >= meta.totalPages} onClick={() => goToPage(meta.page + 1)}>Next</Button>
              </div>
            </section>
          </>
        ) : null}
      </section>
    </main>
  );
}
