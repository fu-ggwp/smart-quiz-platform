"use client";

import { useCallback, useEffect, useState } from "react";

import { questionBanksService } from "@/services/question-banks.service";

const itemsPerPage = 10;
const defaultPagination = (page) => ({ page, limit: itemsPerPage, total: 0, totalPages: 0 });

export function useQuestionBanksPage({ params } = {}) {
  const [questionBanks, setQuestionBanks] = useState([]);
  const [pagination, setPagination] = useState(defaultPagination(1));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const paramsString = JSON.stringify(params ?? {});

  const loadQuestionBanks = useCallback(async () => {
    const activeParams = paramsString ? JSON.parse(paramsString) : {};
    const fallbackPage = activeParams.page ?? 1;

    setLoading(true);
    setError(null);

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
  }, [paramsString]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadQuestionBanks();
  }, [loadQuestionBanks]);

  return {
    error,
    loading,
    loadQuestionBanks,
    pagination,
    questionBanks,
  };
}
