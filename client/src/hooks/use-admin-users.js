"use client";

import { useCallback, useEffect, useState } from "react";
import { usersService } from "@/services/users.service";

export const DEFAULT_USER_FILTERS = {
  page: 1,
  limit: 10,
  q: "",
  role: "",
  status: "",
  sortBy: "latest",
};

/**
 * Loads the Admin user list (UC-51 / §3.9.1). `params` holds the active
 * search/filter/pagination state; changing it re-fetches. Empty filter
 * values are stripped so the API treats them as "all".
 */
export function useAdminUsers() {
  const [params, setParams] = useState(DEFAULT_USER_FILTERS);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async (active) => {
    setLoading(true);
    setError(null);
    try {
      const query = Object.fromEntries(
        Object.entries(active).filter(([, v]) => v !== "" && v != null)
      );
      const data = await usersService.listForAdmin(query);
      setItems(data?.items ?? []);
      setPagination(
        data?.pagination ?? { page: 1, totalPages: 1, total: 0, limit: active.limit }
      );
    } catch (err) {
      // MSG13 fallback; surfaces MSG11 (403) from the API if a non-admin calls it.
      setError(
        err?.response?.data?.error ||
          err.message ||
          "Failed to load data. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      load(params);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [load, params]);

  return {
    items,
    pagination,
    params,
    setParams,
    loading,
    error,
    reload: () => load(params),
  };
}
