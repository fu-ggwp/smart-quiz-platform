"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { AppPagination } from "@/components/common/app-pagination";
import { useClasses } from "../../../hooks/use-classes.js";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "name_asc", label: "Name (A → Z)" },
  { value: "name_desc", label: "Name (Z → A)" },
];

const PAGE_SIZE = 9;

export default function TeacherClassesPage() {
  const { classes, loading, error, reload } = useClasses();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let result = [...classes];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((cls) =>
        cls.class_name?.toLowerCase().includes(q)
      );
    }

    switch (sort) {
      case "oldest":
        result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case "name_asc":
        result.sort((a, b) => a.class_name?.localeCompare(b.class_name));
        break;
      case "name_desc":
        result.sort((a, b) => b.class_name?.localeCompare(a.class_name));
        break;
      case "newest":
      default:
        result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
    }

    return result;
  }, [classes, search, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Reset to page 1 when search or sort changes
  function handleSearch(e) {
    setSearch(e.target.value);
    setPage(1);
  }

  function handleSort(e) {
    setSort(e.target.value);
    setPage(1);
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <section className="mx-auto w-full max-w-5xl">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-semibold">My Classes</h1>
          <Link
            href="/teacher/classes/create"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80"
          >
            + Create Class
          </Link>
        </div>

        {/* Search + Sort */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder="Search by class name..."
            className="flex-1 rounded-lg border border-border px-4 py-2 text-sm outline-none focus:border-ring"
          />
          <select
            value={sort}
            onChange={handleSort}
            className="rounded-lg border border-border px-4 py-2 text-sm outline-none focus:border-ring"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Loading */}
        {loading && (
          <p className="text-muted-foreground">Loading classes...</p>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-md bg-error/10 p-4 text-sm text-error">
            {error}{" "}
            <button onClick={reload} className="underline">
              Try again
            </button>
          </div>
        )}

        {/* Empty state — no classes at all */}
        {!loading && !error && classes.length === 0 && (
          <p className="text-muted-foreground">
            You haven&apos;t created any classes yet.{" "}
            <Link href="/teacher/classes/create" className="underline">
              Create your first class
            </Link>
          </p>
        )}

        {/* Empty state — search returned nothing */}
        {!loading && !error && classes.length > 0 && filtered.length === 0 && (
          <p className="text-muted-foreground">
            No classes match &quot;{search}&quot;.
          </p>
        )}

        {/* Class list */}
        {!loading && paginated.length > 0 && (
          <>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {paginated.map((cls) => (
                <li key={cls.class_id} className="relative">
                  <Link
                    href={`/teacher/classes/${cls.class_id}/edit`}
                    className="absolute right-3 top-3 z-10 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground hover:border-ring"
                  >
                    Edit
                  </Link>
                  <Link
                    href={`/teacher/classes/${cls.class_id}`}
                    className="block rounded-xl border border-border p-5 hover:border-ring transition"
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h2 className="font-semibold text-lg leading-tight">
                        {cls.class_name}
                      </h2>

                    </div>

                    {cls.grade_level && (
                      <p className="text-sm text-muted-foreground">{cls.grade_level}</p>
                    )}

                    <p className="mt-3 text-sm text-muted-foreground/70">
                      {cls.member_count ?? 0} /{" "}
                      {cls.learner_capacity ?? "—"} members
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground/70">
                      Code: <span className="font-mono">{cls.class_code}</span>
                    </p>
                  </Link>
                </li>
              ))}
            </ul>

            <AppPagination
              className="mt-6"
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </>
        )}

      </section>
    </main>
  );
}
