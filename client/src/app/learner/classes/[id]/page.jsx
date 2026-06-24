"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLearnerClassDetail } from "../../../../hooks/use-classes";

const MATERIAL_TYPES = [
  { value: "all", label: "All materials" },
  { value: "flashcard", label: "Flashcards" },
  { value: "quiz", label: "Quiz" },
  { value: "flashcard_and_quiz", label: "Flashcards & quiz" },
];

const COMPLETION_STATUSES = [
  { value: "all", label: "All statuses" },
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
];

const SORT_OPTIONS = [
  { value: "latest", label: "Latest updated" },
  { value: "title", label: "Title (A–Z)" },
];

const EMPTY_FILTERS = {
  keyword: "",
  materialType: "all",
  completion: "all",
  sortBy: "latest",
};

const STATUS_LABELS = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
};

function ProgressBar({ progress }) {
  const pct = progress?.accuracy ?? 0;
  return (
    <div className="mt-3">
      <div className="mb-1 flex items-center justify-between text-xs text-neutral-500">
        <span>{STATUS_LABELS[progress?.status] ?? "Not started"}</span>
        <span>{progress?.accuracy != null ? `${progress.accuracy}%` : "—"}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-neutral-100">
        <div
          className="h-2 rounded-full bg-emerald-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function LearnerClassDetailPage() {
  const { id } = useParams();
  const { detail, loading, error, reload } = useLearnerClassDetail(id);

  // Apply/Reset semantics per §3.3.4: edit `draft`, commit to `applied` on Apply.
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [applied, setApplied] = useState(EMPTY_FILTERS);

  const cls = detail?.class;
  const allActivities = detail?.assigned_study_sets ?? [];

  const activities = useMemo(() => {
    const keyword = applied.keyword.trim().toLowerCase();
    let list = allActivities.filter((a) => {
      if (applied.materialType !== "all" && a.practice_mode !== applied.materialType) return false;
      if (applied.completion !== "all" && a.progress?.status !== applied.completion) return false;
      if (keyword) {
        const haystack = `${a.title ?? ""} ${a.topic ?? ""} ${a.description ?? ""}`.toLowerCase();
        if (!haystack.includes(keyword)) return false;
      }
      return true;
    });
    if (applied.sortBy === "title") {
      list = [...list].sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""));
    }
    return list;
  }, [allActivities, applied]);

  const applyFilters = () => setApplied(draft);
  const resetFilters = () => {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
  };

  return (
    <main className="min-h-screen px-6 py-10">
      <section className="mx-auto w-full max-w-5xl">
        {/* Back to Classes */}
        <Link
          href="/learner/classes"
          className="mb-6 inline-flex items-center text-sm text-neutral-500 hover:text-neutral-800"
        >
          ← Back to Classes
        </Link>

        {/* Loading */}
        {loading && <p className="text-sm text-neutral-400">Loading class details...</p>}

        {/* Error (MSG13 / MSG11 / 404) */}
        {!loading && error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}{" "}
            <button onClick={reload} className="underline">
              Try again
            </button>
          </div>
        )}

        {!loading && !error && cls && (
          <>
            {/* Class Information */}
            <header className="mb-8 rounded-xl border border-neutral-200 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-semibold leading-tight">{cls.class_name}</h1>
                  {cls.teacher && (
                    <p className="mt-1 text-sm text-neutral-500">
                      {cls.teacher.full_name || cls.teacher.username}
                    </p>
                  )}
                </div>
                <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium capitalize text-neutral-600">
                  {cls.status}
                </span>
              </div>

              <dl className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-neutral-400">Subject</dt>
                  <dd className="font-medium">{cls.subject || "—"}</dd>
                </div>
                <div>
                  <dt className="text-neutral-400">Class code</dt>
                  <dd className="font-mono">{cls.class_code}</dd>
                </div>
                <div>
                  <dt className="text-neutral-400">Members</dt>
                  <dd className="font-medium">{cls.member_count ?? 0}</dd>
                </div>
                <div>
                  <dt className="text-neutral-400">Grade / level</dt>
                  <dd className="font-medium">{cls.grade_level || "—"}</dd>
                </div>
              </dl>
            </header>

            {/* Assigned activities */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Assigned study sets</h2>
              <p className="text-sm text-neutral-400">{activities.length} of {allActivities.length}</p>
            </div>

            {/* Filter bar */}
            <div className="mb-6 grid gap-3 rounded-xl border border-neutral-200 p-4 sm:grid-cols-2 lg:grid-cols-5">
              <input
                type="text"
                value={draft.keyword}
                onChange={(e) => setDraft((d) => ({ ...d, keyword: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                placeholder="Search class materials"
                className="rounded-md border border-neutral-200 px-3 py-2 text-sm lg:col-span-2"
              />
              <select
                value={draft.materialType}
                onChange={(e) => setDraft((d) => ({ ...d, materialType: e.target.value }))}
                className="rounded-md border border-neutral-200 px-3 py-2 text-sm"
              >
                {MATERIAL_TYPES.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <select
                value={draft.completion}
                onChange={(e) => setDraft((d) => ({ ...d, completion: e.target.value }))}
                className="rounded-md border border-neutral-200 px-3 py-2 text-sm"
              >
                {COMPLETION_STATUSES.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <select
                value={draft.sortBy}
                onChange={(e) => setDraft((d) => ({ ...d, sortBy: e.target.value }))}
                className="rounded-md border border-neutral-200 px-3 py-2 text-sm"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <div className="flex gap-2 lg:col-span-5">
                <button
                  onClick={applyFilters}
                  className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
                >
                  Apply
                </button>
                <button
                  onClick={resetFilters}
                  className="rounded-md border border-neutral-200 px-4 py-2 text-sm hover:bg-neutral-50"
                >
                  Reset Filters
                </button>
              </div>
            </div>

            {/* Empty state (MSG45) */}
            {allActivities.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-16 text-center">
                <p className="text-neutral-500">No study sets have been assigned to this class yet.</p>
              </div>
            ) : activities.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-16 text-center">
                <p className="text-neutral-500">No matching data was found.</p>
                <button onClick={resetFilters} className="text-sm underline">
                  Clear filters
                </button>
              </div>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2">
                {activities.map((a) => (
                  <li key={a.assignment_id}>
                    <Link
                      href={`/learner/study-sets/${a.study_set_id}`}
                      className="block h-full rounded-xl border border-neutral-200 p-5 transition hover:border-neutral-400"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-lg font-semibold leading-tight">{a.title}</h3>
                        <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
                          {a.question_count ?? 0} Qs
                        </span>
                      </div>

                      {(a.subject || a.topic) && (
                        <p className="mt-1 text-sm text-neutral-400">
                          {[a.subject, a.topic].filter(Boolean).join(" · ")}
                        </p>
                      )}

                      {a.due_at && (
                        <p className="mt-2 text-xs text-amber-600">
                          Due {new Date(a.due_at).toLocaleDateString()}
                        </p>
                      )}

                      <ProgressBar progress={a.progress} />

                      <span className="mt-4 inline-block text-sm font-medium text-neutral-700">
                        Open study set →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>
    </main>
  );
}
