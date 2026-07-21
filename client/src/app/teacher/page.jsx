"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Building2,
  CalendarClock,
  GraduationCap,
  LibraryBig,
  Settings,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { dashboardsService } from "@/services/dashboards.service";

const QUICK_ACTIONS = [
  {
    label: "Create Exam",
    href: "/teacher/exams/create",
    icon: GraduationCap,
  },
  {
    label: "Create Study Set",
    href: "/teacher/study-sets/create",
    icon: BookOpen,
  },
  {
    label: "Create Question Bank",
    href: "/teacher/question-banks/create",
    icon: LibraryBig,
  },
  {
    label: "Create Class",
    href: "/teacher/classes/create",
    icon: Building2,
  },
];

const EMPTY_DASHBOARD = {
  summary: {
    pendingJoinRequests: 0,
    activeExams: 0,
    upcomingExams: 0,
    draftExams: 0,
  },
  joinRequestsByClass: [],
  examWork: {
    active: [],
    upcoming: [],
    drafts: [],
  },
};

/**
 * Pick a readable message from dashboard API failures.
 */
function getErrorMessage(error) {
  return error?.response?.data?.error || error?.message || "Unable to load dashboard.";
}

/**
 * Small plural helper for summary copy.
 */
function pluralize(count, singular, plural = singular + "s") {
  return count === 1 ? singular : plural;
}

/**
 * Format exam/request timestamps for dashboard cards.
 */
function formatDateTime(value) {
  if (!value) return "Not scheduled";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not scheduled";

  return date.toLocaleString(undefined, {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  });
}

/**
 * Prefer end time for active exams and start time for upcoming/draft exams.
 */
function formatTimeHint(startAt, endAt) {
  if (endAt) return "Ends " + formatDateTime(endAt);
  if (startAt) return "Starts " + formatDateTime(startAt);
  return "Not scheduled";
}

function hasExamWork(examWork) {
  return Boolean(examWork.active.length || examWork.upcoming.length || examWork.drafts.length);
}

/**
 * Teacher dashboard page: quick actions, join request queue, and exam work queues.
 */
export default function TeacherDashboardPage() {
  const [dashboard, setDashboard] = useState(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    // Load once on mount; ignore late responses after unmount.
    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const data = await dashboardsService.getTeacherDashboard();
        if (!ignore) setDashboard(normalizeDashboard(data));
      } catch (loadError) {
        if (!ignore) {
          setError(getErrorMessage(loadError));
          setDashboard(EMPTY_DASHBOARD);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      ignore = true;
    };
  }, []);

  const summaryActions = useMemo(
    () => [
      {
        label: "Pending Requests",
        value: dashboard.summary.pendingJoinRequests,
        icon: Users,
      },
      {
        label: "Active Exams",
        value: dashboard.summary.activeExams,
        icon: CalendarClock,
      },
      {
        label: "Upcoming Exams",
        value: dashboard.summary.upcomingExams,
        icon: GraduationCap,
      },
      {
        label: "Draft Exams",
        value: dashboard.summary.draftExams,
        icon: Settings,
      },
    ],
    [dashboard.summary],
  );

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Teacher Home</h1>
        </header>

        <QuickActions />

        {/* Dashboard States and Summary */}
        {error ? <StatePanel icon={AlertCircle} message={error} tone="error" /> : null}

        <WorkSummary actions={summaryActions} loading={loading} />

        <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)]">
          <JoinRequestsPanel
            items={dashboard.joinRequestsByClass}
            loading={loading}
          />
          <ExamWorkPanel
            examWork={dashboard.examWork}
            loading={loading}
          />
        </div>
      </section>
    </main>
  );
}

/**
 * Fill missing API fields so child components can render without null checks everywhere.
 */
function normalizeDashboard(data) {
  return {
    summary: {
      ...EMPTY_DASHBOARD.summary,
      ...(data?.summary || {}),
    },
    joinRequestsByClass: Array.isArray(data?.joinRequestsByClass) ? data.joinRequestsByClass : [],
    examWork: {
      active: Array.isArray(data?.examWork?.active) ? data.examWork.active : [],
      upcoming: Array.isArray(data?.examWork?.upcoming) ? data.examWork.upcoming : [],
      drafts: Array.isArray(data?.examWork?.drafts) ? data.examWork.drafts : [],
    },
  };
}

/**
 * Shortcuts for common teacher creation flows.
 */
function QuickActions() {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {QUICK_ACTIONS.map((action) => {
        const Icon = action.icon;

        return (
          <Link
            className="group rounded-lg border border-border bg-card p-4 shadow-sm transition hover:border-ring/50 hover:bg-muted/40"
            href={action.href}
            key={action.href}
          >
            <div className="flex items-start justify-between gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
            </div>
            <h2 className="mt-4 text-sm font-bold text-foreground">{action.label}</h2>
          </Link>
        );
      })}
    </section>
  );
}

/**
 * Top metric cards for urgent dashboard work.
 */
function WorkSummary({ actions, loading }) {
  if (loading) {
    return (
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {actions.map((item) => (
          <Skeleton className="h-28 rounded-lg border border-border" key={item.label} />
        ))}
      </section>
    );
  }

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {actions.map((item) => {
        const Icon = item.icon;

        return (
          <article
            className="rounded-lg border border-border bg-card p-4 text-left shadow-sm"
            key={item.label}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase text-muted-foreground">{item.label}</span>
              <Icon className="size-4 shrink-0 text-muted-foreground" />
            </div>
            <p className="mt-3 text-3xl font-bold text-foreground">{item.value}</p>
          </article>
        );
      })}
    </section>
  );
}

/**
 * Groups pending learner join requests by class.
 */
function JoinRequestsPanel({ items, loading }) {
  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <PanelHeader
        actionHref="/teacher/classes"
        actionLabel="View classes"
        title="Join Requests"
      />

      <div className="mt-5 space-y-3">
        {loading ? <Skeleton className="h-56 rounded-md border border-border" /> : null}
        {!loading && items.length === 0 ? (
          <EmptyState message="No pending join requests" />
        ) : null}
        {!loading
          ? items.map((item) => <JoinRequestItem item={item} key={item.classId} />)
          : null}
      </div>
    </section>
  );
}

/**
 * One class row in the join-request review queue.
 */
function JoinRequestItem({ item }) {
  return (
    <article className="rounded-md border border-border bg-background p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold text-foreground">{item.className}</h3>
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            {item.pendingCount} {pluralize(item.pendingCount, "learner")} waiting
            {item.latestRequestAt ? " - Latest " + formatDateTime(item.latestRequestAt) : ""}
          </p>
        </div>
        <Button asChild className="shrink-0" size="sm" variant="outline">
          <Link href={item.href}>Review</Link>
        </Button>
      </div>
    </article>
  );
}

/**
 * Shows active, upcoming, and draft exams returned by the teacher dashboard API.
 */
function ExamWorkPanel({ examWork, loading }) {
  const empty = !hasExamWork(examWork);

  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <PanelHeader
        actionHref="/teacher/exams"
        actionLabel="View exams"
        title="Exam Work"
      />

      <div className="mt-5 space-y-5">
        {loading ? <Skeleton className="h-80 rounded-md border border-border" /> : null}

        {!loading && empty ? (
          <EmptyState
            actionHref="/teacher/exams/create"
            actionLabel="Create Exam"
            message="No exam work yet"
          />
        ) : null}

        {!loading && !empty ? (
          <>
            <ExamSection
              items={examWork.active}
              title="Active"
              tone="active"
            />
            <ExamSection
              items={examWork.upcoming}
              title="Upcoming"
              tone="upcoming"
            />
            <ExamSection
              items={examWork.drafts}
              title="Drafts"
              tone="draft"
            />
          </>
        ) : null}
      </div>
    </section>
  );
}

/**
 * One exam status bucket inside the work panel.
 */
function ExamSection({ items, title, tone }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        <span className="rounded-full border border-border px-2.5 py-1 text-xs font-bold text-muted-foreground">
          {items.length}
        </span>
      </div>
      {items.length === 0 ? <EmptyState compact message={`No ${title.toLowerCase()} exams`} /> : null}
      {items.map((item) => (
        <ExamWorkItem item={item} key={item.examSessionId} tone={tone} />
      ))}
    </section>
  );
}

/**
 * One exam row with the main action for its current state.
 */
function ExamWorkItem({ item, tone }) {
  return (
    <article className="rounded-md border border-border bg-background p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone={tone} />
            <Link className="truncate text-sm font-bold text-foreground hover:text-primary" href={item.href}>
              {item.title}
            </Link>
          </div>
          <p className="mt-2 text-xs font-medium text-muted-foreground">
            {item.className} - {formatTimeHint(item.startAt, item.endAt)}
          </p>
        </div>
        <Button asChild className="shrink-0" size="sm">
          <Link href={item.actionHref}>{item.actionLabel}</Link>
        </Button>
      </div>
    </article>
  );
}

/**
 * Small status pill for exam work sections.
 */
function StatusPill({ tone }) {
  const className = {
    active: "border-primary/30 bg-primary/10 text-primary",
    upcoming: "border-border bg-muted text-muted-foreground",
    draft: "border-border bg-background text-muted-foreground",
  }[tone];

  return (
    <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold leading-none ${className}`}>
      {tone}
    </span>
  );
}

/**
 * Shared panel title/action header.
 */
function PanelHeader({ actionHref, actionLabel, title }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
      </div>
      <Button asChild className="shrink-0" size="sm" variant="outline">
        <Link href={actionHref}>{actionLabel}</Link>
      </Button>
    </div>
  );
}

/**
 * Empty state used inside dashboard panels.
 */
function EmptyState({ actionHref, actionLabel, compact = false, message }) {
  return (
    <div className={`rounded-md border border-dashed border-border bg-background text-muted-foreground ${compact ? "p-3" : "p-5"}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium">{message}</p>
        {actionHref ? (
          <Button asChild className="shrink-0" size="sm">
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Inline dashboard message for loading/error/neutral states.
 */
function StatePanel({ icon: Icon, message, tone = "muted" }) {
  const toneClass = tone === "error" ? "text-destructive" : "text-muted-foreground";

  return (
    <div className={`flex items-center gap-2 rounded-lg border border-dashed border-border bg-card px-4 py-4 text-sm ${toneClass}`}>
      {Icon ? <Icon className="size-4 shrink-0" /> : null}
      <p className="font-medium">{message}</p>
    </div>
  );
}
