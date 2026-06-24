"use client";

import Link from "next/link";
import { AlertCircle, BookOpen, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePublicStudySets } from "@/hooks/use-public-study-sets";

function getStudySetId(studySet) {
  return studySet.study_set_id ?? studySet.id;
}

function getQuestionCount(studySet) {
  return studySet.question_count ?? studySet.questionCount ?? 0;
}

function getUpdatedLabel(studySet) {
  const value = studySet.updated_at ?? studySet.created_at;

  if (!value) return "Recently updated";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function matchesQuery(studySet, query) {
  const keyword = query.trim().toLowerCase();

  if (!keyword) return true;

  return [
    studySet.title,
    studySet.description,
    studySet.topic,
    studySet.teacher_name,
    studySet.ownerName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(keyword);
}

export function PublicStudySets({ limit, showSearch = false }) {
  const { error, loading, query, setQuery, studySets } = usePublicStudySets();
  const filteredStudySets = studySets.filter((studySet) =>
    matchesQuery(studySet, query),
  );
  const visibleStudySets = limit
    ? filteredStudySets.slice(0, limit)
    : filteredStudySets;

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">Public library</p>
          <h2 className="mt-1 text-2xl font-bold text-foreground">
            Explore public study sets
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Browse teacher-created study sets that are open for everyone to
            preview and practice.
          </p>
        </div>

        {limit ? (
          <Button asChild variant="secondary">
            <Link href="/search">
              <Search data-icon="inline-start" />
              View all
            </Link>
          </Button>
        ) : null}
      </div>

      {showSearch ? (
        <div className="max-w-xl">
          <Input
            aria-label="Search public study sets"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by title, topic, or teacher"
            value={query}
          />
        </div>
      ) : null}

      {loading ? (
        <StatePanel title="Loading public study sets" />
      ) : error ? (
        <StatePanel
          icon={<AlertCircle />}
          title="Unable to load public study sets"
          description="Please check the network connection and try again."
        />
      ) : visibleStudySets.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleStudySets.map((studySet) => (
            <StudySetCard key={getStudySetId(studySet)} studySet={studySet} />
          ))}
        </div>
      ) : (
        <StatePanel
          icon={<BookOpen />}
          title="No public study sets found"
          description={
            query
              ? "Try another keyword or clear your search."
              : "There are no public study sets available yet."
          }
        />
      )}
    </section>
  );
}

function StudySetCard({ studySet }) {
  const id = getStudySetId(studySet);

  return (
    <article className="flex min-h-52 flex-col justify-between rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="line-clamp-2 text-lg font-bold text-foreground">
              {studySet.title || "Untitled study set"}
            </h3>
          </div>
          <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
            Public
          </span>
        </div>

        <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
          {studySet.description ||
            "Practice with flashcards and questions shared by the community."}
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-4">
        <div className="flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
          <span>{studySet.topic || "No topic"}</span>
          <span>-</span>
          <span>{getQuestionCount(studySet)} questions</span>
          <span>-</span>
          <span>{getUpdatedLabel(studySet)}</span>
        </div>

        <Button asChild variant="outline">
          <Link href={id ? `/study-sets/${id}` : "/search"}>
            <BookOpen data-icon="inline-start" />
            View study set
          </Link>
        </Button>
      </div>
    </article>
  );
}

function StatePanel({ description, icon, title }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
      {icon ? (
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {icon}
        </div>
      ) : null}
      <h3 className="text-base font-bold text-foreground">{title}</h3>
      {description ? (
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}
