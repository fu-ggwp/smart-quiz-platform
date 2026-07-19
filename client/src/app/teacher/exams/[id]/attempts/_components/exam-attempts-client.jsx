"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { examsService } from "@/services/exams.service";

import {
  groupAttemptsByLearner,
  scoreModeOptions,
  buildScoreRows,
  exportWorkbook,
} from "./attempt-helpers";
import { AttemptStats } from "./stat-cards";
import { ExportMenu } from "./export-menu";
import { Filters } from "./filters";
import { ResultTable } from "./result-table";
import { AttemptDetailView } from "./attempt-detail-view";

function getErrorMessage(error) {
  return error?.response?.data?.error || error?.response?.data?.message || error?.message || "Unable to load exam results.";
}

export function ExamAttemptsClient({ examId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    scoreMode: "highest",
    status: "all",
    sortBy: "score_desc",
  });
  const [exportOpen, setExportOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    mode: "current",
    includeTime: true,
    includeWarnings: true,
  });
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    let ignore = false;

    examsService
      .getAttempts(examId)
      .then((attemptsData) => {
        if (ignore) return;
        setData(attemptsData);
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
  }, [examId]);

  const learners = useMemo(() => groupAttemptsByLearner(data?.attempts ?? []), [data]);
  const scoreOptions = useMemo(() => scoreModeOptions(data?.attempts ?? []), [data]);
  const rows = useMemo(() => buildScoreRows(learners, filters), [learners, filters]);

  function loadAttemptDetail(learnerRow, attempt) {
    setDetail({
      learnerRow,
      selectedAttemptId: attempt.exam_attempt_id,
      attempt,
      loading: true,
      error: "",
      result: null,
    });

    examsService
      .getTeacherAttemptResults(attempt.exam_attempt_id)
      .then((result) => {
        setDetail({
          learnerRow,
          selectedAttemptId: attempt.exam_attempt_id,
          attempt: result.attempt,
          loading: false,
          error: "",
          result,
        });
      })
      .catch((loadError) => {
        setDetail({
          learnerRow,
          selectedAttemptId: attempt.exam_attempt_id,
          attempt,
          loading: false,
          error: getErrorMessage(loadError),
          result: null,
        });
      });
  }

  function handleSelectDetailAttempt(attemptId) {
    if (!detail?.learnerRow) return;
    const attempt = detail.learnerRow.attempts.find((item) => item.exam_attempt_id === attemptId);
    if (attempt) loadAttemptDetail(detail.learnerRow, attempt);
  }

  if (loading) {
    return (
      <main className="min-h-full bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
        <section className="mx-auto max-w-7xl rounded-md border border-border bg-card p-6 text-sm font-medium text-muted-foreground shadow-sm">
          Loading exam results...
        </section>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-full bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
        <section className="mx-auto max-w-3xl space-y-4 rounded-md border border-border bg-card p-6 shadow-sm">
          <p className="text-sm font-medium text-destructive">{error || "Exam results are not available."}</p>
          <Button asChild variant="outline">
            <Link href={`/teacher/exams/${examId}`}>
              <ArrowLeft data-icon="inline-start" />
              Back to exam detail
            </Link>
          </Button>
        </section>
      </main>
    );
  }

  if (detail) {
    return (
      <AttemptDetailView
        data={data}
        detail={detail}
        onBack={() => setDetail(null)}
        onSelectAttempt={handleSelectDetailAttempt}
        scoreMode={filters.scoreMode}
        selectedAttemptId={detail.selectedAttemptId}
      />
    );
  }

  return (
    <main className="min-h-full bg-muted/40 px-4 py-5 text-foreground sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <Link
              href={`/teacher/exams/${examId}`}
              className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Back to exam detail
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-normal text-foreground">Exam Results</h1>
              <p className="mt-2 text-sm font-medium text-muted-foreground">Exam: {data.exam?.title}</p>
            </div>
          </div>
          <Button onClick={() => setExportOpen((current) => !current)}>
            <Download data-icon="inline-start" />
            Export
          </Button>
        </header>

        <AttemptStats summary={data.summary} />

        <ExportMenu
          onChange={setExportOptions}
          onClose={() => setExportOpen(false)}
          onExport={() => {
            exportWorkbook(data, rows, data.attempts ?? [], exportOptions);
            setExportOpen(false);
          }}
          open={exportOpen}
          options={exportOptions}
        />

        <Filters filters={filters} onChange={setFilters} scoreOptions={scoreOptions} />

        <ResultTable rows={rows} totalLearners={learners.length} onViewResult={loadAttemptDetail} />
      </section>
    </main>
  );
}
