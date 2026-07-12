"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { examsService } from "@/services/exams.service";
import { getErrorMessage, sameSelection } from "./_components/take-helpers";
import { LoadingView, ErrorView, SubmittedView } from "./_components/take-overlays";
import { NeedsReturnModal } from "./_components/needs-return-modal";
import { TakeHeader } from "./_components/take-header";
import { TakeSidebar } from "./_components/take-sidebar";
import { TakeQuestionCard } from "./_components/take-question-card";

export default function TakeExamPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params?.id;

  const [examData, setExamData] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [needsReturn, setNeedsReturn] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const [fontScale, setFontScale] = useState(1);
  const [flaggedQuestions, setFlaggedQuestions] = useState({});

  const startedRef = useRef(false);
  const eventAtRef = useRef({});
  const submittingRef = useRef(false);

  const attempt = examData?.attempt;
  const examAttemptId = attempt?.exam_attempt_id;
  const questions = useMemo(() => examData?.questions ?? [], [examData?.questions]);
  const activeQuestion = questions[activeIndex] ?? questions[0];

  const requestExamMode = useCallback(() => {
    if (typeof document === "undefined") return;
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen()
        .then(() => setNeedsReturn(false))
        .catch(() => setNeedsReturn(true));
      return;
    }
    setNeedsReturn(false);
  }, []);

  const syncWarningCount = useCallback((updated) => {
    if (updated?.warning_count === undefined) return;

    setExamData((current) => current ? {
      ...current,
      attempt: { ...current.attempt, warning_count: updated.warning_count },
    } : current);
  }, []);

  const recordEvent = useCallback(async (eventType, message, countWarning = true) => {
    if (!examAttemptId) return;

    const now = Date.now();
    if (now - (eventAtRef.current[eventType] || 0) < 600) return;
    eventAtRef.current[eventType] = now;

    if (message) setWarning(message);

    try {
      const updated = await examsService.recordAttemptEvent(examAttemptId, { event_type: eventType });
      syncWarningCount(updated);
    } catch (eventError) {
      if (eventType === "tab_hidden") {
        examsService.recordAttemptEventKeepAlive(examAttemptId, { event_type: eventType });
      }

      if (countWarning) {
        const syncError = eventError?.response?.data?.error || eventError?.message || "Could not sync warning to server.";
        setWarning(`${message || "Warning detected."} ${syncError}`);
      }
    }

    if (countWarning) requestExamMode();
  }, [examAttemptId, requestExamMode, syncWarningCount]);

  const returnToExam = useCallback(async () => {
    requestExamMode();
    if (!examAttemptId) return;

    try {
      await examsService.recordAttemptEvent(examAttemptId, { event_type: "tab_visible" });
    } catch {
      setWarning("Returned to exam, but return event could not sync to server.");
    }
  }, [examAttemptId, requestExamMode]);

  const submitAttempt = useCallback(async (isAutoSubmitted = false) => {
    if (!examAttemptId || submittingRef.current) return;
    submittingRef.current = true;
    try {
      const result = await examsService.submitAttempt(examAttemptId, { is_auto_submitted: isAutoSubmitted });
      setSubmitted(result);
      setWarning(isAutoSubmitted ? "Time is up. Your saved answers were submitted automatically." : "Exam submitted successfully.");
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      submittingRef.current = false;
    }
  }, [examAttemptId]);

  useEffect(() => {
    if (startedRef.current || !examId) return;
    startedRef.current = true;

    setLoading(true);
    setError("");
    const accessCode = new URLSearchParams(window.location.search).get("code") || "";

    examsService
      .startAttempt(examId, { access_code: accessCode })
      .then((data) => {
        const answerMap = {};
        (data.answers ?? []).forEach((answer) => {
          answerMap[answer.exam_question_id] = answer.selected_exam_option_indexes ?? [];
        });
        setExamData(data);
        setSelectedAnswers(answerMap);
        setRemainingSeconds(data.attempt?.remaining_seconds ?? 0);
        requestExamMode();
      })
      .catch((loadError) => setError(getErrorMessage(loadError)))
      .finally(() => setLoading(false));
  }, [examId, requestExamMode]);

  useEffect(() => {
    if (!examAttemptId || submitted) return;
    const interval = window.setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          submitAttempt(true);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [examAttemptId, submitAttempt, submitted]);

  useEffect(() => {
    if (!examAttemptId || submitted) return undefined;

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        recordEvent("tab_hidden", "Warning: do not leave the exam tab.");
      } else {
        setNeedsReturn(true);
        requestExamMode();
      }
    };
    const onBlur = () => recordEvent("window_blur", "Warning: keep the exam window active.");
    const onFocus = () => recordEvent("window_focus", "", false);
    const onFullscreen = () => {
      if (!document.fullscreenElement) {
        recordEvent("fullscreen_exit", "Warning: fullscreen mode is required for this exam.");
      }
    };
    const onKeyDown = (event) => {
      const key = event.key.toLowerCase();
      const blockedDevTools = event.key === "F12" || (event.ctrlKey && event.shiftKey && ["i", "j", "c", "k"].includes(key));
      const blockedBrowserConfig = event.ctrlKey && ["u", "s", "p", "r", "f", "g"].includes(key);
      const blockedZoom = event.ctrlKey && ["-", "_", "="].includes(key);
      if (!blockedDevTools && !blockedBrowserConfig && !blockedZoom) return;
      event.preventDefault();
      event.stopPropagation();
      if (blockedZoom) {
        recordEvent("zoom_changed", "Warning: browser zoom changes are not allowed.");
      }
    };
    const onWheel = (event) => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      recordEvent("zoom_changed", "Warning: browser zoom changes are not allowed.");
    };
    const onContextMenu = (event) => {
      event.preventDefault();
      event.stopPropagation();
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("fullscreenchange", onFullscreen);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("contextmenu", onContextMenu);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("fullscreenchange", onFullscreen);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("contextmenu", onContextMenu);
    };
  }, [examAttemptId, recordEvent, requestExamMode, submitted]);

  const answeredCount = useMemo(() => {
    return questions.filter((question) => (selectedAnswers[question.exam_question_id] ?? []).length > 0).length;
  }, [questions, selectedAnswers]);

  async function selectOption(questionId, optionIndex) {
    const nextSelection = [optionIndex];
    if (sameSelection(selectedAnswers[questionId], nextSelection)) return;

    setSelectedAnswers((current) => ({ ...current, [questionId]: nextSelection }));
    try {
      await examsService.submitAnswer(examAttemptId, {
        exam_question_id: questionId,
        selected_exam_option_indexes: nextSelection,
      });
    } catch (saveError) {
      setWarning(getErrorMessage(saveError));
    }
  }

  function handleSubmit() {
    if (!window.confirm("Submit this exam? You cannot change answers after submitting.")) return;
    submitAttempt(false);
  }

  function changeFontScale(delta) {
    setFontScale((current) => Math.min(Math.max(Number((current + delta).toFixed(2)), 0.85), 1.35));
  }

  function toggleFlag(questionId) {
    setFlaggedQuestions((current) => ({
      ...current,
      [questionId]: !current[questionId],
    }));
  }

  if (loading) {
    return <LoadingView />;
  }

  if (error || !examData) {
    return (
      <ErrorView
        error={error}
        examId={examId}
        onBack={() => router.push(`/learner/exams/${examId}`)}
      />
    );
  }

  if (submitted) {
    return (
      <SubmittedView
        submitted={submitted}
        examId={examId}
        onViewResults={() =>
          router.push(`/learner/exams/${examId}/result?attempt=${submitted.exam_attempt_id}`)
        }
        onBackToList={() => router.push("/learner/exams")}
      />
    );
  }

  return (
    <main className="fixed inset-0 z-50 overflow-auto bg-background text-foreground">
      <TakeHeader onChangeFontScale={changeFontScale} />

      <section className="border-b border-border bg-muted px-4 py-3 text-sm font-semibold text-muted-foreground">
        Individual exam - {examData.exam?.classes?.class_name || "Class"} - {examData.exam?.title}
      </section>

      {warning ? (
        <div className="mx-4 mt-3 flex items-center gap-2 border border-warning/40 bg-warning/10 px-3 py-2 text-sm font-medium text-warning">
          <span>{warning} Warnings: {examData.attempt?.warning_count ?? 0}</span>
        </div>
      ) : null}

      <section className="grid gap-3 p-4 lg:grid-cols-[305px_1fr]">
        <TakeSidebar
          remainingSeconds={remainingSeconds}
          questions={questions}
          selectedAnswers={selectedAnswers}
          activeIndex={activeIndex}
          setActiveIndex={setActiveIndex}
          flaggedQuestions={flaggedQuestions}
          onSubmit={handleSubmit}
        />

        <TakeQuestionCard
          activeQuestion={activeQuestion}
          activeIndex={activeIndex}
          flaggedQuestions={flaggedQuestions}
          onToggleFlag={toggleFlag}
          selectedAnswers={selectedAnswers}
          onSelectOption={selectOption}
          fontScale={fontScale}
        />
      </section>

      <footer className="pointer-events-none fixed bottom-0 right-0 px-4 pb-2 text-xs text-muted-foreground">
        Answered {answeredCount}/{questions.length}
      </footer>

      <NeedsReturnModal open={needsReturn} onReturn={returnToExam} />
    </main>
  );
}
