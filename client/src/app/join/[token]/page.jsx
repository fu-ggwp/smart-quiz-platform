"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import classesService from "../../../services/classes.service";

export default function JoinByTokenPage() {
  const { token } = useParams();
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  async function handleJoin() {
    setError("");
    setSubmitting(true);
    try {
      const result = await classesService.joinClass({ invitationToken: token });
      setSuccess(result);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Failed to join class.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <section className="w-full max-w-md text-center">
          <div className="mb-4 text-4xl">✓</div>
          <h1 className="mb-2 text-2xl font-semibold">
            {success.joined ? "You've joined the class!" : "Request sent!"}
          </h1>
          <p className="mb-6 text-sm text-neutral-500">
            {success.joined ? (
              <>
                You are now a member of{" "}
                <span className="font-medium text-black">{success.class.class_name}</span>
                {success.class.teacher && (
                  <> by <span className="font-medium text-blue-600">{success.class.teacher.username || success.class.teacher.full_name}</span></>
                )}.
              </>
            ) : (
              <>
                Your join request for{" "}
                <span className="font-medium text-black">{success.class.class_name}</span>
                {success.class.teacher && (
                  <> by <span className="font-medium text-blue-600">{success.class.teacher.username || success.class.teacher.full_name}</span></>
                )}{" "}
                has been sent. The teacher will review it shortly.
              </>
            )}
          </p>
          {success.joined && (
            <Link
              href="/learner/classes"
              className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
            >
              View My Classes
            </Link>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <section className="w-full max-w-md text-center">
        <h1 className="mb-2 text-2xl font-semibold">You've been invited!</h1>
        <p className="mb-8 text-sm text-neutral-500">
          Click the button below to join the class.
        </p>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex justify-center gap-3">
          <button
            onClick={handleJoin}
            disabled={submitting}
            className="rounded-lg bg-black px-6 py-3 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Joining..." : "Join Class"}
          </button>
          <Link
            href="/learner/classes"
            className="rounded-lg border border-neutral-200 px-6 py-3 text-sm hover:bg-neutral-50"
          >
            Cancel
          </Link>
        </div>
      </section>
    </main>
  );
}
