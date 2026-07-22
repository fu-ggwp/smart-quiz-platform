"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  Flame,
  GraduationCap,
  HelpCircle,
  Target,
} from "lucide-react";

import { analyticsService } from "@/services/analytics.service";

const EMPTY_PROGRESS = {
  snapshot: {
    activeDaysLast30: 0,
    currentStreakDays: 0,
    longestStreakDays: 0,
    completedActivities: 0,
    questionsAnswered: 0,
    recentAccuracy: null,
    averageExamScore: null,
  },
  learningRhythm: [],
  recentPerformance: [],
  learningMix: {
    practiceQuizzes: 0,
    flashcards: 0,
    exams: 0,
  },
};

function getErrorMessage(error) {
  return error?.response?.data?.error || error?.message || "Failed to load progress. Please try again.";
}

function clampPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.min(Math.max(number, 0), 100);
}

function formatDateLabel(value) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { day: "2-digit", month: "short", timeZone: "UTC" });
}

function formatDateTime(value) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return date.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function formatScore(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "0";
  return Number.isInteger(number) ? String(number) : number.toFixed(1);
}

function formatPercent(value) {
  return value === null || value === undefined ? "No data" : `${clampPercent(value)}%`;
}

function snapshotCards(snapshot) {
  return [
    {
      icon: CalendarDays,
      label: "Active Days",
      value: snapshot.activeDaysLast30,
      helper: "days in last 30 days",
    },
    {
      icon: Flame,
      label: "Current Streak",
      value: `${snapshot.currentStreakDays} ${snapshot.currentStreakDays === 1 ? "day" : "days"}`,
      helper: `Longest: ${snapshot.longestStreakDays} ${snapshot.longestStreakDays === 1 ? "day" : "days"}`,
    },
    {
      icon: CheckCircle2,
      label: "Completed Work",
      value: snapshot.completedActivities,
      helper: "completed quizzes and exams",
    },
    {
      icon: HelpCircle,
      label: "Questions Answered",
      value: snapshot.questionsAnswered,
      helper: "practice and exam answers",
    },
    {
      icon: Target,
      label: "Recent Accuracy",
      value: formatPercent(snapshot.recentAccuracy),
      helper: "scored quizzes in last 7 days",
    },
    {
      icon: GraduationCap,
      label: "Average Exam Score",
      value: snapshot.averageExamScore === null ? "No recent exams" : `${formatScore(snapshot.averageExamScore)} / 10`,
      helper: "visible scores in last 7 days",
    },
  ];
}

export default function LearnerProgressPage() {
  const [progress, setProgress] = useState(EMPTY_PROGRESS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    analyticsService
      .getOverview()
      .then((data) => {
        if (ignore) return;
        setProgress({ ...EMPTY_PROGRESS, ...data });
        setError("");
      })
      .catch((loadError) => {
        if (ignore) return;
        setError(getErrorMessage(loadError));
        setProgress(EMPTY_PROGRESS);
      })
      .finally(() => {
        if (ignore) return;
        setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const cards = useMemo(() => snapshotCards(progress.snapshot), [progress.snapshot]);

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl space-y-6">
        <header className="border-b border-border pb-6">
          <h1 className="text-3xl font-bold tracking-normal">My Progress</h1>
        </header>

        {error ? <StatePanel tone="error" message={error} /> : null}

        <section className="space-y-4">
          <SectionHeader title="Progress Snapshot" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map((card) => (
              <SnapshotCard key={card.label} loading={loading} {...card} />
            ))}
          </div>
        </section>

        <LearningRhythm data={progress.learningRhythm} loading={loading} />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
          <RecentPerformance data={progress.recentPerformance} loading={loading} />
          <LearningMix data={progress.learningMix} loading={loading} />
        </div>
      </section>
    </main>
  );
}

function SectionHeader({ description, title }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
    </div>
  );
}

function SnapshotCard({ helper, icon: Icon, label, loading, value }) {
  return (
    <article className="rounded-md border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-muted-foreground">{label}</p>
          {loading ? (
            <div className="mt-3 h-8 w-24 animate-pulse rounded-md bg-muted" />
          ) : (
            <p className="mt-2 truncate text-3xl font-bold text-foreground">{value}</p>
          )}
          <p className="mt-2 text-sm text-muted-foreground">{helper}</p>
        </div>
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Icon className="size-5" />
        </span>
      </div>
    </article>
  );
}

function LearningRhythm({ data, loading }) {
  const maxCount = Math.max(...data.map((item) => item.activityCount), 1);

  return (
    <section className="rounded-md border border-border bg-card p-5 shadow-sm">
      <SectionHeader
        title="Learning Rhythm"
      />

      {loading ? (
        <div className="mt-6 h-36 animate-pulse rounded-md bg-muted" />
      ) : data.length === 0 ? (
        <StatePanel message="No rhythm data yet." />
      ) : (
        <div className="mt-6">
          <div className="grid grid-cols-[repeat(30,minmax(0,1fr))] items-end gap-1 sm:gap-2">
            {data.map((item, index) => {
              const height = item.activityCount === 0 ? 8 : Math.max(18, Math.round((item.activityCount / maxCount) * 112));
              const showLabel = index % 5 === 0 || index === data.length - 1;

              return (
                <div className="flex min-w-0 flex-col items-center gap-2" key={item.date}>
                  <div className="flex h-32 w-full items-end justify-center rounded-md bg-muted/40 px-1">
                    <div
                      aria-label={`${formatDateLabel(item.date)}: ${item.activityCount} activities`}
                      className={`w-full max-w-4 rounded-t-md transition ${
                        item.activityCount > 0 ? "bg-primary" : "bg-muted"
                      }`}
                      style={{ height }}
                      title={`${formatDateLabel(item.date)} - ${item.activityCount} activities`}
                    />
                  </div>
                  <span className="h-4 text-[10px] font-semibold text-muted-foreground">
                    {showLabel ? formatDateLabel(item.date).replace(" ", "\n") : ""}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

function RecentPerformance({ data, loading }) {
  return (
    <section className="rounded-md border border-border bg-card p-5 shadow-sm">
      <SectionHeader title="Recent Performance" />

      {loading ? <div className="mt-5 h-56 animate-pulse rounded-md bg-muted" /> : null}

      {!loading && data.length === 0 ? <StatePanel message="No scored quiz or exam yet." /> : null}

      {!loading && data.length > 0 ? (
        <div className="mt-5 space-y-4">
          {data.map((item, index) => {
            const percentage = clampPercent(item.percentage);
            return (
              <article className="space-y-2" key={`${item.type}-${item.completedAt}-${index}`}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">
                        {item.type === "exam" ? "Exam" : "Quiz"}
                      </span>
                      <h3 className="truncate text-sm font-bold text-foreground">{item.title}</h3>
                    </div>
                    <p className="mt-1 text-xs font-medium text-muted-foreground">{formatDateTime(item.completedAt)}</p>
                  </div>
                  <p className="shrink-0 text-sm font-bold text-foreground">
                    {formatScore(item.score)} / {formatScore(item.maxScore)} - {percentage}%
                  </p>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${percentage}%` }} />
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

function LearningMix({ data, loading }) {
  const items = [
    { icon: BookOpenCheck, label: "Quiz Attempts", value: data.practiceQuizzes || 0 },
    { icon: Activity, label: "Completed Flashcards", value: data.flashcards || 0 },
    { icon: BarChart3, label: "Submitted Exams", value: data.exams || 0 },
  ];
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <section className="rounded-md border border-border bg-card p-5 shadow-sm">
      <SectionHeader title="Learning Mix" />

      {loading ? <div className="mt-5 h-44 animate-pulse rounded-md bg-muted" /> : null}

      {!loading && total === 0 ? <StatePanel message="No learning activity yet." /> : null}

      {!loading && total > 0 ? (
        <div className="mt-5 space-y-4">
          {items.map((item) => {
            const width = Math.round((item.value / maxValue) * 100);
            const Icon = item.icon;
            return (
              <div className="space-y-2" key={item.label}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2 font-semibold text-foreground">
                    <Icon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{item.label}</span>
                  </span>
                  <span className="font-bold text-foreground">{item.value}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${width}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

function StatePanel({ message, tone = "muted" }) {
  const toneClass = tone === "error" ? "border-destructive/40 text-destructive" : "border-border text-muted-foreground";

  return (
    <div className={`mt-5 rounded-md border border-dashed bg-background px-4 py-6 text-sm font-semibold ${toneClass}`}>
      {message}
    </div>
  );
}
