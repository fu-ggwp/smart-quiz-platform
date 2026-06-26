"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  Building2,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  PlayCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import classesService from "@/services/classes.service";
import { examsService } from "@/services/exams.service";
import { studySetsService } from "@/services/study-sets.service";

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

function getStudySetLabel(studySet) {
  if (studySet.is_assigned) return studySet.assigned_class?.class_name || "Assigned";
  if (studySet.is_owned) return "Owned";
  return "Self-study";
}

function sortByLastStudied(left, right) {
  return new Date(right.last_studied_at || 0) - new Date(left.last_studied_at || 0);
}

function normalizeStudySets(result) {
  return result?.data ?? [];
}

function normalizeExams(result) {
  const payload = result?.data ?? result;
  const items = payload?.items ?? [];
  const total = payload?.total ?? items.length;
  return { items, total };
}

async function loadDashboardData() {
  const [studySetsResult, classesResult, examsResult] = await Promise.allSettled([
    studySetsService.listLearnerStudySets(),
    classesService.listJoined(),
    examsService.listAvailable({ page: 1, pageSize: 5, sortBy: "latest" }),
  ]);

  const exams =
    examsResult.status === "fulfilled"
      ? normalizeExams(examsResult.value)
      : { items: [], total: 0 };

  return {
    studySets: {
      data: studySetsResult.status === "fulfilled" ? normalizeStudySets(studySetsResult.value) : [],
      error: studySetsResult.status === "rejected" ? getErrorMessage(studySetsResult.reason) : "",
    },
    classes: {
      data: classesResult.status === "fulfilled" ? classesResult.value ?? [] : [],
      error: classesResult.status === "rejected" ? getErrorMessage(classesResult.reason) : "",
    },
    exams: {
      data: exams.items,
      total: exams.total,
      error: examsResult.status === "rejected" ? getErrorMessage(examsResult.reason) : "",
    },
  };
}

export default function LearnerDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState({
    studySets: INITIAL_SECTION,
    classes: INITIAL_SECTION,
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

  const recentlyStudied = useMemo(
    () =>
      sections.studySets.data
        .filter((studySet) => studySet.is_started && studySet.last_studied_at)
        .sort(sortByLastStudied),
    [sections.studySets.data],
  );

  const orderedStudySets = useMemo(
    () =>
      [...sections.studySets.data].sort((left, right) => {
        if (left.is_started !== right.is_started) return left.is_started ? -1 : 1;
        if (left.is_assigned !== right.is_assigned) return left.is_assigned ? -1 : 1;
        return sortByLastStudied(left, right);
      }),
    [sections.studySets.data],
  );

  const jumpBackInStudySets = useMemo(() => {
    const itemsById = new Map();

    [...recentlyStudied, ...orderedStudySets.filter((item) => item.is_assigned), ...orderedStudySets].forEach((item) => {
      itemsById.set(getStudySetId(item), item);
    });

    return [...itemsById.values()];
  }, [orderedStudySets, recentlyStudied]);

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl space-y-7">
        <JumpBackIn loading={loading} studySets={sections.studySets} studySetsForRail={jumpBackInStudySets} />
        <AvailableExams exams={sections.exams} loading={loading} />
        <JoinedClasses classes={sections.classes} loading={loading} />
      </section>
    </main>
  );
}

function JumpBackIn({ loading, studySets, studySetsForRail }) {
  return (
    <section className="space-y-4">
      <SectionHeader
        actionHref="/learner/study-sets"
        actionLabel="All study sets"
        title="Jump Back In"
      />

      <CardRail
        emptyMessage="No study activity yet. Start with a public set or join a class."
        error={studySets.error}
        getKey={getStudySetId}
        items={studySetsForRail}
        loading={loading}
        renderItem={(studySet) => <JumpBackInCard studySet={studySet} />}
      />
    </section>
  );
}

function AvailableExams({ exams, loading }) {
  return (
    <section className="space-y-4">
      <SectionHeader
        actionHref="/learner/exams"
        actionLabel="View exams"
        title="Available Exams"
      />

      <CardRail
        emptyMessage="No available exams yet."
        error={exams.error}
        getKey={getExamId}
        items={exams.data}
        loading={loading}
        renderItem={(exam) => <ExamCard exam={exam} />}
      />
    </section>
  );
}

function JoinedClasses({ classes, loading }) {
  return (
    <section className="space-y-4">
      <SectionHeader
        actionHref="/learner/classes"
        actionLabel="View classes"
        title="Joined Classes"
      />

      <CardRail
        emptyMessage="No joined classes yet. Join a class to see teacher-assigned materials."
        error={classes.error}
        getKey={(classItem) => classItem.class_id}
        items={classes.data}
        loading={loading}
        renderItem={(classItem) => <JoinedClassCard classItem={classItem} />}
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
                <div className="flex gap-4 pr-[16%] sm:pr-[28%] lg:pr-[40%] xl:pr-[46%]">
                  {visibleItems.map((item, index) => (
                    <div
                      className="min-w-full sm:min-w-full lg:min-w-[96%] xl:min-w-[88%]"
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

function JumpBackInCard({ studySet }) {
  return (
    <article className="flex h-64 w-full flex-col rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="min-h-0 flex-1 space-y-3">
        <span className="inline-flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <BookOpen className="size-5" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">
              {getStudySetLabel(studySet)}
            </span>
            {studySet.is_started ? (
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">In progress</span>
            ) : null}
          </div>
          <h3 className="mt-3 truncate text-lg font-bold text-foreground">{studySet.title || "Untitled study set"}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {studySet.description || studySet.topic || "Open this study set to review questions and practice."}
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <p className="min-w-0 truncate text-sm font-semibold text-muted-foreground">
          {studySet.question_count ?? 0} questions
          {studySet.last_studied_at ? ` - Last studied ${formatDateTime(studySet.last_studied_at)}` : ""}
        </p>
        <div className="flex shrink-0 gap-2">
          <Button asChild size="sm">
            <Link href={`/learner/study-sets/${getStudySetId(studySet)}/flashcards`}>Continue</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={`/learner/study-sets/${getStudySetId(studySet)}`}>Details</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

function ExamCard({ exam }) {
  return (
    <article className="flex h-56 w-full flex-col rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="min-h-0 flex-1 space-y-3">
        <span className="inline-flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <CalendarClock className="size-5" />
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-lg font-bold text-foreground">{exam.title || "Untitled exam"}</h3>
          <p className="mt-1 truncate text-sm text-muted-foreground">{exam.classes?.class_name || "Class"}</p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <p className="min-w-0 truncate text-sm font-semibold text-muted-foreground">
          {formatDateTime(exam.start_at)}
          {exam.duration_minutes ? ` - ${exam.duration_minutes} minutes` : ""}
          {exam.status ? ` - ${exam.status}` : ""}
        </p>
        <Button asChild size="sm">
          <Link href={`/learner/exams/${getExamId(exam)}`}>Open</Link>
        </Button>
      </div>
    </article>
  );
}

function JoinedClassCard({ classItem }) {
  return (
    <article className="flex h-64 w-full flex-col rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="min-h-0 flex-1 space-y-3">
        <span className="inline-flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Building2 className="size-5" />
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-lg font-bold text-foreground">{classItem.class_name || "Untitled class"}</h3>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {classItem.teacher?.full_name || classItem.teacher?.username || "Teacher"}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-background p-3">
            <p className="text-xs font-bold uppercase text-muted-foreground">Members</p>
            <p className="mt-1 font-semibold text-foreground">
              {classItem.member_count ?? 0} / {classItem.learner_capacity ?? "--"}
            </p>
          </div>
          <div className="rounded-lg bg-background p-3">
            <p className="text-xs font-bold uppercase text-muted-foreground">Code</p>
            <p className="mt-1 truncate font-mono font-semibold text-foreground">{classItem.class_code || "--"}</p>
          </div>
        </div>
      </div>
      <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <p className="min-w-0 truncate text-sm font-semibold text-muted-foreground">
          {classItem.grade_level || "No grade level"}
        </p>
        <Button asChild size="sm">
          <Link href={`/learner/classes/${classItem.class_id}`}>Open</Link>
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

function StatePanel({ actionHref, actionLabel, icon: Icon, message, tone = "muted" }) {
  const toneClass = tone === "error" ? "text-destructive" : "text-muted-foreground";

  return (
    <div
      className={`mt-5 flex items-center justify-between gap-3 rounded-lg border border-dashed border-border bg-background px-4 py-6 text-sm ${toneClass}`}
    >
      <div className="flex min-w-0 items-center gap-2">
        {Icon ? <Icon className="size-4 shrink-0" /> : <ClipboardList className="size-4 shrink-0" />}
        <p className="font-medium">{message}</p>
      </div>
      {actionHref && actionLabel ? (
        <Button asChild size="xs" variant="outline">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : null}
    </div>
  );
}
