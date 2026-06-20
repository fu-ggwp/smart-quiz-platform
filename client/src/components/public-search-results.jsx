"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertCircle, BookOpen, Search, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { studySetsService } from "@/services/study-sets.service";
import { usersService } from "@/services/users.service";

const PAGE_SIZE = 9;

const EMPTY_PAGE = {
  items: [],
  pagination: {
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  },
};

function unwrapPage(payload) {
  if (Array.isArray(payload)) {
    return {
      items: payload,
      pagination: {
        ...EMPTY_PAGE.pagination,
        total: payload.length,
        totalPages: 1,
      },
    };
  }

  return {
    items: payload?.items ?? [],
    pagination: payload?.pagination ?? EMPTY_PAGE.pagination,
  };
}

function getStudySetId(studySet) {
  return studySet.study_set_id ?? studySet.id;
}

function getQuestionCount(studySet) {
  return studySet.question_count ?? studySet.questionCount ?? 0;
}

function formatShortDate(value) {
  if (!value) return "Recently updated";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function getTotalLabel(pagination, noun) {
  const total = pagination?.total ?? 0;
  return `${total} ${noun}${total === 1 ? "" : "s"}`;
}

export function PublicSearchResults() {
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [studySetPage, setStudySetPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [studySets, setStudySets] = useState(EMPTY_PAGE);
  const [users, setUsers] = useState(EMPTY_PAGE);
  const [studySetLoading, setStudySetLoading] = useState(true);
  const [userLoading, setUserLoading] = useState(true);
  const [studySetError, setStudySetError] = useState(null);
  const [userError, setUserError] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadStudySets() {
      setStudySetLoading(true);

      try {
        const { data } = await studySetsService.listPublic({
          q: query,
          page: studySetPage,
          limit: PAGE_SIZE,
        });

        if (active) {
          setStudySets(unwrapPage(data));
          setStudySetError(null);
        }
      } catch (err) {
        if (active) setStudySetError(err);
      } finally {
        if (active) setStudySetLoading(false);
      }
    }

    loadStudySets();

    return () => {
      active = false;
    };
  }, [query, studySetPage]);

  useEffect(() => {
    let active = true;

    async function loadUsers() {
      setUserLoading(true);

      try {
        const { data } = await usersService.listPublic({
          q: query,
          page: userPage,
          limit: PAGE_SIZE,
        });

        if (active) {
          setUsers(unwrapPage(data));
          setUserError(null);
        }
      } catch (err) {
        if (active) setUserError(err);
      } finally {
        if (active) setUserLoading(false);
      }
    }

    loadUsers();

    return () => {
      active = false;
    };
  }, [query, userPage]);

  function handleSubmit(event) {
    event.preventDefault();
    setQuery(queryInput.trim());
    setStudySetPage(1);
    setUserPage(1);
  }

  return (
    <div className="flex flex-col gap-8">
      <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
        <Input
          aria-label="Search public study sets and users"
          className="sm:max-w-xl"
          onChange={(event) => setQueryInput(event.target.value)}
          placeholder="Search study sets or public users"
          value={queryInput}
        />
        <Button type="submit">
          <Search data-icon="inline-start" />
          Search
        </Button>
      </form>

      <ResultSection
        countLabel={getTotalLabel(studySets.pagination, "study set")}
        description="Public learning materials available to guests and learners."
        error={studySetError}
        loading={studySetLoading}
        onPageChange={setStudySetPage}
        page={studySets.pagination?.page ?? 1}
        title="Public study sets"
        totalPages={studySets.pagination?.totalPages ?? 1}
      >
        {studySets.items.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {studySets.items.map((studySet) => (
              <StudySetCard key={getStudySetId(studySet)} studySet={studySet} />
            ))}
          </div>
        ) : (
          <StatePanel
            icon={<BookOpen />}
            title="No public study sets found"
            description="Try another keyword or broaden your search."
          />
        )}
      </ResultSection>

      <ResultSection
        countLabel={getTotalLabel(users.pagination, "user")}
        description="Active public accounts matching your keyword."
        error={userError}
        loading={userLoading}
        onPageChange={setUserPage}
        page={users.pagination?.page ?? 1}
        title="Public users"
        totalPages={users.pagination?.totalPages ?? 1}
      >
        {users.items.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {users.items.map((user) => (
              <UserCard key={user.username} user={user} />
            ))}
          </div>
        ) : (
          <StatePanel
            icon={<UserRound />}
            title="No public users found"
            description="Try another name or username."
          />
        )}
      </ResultSection>
    </div>
  );
}

function ResultSection({
  children,
  countLabel,
  description,
  error,
  loading,
  onPageChange,
  page,
  title,
  totalPages,
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold text-foreground">{title}</h2>
            <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
              {countLabel}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>

        <Pager page={page} totalPages={totalPages} onPageChange={onPageChange} />
      </div>

      {loading ? (
        <StatePanel title={`Loading ${title.toLowerCase()}`} />
      ) : error ? (
        <StatePanel
          icon={<AlertCircle />}
          title={`Unable to load ${title.toLowerCase()}`}
          description="Please check the connection and try again."
        />
      ) : (
        children
      )}
    </section>
  );
}

function Pager({ onPageChange, page, totalPages }) {
  const safeTotalPages = Math.max(totalPages || 1, 1);
  const safePage = Math.min(Math.max(page || 1, 1), safeTotalPages);
  const canGoPrevious = safePage > 1;
  const canGoNext = safePage < safeTotalPages;

  function handlePageClick(event, nextPage, enabled) {
    event.preventDefault();
    if (enabled) onPageChange(nextPage);
  }

  return (
    <Pagination className="mx-0 w-auto justify-start sm:justify-end">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            aria-disabled={!canGoPrevious}
            className={!canGoPrevious ? "pointer-events-none opacity-50" : undefined}
            href="#"
            onClick={(event) => handlePageClick(event, safePage - 1, canGoPrevious)}
          />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#" isActive onClick={(event) => event.preventDefault()}>
            {safePage} / {safeTotalPages}
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext
            aria-disabled={!canGoNext}
            className={!canGoNext ? "pointer-events-none opacity-50" : undefined}
            href="#"
            onClick={(event) => handlePageClick(event, safePage + 1, canGoNext)}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

function StudySetCard({ studySet }) {
  const id = getStudySetId(studySet);
  const href = id ? `/study-sets/${id}` : "/search";

  return (
    <Link
      className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      href={href}
    >
      <article className="flex min-h-52 flex-col justify-between rounded-lg border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/60 hover:bg-accent/30">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                {studySet.subject || "General"}
              </p>
              <h3 className="mt-1 line-clamp-2 text-lg font-bold text-foreground">
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

        <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
          <span>{studySet.topic || "No topic"}</span>
          <span>-</span>
          <span>{getQuestionCount(studySet)} questions</span>
          <span>-</span>
          <span>{formatShortDate(studySet.updated_at ?? studySet.created_at)}</span>
        </div>
      </article>
    </Link>
  );
}

function UserCard({ user }) {
  const initial = (user.full_name || user.username || "?").charAt(0).toUpperCase();
  const href = user.username ? `/users/${user.username}` : "/search";

  return (
    <Link
      className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      href={href}
    >
      <article className="flex min-h-44 flex-col justify-between rounded-lg border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/60 hover:bg-accent/30">
        <div className="flex items-start gap-3">
          {user.avatar_url ? (
            <div
              aria-hidden="true"
              className="size-12 rounded-full border border-border bg-cover bg-center"
              style={{ backgroundImage: `url(${user.avatar_url})` }}
            />
          ) : (
            <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-base font-bold text-secondary-foreground">
              {initial}
            </div>
          )}

          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold text-foreground">
              {user.full_name || user.username || "Public user"}
            </h3>
            <p className="truncate text-sm font-semibold text-muted-foreground">
              @{user.username}
            </p>
            <p className="mt-2 text-xs font-semibold text-muted-foreground">
              Joined {formatShortDate(user.created_at)}
            </p>
          </div>
        </div>
      </article>
    </Link>
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
