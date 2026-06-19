"use client";

import { useCallback, useEffect, useState } from "react";
import { studySetsService } from "../services/study-sets.service";

/**
 * Loads study sets owned by the current user (teacher/learner).
 * Backs the /teacher/study-sets and /learner/study-sets views.
 */
export function useStudySets({ mine = true, classId, params } = {}) {
  const [studySets, setStudySets] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const paramsString = JSON.stringify(params);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      if (mine) {
        const parsedParams = paramsString ? JSON.parse(paramsString) : undefined;
        const res = await studySetsService.listMine(parsedParams);
        // Backend returns `{ ok: true, data: { items: [...], pagination: {...} } }`
        // studySetsService.listMine returns `r.data` which is `{ ok: true, data: { items, pagination } }`
        const responseData = res?.data;
        setStudySets(responseData?.items ?? []);
        setPagination(responseData?.pagination ?? { page: 1, limit: 10, total: 0, totalPages: 1 });
      } else {
        const { data } = await studySetsService.listAvailable({ classId });
        setStudySets(data ?? []);
      }
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [mine, classId, paramsString]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { studySets, pagination, loading, error, reload };
}
