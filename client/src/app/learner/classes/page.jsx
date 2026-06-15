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
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            + Join Class
          </Link>
        </div>

        {/* Loading */}
        {loading && <p className="text-sm text-neutral-400">Loading classes...</p>}

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}{" "}
            <button onClick={load} className="underline">
              Try again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && classes.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <p className="text-neutral-500">You haven't joined any classes yet.</p>
            <Link
              href="/learner/classes/join"
              className="rounded-lg border border-neutral-200 px-4 py-2 text-sm hover:bg-neutral-50"
            >
              Join your first class
            </Link>
          </div>
        )}

        {/* Class grid */}
        {!loading && !error && classes.length > 0 && (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map((cls) => (
              <li key={cls.class_id}>
                <Link
                  href={`/learner/classes/${cls.class_id}`}
                  className="block rounded-xl border border-neutral-200 p-5 hover:border-neutral-400 transition"
                >
                  <h2 className="mb-1 text-lg font-semibold leading-tight">
                    {cls.class_name}
                  </h2>

                  {cls.teacher && (
                    <p className="text-sm text-neutral-400">
                      {cls.teacher.full_name || cls.teacher.username}
                    </p>
                  )}

                  {cls.grade_level && (
                    <p className="mt-1 text-sm text-neutral-500">{cls.grade_level}</p>
                  )}

                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-sm text-neutral-400">
                      {cls.member_count ?? 0} / {cls.learner_capacity ?? "—"} members
                    </p>
                    <p className="font-mono text-xs text-neutral-300">
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
