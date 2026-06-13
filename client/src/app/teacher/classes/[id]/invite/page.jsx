"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import classesService from "../../../../../services/classes.service";

export default function ClassInvitePage() {
  const { id } = useParams();

  const [cls, setCls] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [codeCopied, setCodeCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await classesService.getOne(id);
      setCls(data);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Failed to load class.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  function copyText(text, setCopied) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const inviteLink = cls?.invitation_token
    ? `${window.location.origin}/join/${cls.invitation_token}`
    : null;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-neutral-400">Loading...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3">
        <p className="text-sm text-red-500">{error}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto w-full max-w-xl space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Invite Learners</h1>
          <Link
            href={`/teacher/classes/${id}`}
            className="text-sm text-neutral-400 hover:text-neutral-700"
          >
            ← Back to class
          </Link>
        </div>

        {/* Class Code */}
        <div className="rounded-xl border border-neutral-200 p-5">
          <h2 className="mb-1 text-sm font-semibold text-neutral-700">Class Code</h2>
          <p className="mb-4 text-xs text-neutral-400">
            Share this code with your students. They can enter it on the Join Class page.
          </p>
          <div className="flex items-center justify-between gap-4 rounded-lg bg-neutral-50 px-5 py-4">
            <span className="font-mono text-3xl font-bold tracking-widest text-neutral-900">
              {cls.class_code}
            </span>
            <button
              onClick={() => copyText(cls.class_code, setCodeCopied)}
              className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm hover:bg-neutral-50"
            >
              {codeCopied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {/* Invitation Link */}
        {inviteLink && (
          <div className="rounded-xl border border-neutral-200 p-5">
            <h2 className="mb-1 text-sm font-semibold text-neutral-700">Invitation Link</h2>
            <p className="mb-4 text-xs text-neutral-400">
              Anyone with this link can join the class directly (subject to your join policy).
            </p>
            <div className="flex items-center gap-3">
              <input
                readOnly
                value={inviteLink}
                className="flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-xs text-neutral-600 outline-none"
              />
              <button
                onClick={() => copyText(inviteLink, setLinkCopied)}
                className="shrink-0 rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm hover:bg-neutral-50"
              >
                {linkCopied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
