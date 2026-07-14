"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import classesService from "../../../../../services/classes.service";

export default function ClassMembersPage() {
  const { id } = useParams();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removing, setRemoving] = useState(null); // class_member_id currently being removed
  const [confirmTarget, setConfirmTarget] = useState(null); // member pending removal confirmation
  const [removeError, setRemoveError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await classesService.listMembers(id);
      setMembers(data);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Failed to load members.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  function handleRemove(member) {
    setRemoveError("");
    setConfirmTarget(member);
  }

  async function confirmRemove() {
    const member = confirmTarget;
    if (!member) return;

    setRemoving(member.class_member_id);
    setRemoveError("");
    try {
      await classesService.removeMember(id, member.class_member_id);
      setMembers((prev) => prev.filter((m) => m.class_member_id !== member.class_member_id));
      setConfirmTarget(null);
    } catch (err) {
      setRemoveError(err?.response?.data?.error || err.message || "Failed to remove member.");
    } finally {
      setRemoving(null);
    }
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto w-full max-w-3xl">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Members</h1>
          <Link
            href={`/teacher/classes/${id}`}
            className="text-sm text-muted-foreground/70 hover:text-foreground"
          >
            ← Back to class
          </Link>
        </div>

        {loading && <p className="text-sm text-muted-foreground/70">Loading...</p>}
        {error && <p className="text-sm text-error">{error}</p>}

        {!loading && !error && members.length === 0 && (
          <p className="text-sm text-muted-foreground/70">No members yet.</p>
        )}

        {!loading && !error && members.length > 0 && (
          <div className="rounded-xl border border-border">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-4 border-b border-border px-5 py-3">
              <span className="text-xs font-medium text-muted-foreground/70">Name</span>
              <span className="text-xs font-medium text-muted-foreground/70">Email</span>
              <span className="text-xs font-medium text-muted-foreground/70">Joined</span>
              <span className="text-xs font-medium text-muted-foreground/70"></span>
            </div>

            {/* Rows */}
            <ul className="divide-y divide-neutral-100">
              {members.map((m) => (
                <li
                  key={m.class_member_id}
                  className="grid grid-cols-[1fr_1fr_auto_auto] items-center gap-4 px-5 py-3"
                >
                  {/* Avatar + name */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                      {(m.user?.full_name || m.user?.username || "?")[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {m.user?.full_name || m.user?.username || "Unknown"}
                    </span>
                  </div>

                  {/* Email */}
                  <span className="truncate text-sm text-muted-foreground">
                    {m.user?.email ?? "—"}
                  </span>

                  {/* Joined at */}
                  <span className="text-xs text-muted-foreground/70 whitespace-nowrap">
                    {m.joined_at ? new Date(m.joined_at).toLocaleDateString() : "—"}
                  </span>

                  {/* Remove */}
                  <button
                    onClick={() => handleRemove(m)}
                    disabled={removing === m.class_member_id}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-error hover:bg-error/10 disabled:opacity-50"
                  >
                    {removing === m.class_member_id ? "Removing..." : "Remove"}
                  </button>
                </li>
              ))}
            </ul>

            {/* Footer count */}
            <div className="border-t border-border px-5 py-3">
              <span className="text-xs text-muted-foreground/70">{members.length} member{members.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
        )}

      </div>

      {/* Remove confirmation modal */}
      {confirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-card p-6 shadow-lg">
            <h3 className="text-base font-semibold text-foreground">
              Remove member
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Remove{" "}
              <span className="font-medium text-foreground">
                {confirmTarget.user?.full_name || confirmTarget.user?.username || "this learner"}
              </span>{" "}
              from this class? They will need to join again to regain access.
            </p>

            {removeError && (
              <p className="mt-3 text-sm text-error">{removeError}</p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => { setConfirmTarget(null); setRemoveError(""); }}
                disabled={removing === confirmTarget.class_member_id}
                className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemove}
                disabled={removing === confirmTarget.class_member_id}
                className="rounded-lg bg-error px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-error/90 disabled:opacity-50"
              >
                {removing === confirmTarget.class_member_id ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
