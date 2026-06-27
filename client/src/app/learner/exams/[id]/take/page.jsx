"use client";

import {
  AlertTriangle,
  CheckSquare,
  Menu,
  Minus,
  Plus,
  Star,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { examsService } from "@/services/exams.service";

function formatTime(seconds) {
  const safe = Math.max(Number(seconds) || 0, 0);
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${minutes}m : ${String(rest).padStart(2, "0")}s`;
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.error ||
    error?.message ||
    "Unable to load exam attempt."
  );
}

function sameSelection(left = [], right = []) {
  return String(left[0] ?? "") === String(right[0] ?? "");
}

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
  const questions = useMemo(
    () => examData?.questions ?? [],
    [examData?.questions],
  );
  const activeQuestion = questions[activeIndex] ?? questions[0];
  const activeOptions = Array.isArray(activeQuestion?.answer_options)
    ? activeQuestion.answer_options
    : [];

  const requestExamMode = useCallback(() => {
    if (typeof document === "undefined") return;
    if (
      !document.fullscreenElement &&
      document.documentElement.requestFullscreen
    ) {
      document.documentElement
        .requestFullscreen()
        .then(() => setNeedsReturn(false))
        .catch(() => setNeedsReturn(true));
      return;
    }
    setNeedsReturn(false);
  }, []);

  const syncWarningCount = useCallback((updated) => {
    if (updated?.warning_count === undefined) return;

    setExamData((current) =>
      current
        ? {
            ...current,
            attempt: {
              ...current.attempt,
              warning_count: updated.warning_count,
            },
          }
        : current,
    );
  }, []);

  const recordEvent = useCallback(
    async (eventType, message, countWarning = true) => {
      if (!examAttemptId) return;

      const now = Date.now();
      if (now - (eventAtRef.current[eventType] || 0) < 600) return;
      eventAtRef.current[eventType] = now;

      if (message) setWarning(message);

      try {
        const updated = await examsService.recordAttemptEvent(examAttemptId, {
          event_type: eventType,
        });
        syncWarningCount(updated);
      } catch (eventError) {
        if (eventType === "tab_hidden") {
          examsService.recordAttemptEventKeepAlive(examAttemptId, {
            event_type: eventType,
          });
        }

        if (countWarning) {
          const syncError =
            eventError?.response?.data?.error ||
            eventError?.message ||
            "Could not sync warning to server.";
          setWarning(`${message || "Warning detected."} ${syncError}`);
        }
      }

      if (countWarning) requestExamMode();
    },
    [examAttemptId, requestExamMode, syncWarningCount],
  );

  const returnToExam = useCallback(async () => {
    requestExamMode();
    if (!examAttemptId) return;

    try {
      await examsService.recordAttemptEvent(examAttemptId, {
        event_type: "tab_visible",
      });
    } catch {
      setWarning(
        "Returned to exam, but return event could not sync to server.",
      );
    }
  }, [examAttemptId, requestExamMode]);

  const submitAttempt = useCallback(
    async (isAutoSubmitted = false) => {
      if (!examAttemptId || submittingRef.current) return;
      submittingRef.current = true;
      try {
        const result = await examsService.submitAttempt(examAttemptId, {
          is_auto_submitted: isAutoSubmitted,
        });
        setSubmitted(result);
        setWarning(
          isAutoSubmitted
            ? "Time is up. Your saved answers were submitted automatically."
            : "Exam submitted successfully.",
        );
      } catch (submitError) {
        setError(getErrorMessage(submitError));
      } finally {
        submittingRef.current = false;
      }
    },
    [examAttemptId],
  );

  useEffect(() => {
    if (startedRef.current || !examId) return;
    startedRef.current = true;

    setLoading(true);
    setError("");
    const accessCode =
      new URLSearchParams(window.location.search).get("code") || "";

    examsService
      .startAttempt(examId, { access_code: accessCode })
      .then((data) => {
        const answerMap = {};
        (data.answers ?? []).forEach((answer) => {
          answerMap[answer.exam_question_id] =
            answer.selected_exam_option_indexes ?? [];
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
    const onBlur = () =>
      recordEvent("window_blur", "Warning: keep the exam window active.");
    const onFocus = () => recordEvent("window_focus", "", false);
    const onFullscreen = () => {
      if (!document.fullscreenElement) {
        recordEvent(
          "fullscreen_exit",
          "Warning: fullscreen mode is required for this exam.",
        );
      }
    };
    const onKeyDown = (event) => {
      const key = event.key.toLowerCase();
      const blockedDevTools =
        event.key === "F12" ||
        (event.ctrlKey && event.shiftKey && ["i", "j", "c", "k"].includes(key));
      const blockedBrowserConfig =
        event.ctrlKey && ["u", "s", "p", "r", "f", "g"].includes(key);
      const blockedZoom = event.ctrlKey && ["-", "_", "="].includes(key);
      if (!blockedDevTools && !blockedBrowserConfig && !blockedZoom) return;
      event.preventDefault();
      event.stopPropagation();
      if (blockedZoom) {
        recordEvent(
          "zoom_changed",
          "Warning: browser zoom changes are not allowed.",
        );
      }
    };
    const onWheel = (event) => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      recordEvent(
        "zoom_changed",
        "Warning: browser zoom changes are not allowed.",
      );
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
    return questions.filter(
      (question) =>
        (selectedAnswers[question.exam_question_id] ?? []).length > 0,
    ).length;
  }, [questions, selectedAnswers]);

  async function selectOption(questionId, optionIndex) {
    const nextSelection = [optionIndex];
    if (sameSelection(selectedAnswers[questionId], nextSelection)) return;

    setSelectedAnswers((current) => ({
      ...current,
      [questionId]: nextSelection,
    }));
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
    if (
      !window.confirm(
        "Submit this exam? You cannot change answers after submitting.",
      )
    )
      return;
    submitAttempt(false);
  }

  function changeFontScale(delta) {
    setFontScale((current) =>
      Math.min(Math.max(Number((current + delta).toFixed(2)), 0.85), 1.35),
    );
  }

  function toggleFlag(questionId) {
    setFlaggedQuestions((current) => ({
      ...current,
      [questionId]: !current[questionId],
    }));
  }

  if (loading) {
    return (
      <main className="fixed inset-0 z-50 grid place-items-center bg-[#f2f2f2] text-sm text-slate-600">
        Loading exam...
      </main>
    );
  }

  if (error || !examData) {
    return (
      <main className="fixed inset-0 z-50 grid place-items-center bg-[#f2f2f2] p-6">
        <section className="w-full max-w-xl border border-slate-300 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-red-600">
            {error || "Exam attempt not found."}
          </p>
          <Button
            className="mt-4 rounded-sm"
            variant="outline"
            onClick={() => router.push(`/learner/exams/${examId}`)}
          >
            Back to exam
          </Button>
        </section>
      </main>
    );
  }

  if (submitted) {
    const canReviewAnswers = submitted.result_visibility === "question_answer";

    return (
      <main className="fixed inset-0 z-50 grid place-items-center bg-[#f2f2f2] p-6">
        <section className="w-full max-w-xl border border-slate-300 bg-white p-6 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-700">
            Exam submitted successfully
          </h1>
          {submitted.result_visibility === "score_only" || canReviewAnswers ? (
            <p className="mt-3 text-sm text-slate-600">
              Score: {submitted.total_score} / {submitted.max_score}
            </p>
          ) : (
            <p className="mt-3 text-sm text-slate-600">
              Your completion status has been saved.
            </p>
          )}
          <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
            {canReviewAnswers ? (
              <Button
                className="rounded-sm"
                onClick={() =>
                  router.push(
                    `/learner/exams/${examId}/result?attempt=${submitted.exam_attempt_id}`,
                  )
                }
              >
                View question answers
              </Button>
            ) : null}
            <Button
              className="rounded-sm"
              variant={canReviewAnswers ? "outline" : "default"}
              onClick={() => router.push("/learner/exams")}
            >
              Back to exams
            </Button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="fixed inset-0 z-50 overflow-auto bg-[#eeeeee] text-slate-700">
      <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm">
        <div className="flex items-center gap-4 text-slate-600">
          <Menu className="size-5" />
          <span className="text-sm font-semibold">CardIO</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>{new Date().toLocaleTimeString()}</span>
          <button
            className="grid size-8 place-items-center border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            onClick={() => changeFontScale(-0.1)}
            title="Decrease font size"
            type="button"
          >
            <Minus className="size-4" />
          </button>
          <button
            className="grid size-8 place-items-center border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            onClick={() => changeFontScale(0.1)}
            title="Increase font size"
            type="button"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </header>

      <section className="border-b border-slate-200 bg-[#f7f7f7] px-4 py-3 text-sm font-semibold text-slate-600">
        Individual exam - {examData.exam?.classes?.class_name || "Class"} -{" "}
        {examData.exam?.title}
      </section>

      {warning ? (
        <div className="mx-4 mt-3 flex items-center gap-2 border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
          <AlertTriangle className="size-4" />
          <span>
            {warning} Warnings: {examData.attempt?.warning_count ?? 0}
          </span>
        </div>
      ) : null}

      <section className="grid gap-3 p-4 lg:grid-cols-[305px_1fr]">
        <aside className="border border-slate-300 bg-white p-3 shadow-sm">
          <h2 className="border-b border-slate-200 pb-3 text-center text-sm font-bold text-slate-600">
            Exam information
          </h2>

          <div className="mx-1 mt-4 border border-slate-100 bg-slate-50">
            <div className="bg-[#f3f3fb] px-4 py-3 text-sm font-semibold text-slate-600">
              Exam notes
            </div>
            <ul className="space-y-1 px-8 py-4 text-xs leading-5 text-slate-600">
              <li>Watch the remaining time carefully.</li>
              <li>Your answers are saved automatically.</li>
              <li>Stay on the exam screen.</li>
              <li>Contact the teacher if you have a problem.</li>
            </ul>
          </div>

          <div className="mx-1 border-t border-slate-200 pt-4">
            <p className="text-xs text-slate-500">Time remaining</p>
            <p className="mt-1 text-base font-bold text-[#53608a]">
              {formatTime(remainingSeconds)}
            </p>
          </div>

          <div className="mx-1 mt-6">
            <div className="mb-3 grid grid-cols-5 gap-2">
              {questions.map((question, index) => {
                const answered =
                  (selectedAnswers[question.exam_question_id] ?? []).length > 0;
                const active = index === activeIndex;
                const flagged = Boolean(
                  flaggedQuestions[question.exam_question_id],
                );
                return (
                  <button
                    key={question.exam_question_id}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={`h-8 border text-sm font-bold ${active ? "border-blue-700 bg-blue-600 text-white" : flagged ? "border-yellow-500 bg-yellow-100 text-yellow-800" : answered ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-300 bg-white text-slate-600"}`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>

            <Button
              className="h-8 w-full rounded-sm border-slate-400 bg-white text-slate-700 hover:bg-slate-50"
              variant="outline"
              onClick={handleSubmit}
            >
              <CheckSquare className="size-4" />
              Submit
            </Button>
          </div>
        </aside>

        <section className="min-h-[398px] border border-slate-300 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h1 className="text-sm font-bold text-[#53608a]">
              QUESTION {activeIndex + 1} (SINGLE CHOICE)
            </h1>
            <button
              className={`flex h-8 items-center gap-1 border px-3 text-xs font-semibold ${flaggedQuestions[activeQuestion?.exam_question_id] ? "border-yellow-500 bg-yellow-100 text-yellow-800" : "border-yellow-200 text-yellow-600"}`}
              onClick={() =>
                activeQuestion && toggleFlag(activeQuestion.exam_question_id)
              }
              type="button"
            >
              <Star className="size-4" />
              Flag
            </button>
          </div>

          {activeQuestion ? (
            <div>
              <div className="min-h-[210px] border-b border-slate-200 px-6 py-9">
                <p
                  className="max-w-4xl font-semibold leading-7 text-slate-800"
                  style={{ fontSize: `${fontScale}rem` }}
                >
                  {activeQuestion.question_text}
                </p>
              </div>

              <div
                className="space-y-4 px-5 py-5"
                style={{ fontSize: `${fontScale}rem` }}
              >
                {activeOptions.map((option, index) => {
                  const checked =
                    selectedAnswers[activeQuestion.exam_question_id]?.[0] ===
                    option.index;
                  return (
                    <label
                      key={`${activeQuestion.exam_question_id}-${option.index}`}
                      className="flex cursor-pointer items-center gap-3 text-sm text-slate-700"
                    >
                      <input
                        checked={checked}
                        name={activeQuestion.exam_question_id}
                        onChange={() =>
                          selectOption(
                            activeQuestion.exam_question_id,
                            option.index,
                          )
                        }
                        type="radio"
                        className="size-4 accent-[#5368b5]"
                      />
                      <span>({String.fromCharCode(105 + index)})</span>
                      <span>{option.text}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="grid min-h-[360px] place-items-center text-sm text-slate-500">
              No questions available.
            </div>
          )}
        </section>
      </section>

      <footer className="pointer-events-none fixed bottom-0 right-0 px-4 pb-2 text-xs text-slate-500">
        Answered {answeredCount}/{questions.length}
      </footer>

      {needsReturn ? (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/55 p-6">
          <section className="w-full max-w-md border border-amber-300 bg-white p-5 text-center shadow-xl">
            <AlertTriangle className="mx-auto size-8 text-amber-600" />
            <h2 className="mt-3 text-lg font-bold text-slate-800">
              Return to exam screen
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              The exam must stay fullscreen and active. Click below to continue.
            </p>
            <Button className="mt-5 rounded-sm" onClick={returnToExam}>
              Return to exam
            </Button>
          </section>
        </div>
      ) : null}
    </main>
  );
}
