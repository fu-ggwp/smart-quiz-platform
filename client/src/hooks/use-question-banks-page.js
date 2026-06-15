"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { buildQuestionBankParams } from "@/app/teacher/question-banks/_lib/question-banks.params";
import { questionBanksService } from "@/services/question-banks.service";

const itemsPerPage = 10;
const defaultPagination = (page) => ({ page, limit: itemsPerPage, total: 0, totalPages: 0 });

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
      setError(err.response?.data?.message || err.message || "Failed to load question banks.");
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
