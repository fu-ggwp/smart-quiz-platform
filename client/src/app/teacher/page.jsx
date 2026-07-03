"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Building2,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
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

        <RecentStudySetsSection loading={loading} studySets={sections.studySets} />
        <LatestExamsSection exams={sections.exams} loading={loading} />
        <ManagedClassesSection classes={recentClasses} error={sections.classes.error} loading={loading} />
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

function RecentStudySetsSection({ loading, studySets }) {
  return (
    <section className="space-y-4">
      <SectionHeader
        actionHref="/teacher/study-sets"
        actionLabel="View all"
        title="Recent Study Sets"
      />

      <CardRail
        emptyMessage="No study sets yet. Create one from a question bank when ready."
        error={studySets.error}
        getKey={getStudySetId}
        items={studySets.data}
        loading={loading}
        renderItem={(studySet) => <StudySetCard studySet={studySet} />}
      />
    </section>
  );
}

function LatestExamsSection({ exams, loading }) {
  return (
    <section className="space-y-4">
      <SectionHeader
        actionHref="/teacher/exams"
        actionLabel="View exams"
        title="Latest Exams"
      />

      <CardRail
        emptyMessage="No exam sessions yet. Create an exam when your class is ready."
        error={exams.error}
        getKey={getExamId}
        items={exams.data}
        loading={loading}
        renderItem={(exam) => <ExamCard exam={exam} />}
      />
    </section>
  );
}

function ManagedClassesSection({ classes, error, loading }) {
  return (
    <section className="space-y-4">
      <SectionHeader
        actionHref="/teacher/classes"
        actionLabel="Manage all"
        title="Managed Classes"
      />

      <CardRail
        emptyMessage="No classes yet. Create your first class to start teaching."
        error={error}
        getKey={(classItem) => classItem.class_id}
        items={classes}
        loading={loading}
        renderItem={(classItem) => <ClassCard classItem={classItem} />}
      />
    </section>
  );
}

function CardRail({ emptyMessage, error, getKey, items, loading, renderItem }) {
  const visibleItems = items.slice(0, 5);
  const [activeIndex, setActiveIndex] = useState(0);
  const cardRefs = useRef([]);
  const safeActiveIndex = Math.min(activeIndex, Math.max(visibleItems.length - 1, 0));
  const canMove = visibleItems.length > 1;

  function showCard(index) {
    const isFirstCard = index === 0;
    const isLastCard = index === visibleItems.length - 1;

    setActiveIndex(index);
    cardRefs.current[index]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: isFirstCard ? "start" : isLastCard ? "end" : "center",
    });
  }

  function showPrevious() {
    const previousIndex = safeActiveIndex === 0 ? visibleItems.length - 1 : safeActiveIndex - 1;
    showCard(previousIndex);
  }

  function showNext() {
    showCard((safeActiveIndex + 1) % visibleItems.length);
  }

  return (
    <div>
      {loading ? <StatePanel message="Loading..." /> : null}
      {!loading && error ? <StatePanel icon={AlertCircle} message={error} tone="error" /> : null}
      {!loading && !error && items.length === 0 ? <StatePanel message={emptyMessage} /> : null}
      {!loading && !error && visibleItems.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {canMove && safeActiveIndex > 0 ? (
              <Button
                aria-label="Previous card"
                className="hidden shrink-0 sm:inline-flex"
                onClick={showPrevious}
                size="icon"
                type="button"
                variant="outline"
              >
                <ChevronLeft className="size-4" />
              </Button>
            ) : null}

            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex gap-4 pr-[22%] sm:pr-[36%] lg:pr-[48%] xl:pr-[54%]">
                  {visibleItems.map((item, index) => (
                    <div
                      className="min-w-full sm:min-w-full lg:min-w-[91%] xl:min-w-[81%]"
                      key={getKey(item)}
                      ref={(node) => {
                        cardRefs.current[index] = node;
                      }}
                    >
                      {renderItem(item)}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Button
              aria-label="Next card"
              className="shrink-0"
              disabled={!canMove}
              onClick={showNext}
              size="icon"
              type="button"
              variant="outline"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          {canMove ? (
            <div className="flex items-center justify-center gap-2">
              {visibleItems.map((item, index) => (
                <button
                  aria-label={`Show card ${index + 1}`}
                  className={`size-2 rounded-full transition ${
                    index === safeActiveIndex ? "bg-primary" : "bg-muted hover:bg-muted-foreground/40"
                  }`}
                  key={getKey(item)}
                  onClick={() => showCard(index)}
                  type="button"
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function StudySetCard({ studySet }) {
  return (
    <article className="flex min-h-48 w-full flex-col justify-between rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="space-y-3">
        <span className="inline-flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <BookOpen className="size-5" />
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-lg font-bold text-foreground">{studySet.title || "Untitled study set"}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {studySet.topic || studySet.description || "No topic provided"}
          </p>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-muted-foreground">{studySet.question_count ?? 0} questions</p>
        <Button asChild size="sm">
          <Link href={`/teacher/study-sets/${getStudySetId(studySet)}`}>Open</Link>
        </Button>
      </div>
    </article>
  );
}

function ExamCard({ exam }) {
  return (
    <article className="flex min-h-48 w-full flex-col justify-between rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="space-y-3">
        <span className="inline-flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <CalendarClock className="size-5" />
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-lg font-bold text-foreground">{exam.title || "Untitled exam"}</h3>
          <p className="mt-1 truncate text-sm text-muted-foreground">{exam.classes?.class_name || "Unassigned class"}</p>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="min-w-0 truncate text-sm font-semibold text-muted-foreground">
          {formatDateTime(exam.start_at)}
          {exam.duration_minutes ? ` - ${exam.duration_minutes} minutes` : ""}
        </p>
        <Button asChild size="sm">
          <Link href={`/teacher/exams/${getExamId(exam)}`}>Open</Link>
        </Button>
      </div>
    </article>
  );
}

function ClassCard({ classItem }) {
  return (
    <article className="flex min-h-52 w-full flex-col justify-between rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="space-y-3">
        <span className="inline-flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Building2 className="size-5" />
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-lg font-bold text-foreground">{classItem.class_name || "Untitled class"}</h3>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {classItem.grade_level || "General class"}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-background p-3">
            <p className="text-xs font-bold uppercase text-muted-foreground">Members</p>
            <p className="mt-1 font-semibold text-foreground">{classItem.member_count ?? 0} / {classItem.learner_capacity ?? "--"}</p>
          </div>
          <div className="rounded-lg bg-background p-3">
            <p className="text-xs font-bold uppercase text-muted-foreground">Code</p>
            <p className="mt-1 truncate font-mono font-semibold text-foreground">{classItem.class_code || "--"}</p>
          </div>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button asChild size="sm">
          <Link href={`/teacher/classes/${classItem.class_id}`}>Open</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href={`/teacher/classes/${classItem.class_id}/members`}>Members</Link>
        </Button>
        <Button asChild size="sm" variant="ghost">
          <Link href={`/teacher/classes/${classItem.class_id}/invite`}>Invite</Link>
        </Button>
      </div>
    </article>
  );
}

function SectionHeader({ actionHref, actionLabel, title }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
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
