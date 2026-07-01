"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { questionBanksService } from "@/services/question-banks.service";

const itemsPerPage = 10;
const defaultPagination = (page) => ({ page, limit: itemsPerPage, total: 0, totalPages: 0 });

function buildQuestionBankParams({ keyword, page, status }) {
  return {
    keyword: keyword.trim() || undefined,
    status: status === "all" ? undefined : status,
    page,
    limit: itemsPerPage,
    sortBy: "updated_at",
    sortOrder: "desc",
  };
}

export function useQuestionBanksPage() {
  const [questionBanks, setQuestionBanks] = useState([]);
  const [pagination, setPagination] = useState(defaultPagination(1));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingKeyword, setPendingKeyword] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [pendingStatus, setPendingStatus] = useState("all");
  const [appliedStatus, setAppliedStatus] = useState("all");
  const [page, setPage] = useState(1);

  const params = useMemo(
    () => buildQuestionBankParams({ keyword: appliedKeyword, page, status: appliedStatus }),
    [appliedKeyword, appliedStatus, page]
  );

  const fetchQuestionBanks = useCallback(async (activeParams, fallbackPage) => {
    try {
      const data = await questionBanksService.listMine(activeParams);
      setQuestionBanks(data?.items ?? []);
      setPagination(data?.pagination ?? defaultPagination(fallbackPage));
      setError(null);
    } catch (err) {
      setQuestionBanks([]);
      setPagination(defaultPagination(fallbackPage));
      setError(err.response?.data?.error || err.message || "Failed to load question banks.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadQuestionBanks = useCallback(async () => {
    setLoading(true);
    setError(null);
    await fetchQuestionBanks(params, page);
  }, [fetchQuestionBanks, page, params]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchQuestionBanks(params, page);
  }, [fetchQuestionBanks, page, params]);

  function handleKeywordChange(event) {
    setPendingKeyword(event.target.value);
  }

  function applyFilters() {
    const shouldFetch = pendingKeyword !== appliedKeyword || pendingStatus !== appliedStatus || page !== 1;

    if (shouldFetch) {
      setLoading(true);
    }

    setError(null);
    setAppliedKeyword(pendingKeyword);
    setAppliedStatus(pendingStatus);
    setPage(1);
  }

  function resetFilters() {
    setError(null);
    setPendingKeyword("");
    setPendingStatus("all");
  }

  function changePage(nextPage) {
    setLoading(true);
    setError(null);
    setPage(nextPage);
  }

  return {
    pendingKeyword,
    pendingStatus,
    error,
    handleKeywordChange,
    loading,
    loadQuestionBanks,
    onApplyFilters: applyFilters,
    onPageChange: changePage,
    onResetFilters: resetFilters,
    onStatusChange: (event) => setPendingStatus(event.target.value),
    pagination,
    questionBanks,
  };
}
