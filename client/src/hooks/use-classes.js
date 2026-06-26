"use client";

import { useCallback, useEffect, useState } from "react";
import classesService from "../services/classes.service";

/**
 * Loads the current teacher's created/managed classes.
 * Backs the /teacher/classes views.
 */
export function useClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await classesService.listMine();
      setClasses(data ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { classes, loading, error, reload };
}

/**
 * Loads the Learner Class Detail payload (class header + assigned activities)
 * for one class. Backs /learner/classes/[id] (UC-17 / §3.3.4).
 */
export function useLearnerClassDetail(classId) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    if (!classId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await classesService.getLearnerDetail(classId);
      setDetail(data ?? null);
    } catch (err) {
      // MSG13 fallback; surfaces MSG11 (403) / "Class not found" (404) from the API.
      setError(
        err?.response?.data?.error ||
          err.message ||
          "Failed to load data. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { detail, loading, error, reload };
}
