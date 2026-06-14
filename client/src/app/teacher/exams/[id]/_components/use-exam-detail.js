"use client";

import { useEffect, useState } from "react";

import { examsService } from "@/services/exams.service";

import { getExamErrorMessage } from "./exam-detail-utils";

export function useExamDetail(examId) {
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    examsService
      .getOne(examId)
      .then((data) => {
        if (ignore) return;
        setExam(data);
        setError("");
      })
      .catch((loadError) => {
        if (ignore) return;
        setError(getExamErrorMessage(loadError));
      })
      .finally(() => {
        if (ignore) return;
        setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [examId]);

  return { exam, loading, error };
}
