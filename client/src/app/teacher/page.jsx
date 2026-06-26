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
} from "lucide-react";

import { Button } from "@/components/ui/button";
import classesService from "@/services/classes.service";
import { examsService } from "@/services/exams.service";
import { studySetsService } from "@/services/study-sets.service";

const QUICK_ACTIONS = [
  {
    label: "Create Class",
    description: "Start a new learning space.",
    href: "/teacher/classes/create",
    icon: Building2,
  },
  {
    label: "Create Question Bank",
    description: "Prepare reusable questions.",
    href: "/teacher/question-banks/create",
    icon: LibraryBig,
  },
  {
    label: "Create Study Set",
    description: "Turn questions into practice.",
    href: "/teacher/study-sets/create",
    icon: BookOpen,
  },
  {
    label: "Create Exam",
    description: "Schedule an assessment.",
    href: "/teacher/exams/create",
    icon: GraduationCap,
  },
];

const INITIAL_SECTION = { data: [], error: "" };

function getErrorMessage(error) {
  return error?.response?.data?.error || error?.message || "Unable to load data.";
}

function getStudySetId(studySet) {
  return studySet.study_set_id ?? studySet.id;
}

function getExamId(exam) {
  return exam.exam_session_id ?? exam.id;
}

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

function normalizeStudySets(result) {
  const payload = result?.data ?? result;
  const items = payload?.items ?? [];
  const total = payload?.pagination?.total ?? items.length;
  return { items, total };
}

function normalizeExams(result) {
  const payload = result?.data ?? result;
  const items = payload?.items ?? [];
  const total = payload?.total ?? items.length;
  return { items, total };
}

async function loadDashboardData() {
  const [classesResult, studySetsResult, examsResult] = await Promise.allSettled([
    classesService.listMine(),
    studySetsService.listMine({ page: 1, limit: 5, sortBy: "latest" }),
    examsService.listMine({ page: 1, pageSize: 5, sortBy: "latest" }),
  ]);

  const studySets =
    studySetsResult.status === "fulfilled"
      ? normalizeStudySets(studySetsResult.value)
      : { items: [], total: 0 };
  const exams =
    examsResult.status === "fulfilled"
      ? normalizeExams(examsResult.value)
      : { items: [], total: 0 };

  return {
    classes: {
      data: classesResult.status === "fulfilled" ? classesResult.value ?? [] : [],
      error: classesResult.status === "rejected" ? getErrorMessage(classesResult.reason) : "",
    },
    studySets: {
      data: studySets.items,
      total: studySets.total,
      error: studySetsResult.status === "rejected" ? getErrorMessage(studySetsResult.reason) : "",
    },
    exams: {
      data: exams.items,
      total: exams.total,
      error: examsResult.status === "rejected" ? getErrorMessage(examsResult.reason) : "",
    },
  };
}

export default function TeacherDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState({
    classes: INITIAL_SECTION,
    studySets: { ...INITIAL_SECTION, total: 0 },
    exams: { ...INITIAL_SECTION, total: 0 },
  });

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      const data = await loadDashboardData();
      if (!ignore) {
        setSections(data);
        setLoading(false);
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, []);

  const recentClasses = useMemo(
    () =>
      [...sections.classes.data]
        .sort((left, right) => new Date(right.created_at) - new Date(left.created_at))
        .slice(0, 5),
    [sections.classes.data],
  );

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl space-y-7">
        <QuickActions />

        <TeachingWorkflow
          exams={sections.exams}
          loading={loading}
          studySets={sections.studySets}
        />

        <ManagedClasses classes={recentClasses} error={sections.classes.error} loading={loading} />
      </section>
    </main>
  );
}

function QuickActions() {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {QUICK_ACTIONS.map((action) => {
        const Icon = action.icon;

        return (
          <Link
            className="group rounded-lg border border-border bg-card p-4 shadow-sm transition hover:border-ring/50 hover:bg-muted/40"
            href={action.href}
            key={action.href}
          >
            <div className="flex items-start justify-between gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
            </div>
            <h2 className="mt-4 text-sm font-bold text-foreground">{action.label}</h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{action.description}</p>
          </Link>
        );
      })}
    </div>
  );
}

function TeachingWorkflow({ exams, loading, studySets }) {
  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <SectionHeader
        actionHref="/teacher/exams"
        actionLabel="View exams"
        description="Recent resources and scheduled work."
        title="Teaching Workflow"
      />

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <ResourceList
          emptyMessage="No study sets yet. Create one from a question bank when ready."
          error={studySets.error}
          getHref={(item) => `/teacher/study-sets/${getStudySetId(item)}`}
          getMeta={(item) => `${item.question_count ?? 0} questions`}
          getTitle={(item) => item.title}
          icon={BookOpen}
          items={studySets.data}
          loading={loading}
          title="Recent Study Sets"
        />

        <ResourceList
          emptyMessage="No exam sessions yet. Create an exam when your class is ready."
          error={exams.error}
          getHref={(item) => `/teacher/exams/${getExamId(item)}`}
          getMeta={(item) => `${item.classes?.class_name ?? "Unassigned class"} - ${formatDateTime(item.start_at)}`}
          getTitle={(item) => item.title}
          icon={CalendarClock}
          items={exams.data}
          loading={loading}
          title="Latest Exams"
        />
      </div>
    </section>
  );
}

function ManagedClasses({ classes, error, loading }) {
  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <SectionHeader
        actionHref="/teacher/classes"
        actionLabel="Manage all"
        description="Open class details, manage members, or share invites."
        title="Managed Classes"
      />

      {loading ? <StatePanel message="Loading managed classes..." /> : null}
      {!loading && error ? <StatePanel icon={AlertCircle} message={error} tone="error" /> : null}
      {!loading && !error && classes.length === 0 ? (
        <StatePanel message="No classes yet. Create your first class to start teaching." />
      ) : null}

      {!loading && !error && classes.length > 0 ? (
        <div className="mt-5 overflow-hidden rounded-lg border border-border">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] table-fixed text-left text-sm">
              <thead className="bg-muted text-xs font-bold uppercase text-muted-foreground">
                <tr>
                  <th className="w-[34%] px-4 py-3">Class</th>
                  <th className="w-[18%] px-4 py-3">Subject</th>
                  <th className="w-[18%] px-4 py-3">Members</th>
                  <th className="w-[14%] px-4 py-3">Code</th>
                  <th className="w-[16%] px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {classes.map((classItem) => (
                  <tr className="align-middle transition hover:bg-muted/40" key={classItem.class_id}>
                    <td className="px-4 py-4">
                      <p className="truncate font-bold text-foreground">{classItem.class_name}</p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {classItem.grade_level || "No grade level"}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      <span className="line-clamp-1">{classItem.subject || "General"}</span>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {classItem.member_count ?? 0} / {classItem.learner_capacity ?? "--"}
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-muted-foreground">
                      {classItem.class_code || "--"}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <Button asChild size="xs" variant="outline">
                          <Link href={`/teacher/classes/${classItem.class_id}`}>Open</Link>
                        </Button>
                        <Button asChild size="xs" variant="ghost">
                          <Link href={`/teacher/classes/${classItem.class_id}/members`}>Members</Link>
                        </Button>
                        <Button asChild size="xs" variant="ghost">
                          <Link href={`/teacher/classes/${classItem.class_id}/invite`}>Invite</Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function ResourceList({ emptyMessage, error, getHref, getMeta, getTitle, icon: Icon, items, loading, title }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-foreground">{title}</h3>
      <div className="mt-3 space-y-2">
        {loading ? <StatePanel message="Loading..." compact /> : null}
        {!loading && error ? <StatePanel icon={AlertCircle} message={error} tone="error" compact /> : null}
        {!loading && !error && items.length === 0 ? <StatePanel message={emptyMessage} compact /> : null}
        {!loading && !error
          ? items.slice(0, 5).map((item) => (
              <Link
                className="flex items-center gap-3 rounded-lg border border-border bg-background p-3 transition hover:border-ring/50 hover:bg-muted/40"
                href={getHref(item)}
                key={getHref(item)}
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-foreground">{getTitle(item) || "Untitled"}</span>
                  <span className="block truncate text-xs text-muted-foreground">{getMeta(item)}</span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            ))
          : null}
      </div>
    </div>
  );
}

function SectionHeader({ actionHref, actionLabel, description, title }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <Button asChild size="sm" variant="outline">
        <Link href={actionHref}>{actionLabel}</Link>
      </Button>
    </div>
  );
}

function StatePanel({ compact = false, icon: Icon, message, tone = "muted" }) {
  const toneClass = tone === "error" ? "text-destructive" : "text-muted-foreground";

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border border-dashed border-border bg-background ${
        compact ? "px-3 py-3 text-xs" : "mt-5 px-4 py-6 text-sm"
      } ${toneClass}`}
    >
      {Icon ? <Icon className="size-4 shrink-0" /> : null}
      <p className="font-medium">{message}</p>
    </div>
  );
}
