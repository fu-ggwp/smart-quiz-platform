"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { examsService } from "../services/exams.service";

const DEFAULT_META = {
  total: 0,
  page: 1,
  pageSize: 10,
  totalPages: 1,
  classes: [],
};

/**
 * Loads exams owned by the current teacher, or a learner's exam attempts.
 * Backs the /teacher/exams and /learner/exams views.
 */
export function useExams({ mine = true, params } = {}) {
  const [exams, setExams] = useState([]);
  const [meta, setMeta] = useState(DEFAULT_META);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const paramsKey = useMemo(() => JSON.stringify(params ?? {}), [params]);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const parsedParams = JSON.parse(paramsKey);
      const { data } = mine
        ? await examsService.listMine(parsedParams)
        : await examsService.listMyAttempts(parsedParams);

      setExams(data?.items ?? data ?? []);
      setMeta({ ...DEFAULT_META, ...(data?.items ? data : {}) });
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [mine, paramsKey]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { exams, meta, loading, error, reload };
}
