"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import classesService from "../../../services/classes.service";

export default function LearnerClassesPage() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await classesService.listJoined();
      setClasses(data ?? []);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Failed to load classes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <main className="min-h-screen px-6 py-10">
      <section className="mx-auto w-full max-w-5xl">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-semibold">My Classes</h1>
          <Link
            href="/learner/classes/join"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80"
          >
            + Join Class
          </Link>
        </div>

        {/* Loading */}
        {loading && <p className="text-sm text-muted-foreground/70">Loading classes...</p>}

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-error/10 px-4 py-3 text-sm text-error">
            {error}{" "}
            <button onClick={load} className="underline">
              Try again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && classes.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <p className="text-muted-foreground">You haven't joined any classes yet.</p>
            <Link
              href="/learner/classes/join"
              className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted"
            >
              Join your first class
            </Link>
          </div>
        )}

        {/* Class grid */}
        {!loading && !error && classes.length > 0 && (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map((cls) => (
              <li key={cls.class_id} className="min-w-0">
                <Link
                  href={`/learner/classes/${cls.class_id}`}
                  className="block rounded-xl border border-border p-5 hover:border-ring transition"
                >
                  <h2 className="mb-1 truncate text-lg font-semibold leading-tight">
                    {cls.class_name}
                  </h2>

                  {cls.teacher && (
                    <p className="truncate text-sm text-muted-foreground/70">
                      {cls.teacher.full_name || cls.teacher.username}
                    </p>
                  )}

                  {cls.description && (
                    <p className="mt-1 truncate text-sm text-muted-foreground">{cls.description}</p>
                  )}

                  {cls.grade_level && (
                    <p className="mt-1 truncate text-sm text-muted-foreground">{cls.grade_level}</p>
                  )}

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <p className="truncate text-sm text-muted-foreground/70">
                      {cls.member_count ?? 0} / {cls.learner_capacity ?? "—"} members
                    </p>
                    <p className="shrink-0 font-mono text-xs text-muted-foreground/50">
                      {cls.class_code}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

      </section>
    </main>
  );
}
