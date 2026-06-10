"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { useClasses } from "../../../hooks/use-classes.js";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "name_asc", label: "Name (A → Z)" },
  { value: "name_desc", label: "Name (Z → A)" },
  { value: "members", label: "Most Members" },
];

export default function TeacherClassesPage() {
  const { classes, loading, error, reload } = useClasses();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");

  const filtered = useMemo(() => {
    let result = [...classes];

    // Search by class name
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((cls) =>
        cls.class_name?.toLowerCase().includes(q)
      );
    }

    // Sort
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
      case "members":
        result.sort((a, b) => (b.member_count ?? 0) - (a.member_count ?? 0));
        break;
      case "newest":
      default:
        result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
    }

    return result;
  }, [classes, search, sort]);

  return (
    <main className="min-h-screen px-6 py-10">
      <section className="mx-auto w-full max-w-5xl">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-semibold">My Classes</h1>
          <Link
            href="/teacher/classes/create"
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            + Create Class
          </Link>
        </div>

        {/* Search + Sort */}
        {!loading && !error && (
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by class name..."
              className="flex-1 rounded-lg border border-neutral-200 px-4 py-2 text-sm outline-none focus:border-neutral-400"
            />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-lg border border-neutral-200 px-4 py-2 text-sm outline-none focus:border-neutral-400"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <p className="text-neutral-500">Loading classes...</p>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
            {error}{" "}
            <button onClick={reload} className="underline">
              Try again
            </button>
          </div>
        )}

        {/* Empty state — no classes at all */}
        {!loading && !error && classes.length === 0 && (
          <p className="text-neutral-500">
            You haven&apos;t created any classes yet.{" "}
            <Link href="/teacher/classes/create" className="underline">
              Create your first class
            </Link>
          </p>
        )}

        {/* Empty state — search returned nothing */}
        {!loading && !error && classes.length > 0 && filtered.length === 0 && (
          <p className="text-neutral-500">
            No classes match &quot;{search}&quot;.
          </p>
        )}

        {/* Class list */}
        {!loading && filtered.length > 0 && (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((cls) => (
              <li key={cls.class_id}>
                <Link
                  href={`/teacher/classes/${cls.class_id}`}
                  className="block rounded-xl border border-neutral-200 p-5 hover:border-neutral-400 transition"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h2 className="font-semibold text-lg leading-tight">
                      {cls.class_name}
                    </h2>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                        cls.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      {cls.status}
                    </span>
                  </div>

                  {cls.subject && (
                    <p className="text-sm text-neutral-500">{cls.subject}</p>
                  )}
                  {cls.grade_level && (
                    <p className="text-sm text-neutral-500">{cls.grade_level}</p>
                  )}

                  <p className="mt-3 text-sm text-neutral-400">
                    {cls.member_count ?? 0} /{" "}
                    {cls.learner_capacity ?? "—"} members
                  </p>

                  <p className="mt-1 text-xs text-neutral-400">
                    Code: <span className="font-mono">{cls.class_code}</span>
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}

      </section>
    </main>
  );
}
