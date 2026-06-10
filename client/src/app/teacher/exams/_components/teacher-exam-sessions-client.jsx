"use client";

import { useMemo, useState } from "react";

import { useExams } from "@/hooks/use-exams";

import { ExamSessionsEmptyState, ExamSessionsError, ExamSessionsLoading } from "./exam-sessions-state";
import { ExamSessionsFilters } from "./exam-sessions-filters";
import { ExamSessionsPagination } from "./exam-sessions-pagination";
import { ExamSessionsTable } from "./exam-sessions-table";
import { getVisiblePages, INITIAL_FILTERS, PAGE_SIZE } from "./exam-session-options";

export function TeacherExamSessionsClient() {
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
    <>
      <ExamSessionsFilters
        classOptions={classOptions}
        filters={filters}
        onApply={applyFilters}
        onReset={resetFilters}
        onUpdateFilter={updateFilter}
      />

      {error ? <ExamSessionsError /> : null}
      {loading ? <ExamSessionsLoading /> : null}
      {!loading && !error && exams.length === 0 ? <ExamSessionsEmptyState /> : null}

      {!loading && !error && exams.length > 0 ? (
        <>
          <ExamSessionsTable exams={exams} />
          <ExamSessionsPagination
            meta={meta}
            showingText={showingText}
            visiblePages={visiblePages}
            onGoToPage={goToPage}
          />
        </>
      ) : null}
    </>
  );
}
