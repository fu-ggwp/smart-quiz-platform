"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import classesService from "../../../../services/classes.service";

export default function JoinClassPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null); // { joined, class }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess(null);

    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setError("Please enter a class code.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await classesService.joinClass({ classCode: trimmed });
      setSuccess(result);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Failed to join class.");
    } finally {
      setSubmitting(false);
    }
  }

  // Success state
  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <section className="w-full max-w-md text-center">
          <div className="mb-4 text-4xl">✓</div>
          <h1 className="mb-2 text-2xl font-semibold">
            {success.joined ? "You've joined the class!" : "Request sent!"}
          </h1>
          <p className="mb-6 text-sm text-muted-foreground">
            {success.joined ? (
              <>
                You are now a member of{" "}
                <span className="font-medium text-black">{success.class.class_name}</span>
                {success.class.teacher && (
                  <> by <span className="font-medium text-info">{success.class.teacher.username || success.class.teacher.full_name}</span></>
                )}.
              </>
            ) : (
              <>
                Your join request for{" "}
                <span className="font-medium text-black">{success.class.class_name}</span>
                {success.class.teacher && (
                  <> by <span className="font-medium text-info">{success.class.teacher.username || success.class.teacher.full_name}</span></>
                )}{" "}
                has been sent. The teacher will review it shortly.
              </>
            )}
          </p>
          <div className="flex justify-center gap-3">
            {success.joined && (
              <Link
                href="/learner/classes"
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/80"
              >
                View My Classes
              </Link>
            )}
            <button
              onClick={() => { setSuccess(null); setCode(""); }}
              className="rounded-lg border border-border px-5 py-2.5 text-sm hover:bg-muted"
            >
              Join Another
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <section className="w-full max-w-md">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Join a Class</h1>
          <Link
            href="/learner/classes"
            className="text-sm text-muted-foreground/70 hover:text-foreground"
          >
            ← Back
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Class Code</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. AB3X9Z"
              maxLength={6}
              className="rounded-lg border border-border px-4 py-3 font-mono text-lg tracking-widest outline-none focus:border-ring uppercase"
            />
            <p className="text-xs text-muted-foreground/70">
              Enter the 6-character code provided by your teacher.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting || code.trim().length === 0}
            className="rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Joining..." : "Join Class"}
          </button>
        </form>

      </section>

      {/* In-page popup for join errors (e.g. owner trying to join own class) */}
      {error && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-card p-6 shadow-xl">
            <h3 className="text-base font-semibold text-foreground">
              Cannot join class
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setError("")}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
