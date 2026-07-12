"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import classesService from "../../../../services/classes.service";

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground/70">{label}</span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}

export default function ClassDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [cls, setCls] = useState(null);
  const [members, setMembers] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resolving, setResolving] = useState(null); // requestId currently being resolved
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [processing, setProcessing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [clsData, membersData, requestsData] = await Promise.all([
        classesService.getOne(id),
        classesService.listMembers(id),
        classesService.listJoinRequests(id),
      ]);
      setCls(clsData);
      setMembers(membersData);
      setJoinRequests(requestsData);
    } catch (err) {
      setError(
        err?.response?.data?.error || err.message || "Failed to load class.",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setTimeout(() => {
      load();
    }, 0);
  }, [load]);

  useEffect(() => {
    if (!deleteSuccess) return;

    const timer = setTimeout(() => {
      router.replace("/teacher/classes");
    }, 1200);

    return () => clearTimeout(timer);
  }, [deleteSuccess, router]);

  async function handleResolve(requestId, status) {
    setResolving(requestId);
    try {
      await classesService.resolveJoinRequest(requestId, status);
      // Refresh members + requests
      const [membersData, requestsData] = await Promise.all([
        classesService.listMembers(id),
        classesService.listJoinRequests(id),
      ]);
      setMembers(membersData);
      setJoinRequests(requestsData);
    } catch (err) {
      alert(err?.response?.data?.error || err.message || "Failed to resolve request.");
    } finally {
      setResolving(null);
    }
  }

  async function handleDelete() {
    setProcessing(true);
    setDeleteError("");
    try {
      await classesService.remove(id);
      setConfirmingDelete(false);
      setDeleteSuccess(true);
    } catch (err) {
      setConfirmingDelete(false);
      setDeleteError(err?.response?.data?.error || err.message || "Failed to delete class.");
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground/70">Loading...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3">
        <p className="text-sm text-error">{error}</p>
        <button
          onClick={() => router.push("/teacher/classes")}
          className="text-sm text-muted-foreground underline"
        >
          Back to classes
        </button>
      </main>
    );
  }

  const previewMembers = members.slice(0, 5);

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold">{cls.class_name}</h1>
            {cls.description && (
              <p className="text-sm text-muted-foreground">{cls.description}</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={`/teacher/classes/${id}/edit`}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              Edit
            </Link>
            <Link
              href="/teacher/classes"
              className="text-sm text-muted-foreground/70 hover:text-foreground"
            >
              ← Back
            </Link>
          </div>
        </div>

        {/* Class Info */}
        <div className="rounded-xl border border-border p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">
            Class Info
          </h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
            <InfoRow label="Grade Level" value={cls.grade_level} />
            <InfoRow label="Academic Year" value={cls.academic_year} />
            <InfoRow
              label="Max Students"
              value={String(cls.learner_capacity)}
            />
            <InfoRow
              label="Join Policy"
              value={
                cls.join_policy === "auto_approve"
                  ? "Auto Approve"
                  : "Teacher Approval"
              }
            />
          </div>
        </div>

        {/* Class Code */}
        <div className="rounded-xl border border-border p-5">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground/70">Class Code</span>
              <span className="font-mono text-2xl font-bold tracking-widest text-foreground">
                {cls.class_code}
              </span>
            </div>
            <Link
              href={`/teacher/classes/${id}/invite`}
              className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted"
            >
              View Invite Options
            </Link>
          </div>
        </div>

        {/* Join Requests — only shown when policy is teacher_approval */}
        {cls.join_policy === "teacher_approval" && (
          <div className="rounded-xl border border-border p-5">
            <div className="mb-4 flex items-center gap-2">
              <h2 className="text-sm font-semibold text-foreground">
                Join Requests
              </h2>
              {joinRequests.length > 0 && (
                <span className="rounded-full bg-warning/20 px-2 py-0.5 text-xs font-medium text-warning">
                  {joinRequests.length} pending
                </span>
              )}
            </div>

            {joinRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground/70">
                No pending join requests.
              </p>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {joinRequests.map((req) => (
                  <li
                    key={req.join_request_id}
                    className="flex items-center justify-between py-3"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-foreground">
                        {req.user?.full_name || req.user?.username || "Unknown"}
                      </span>
                      <span className="text-xs text-muted-foreground/70">
                        {req.user?.email}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleResolve(req.join_request_id, "approved")
                        }
                        disabled={resolving === req.join_request_id}
                        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/80 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() =>
                          handleResolve(req.join_request_id, "rejected")
                        }
                        disabled={resolving === req.join_request_id}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Members Preview */}
        <div className="rounded-xl border border-border p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Members
              <span className="ml-2 text-xs font-normal text-muted-foreground/70">
                {members.length} / {cls.learner_capacity}
              </span>
            </h2>
            <Link
              href={`/teacher/classes/${id}/members`}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              View all →
            </Link>
          </div>

          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground/70">No members yet.</p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {previewMembers.map((m) => (
                <li
                  key={m.class_member_id}
                  className="flex items-center gap-3 py-2.5"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                    {(m.user?.full_name ||
                      m.user?.username ||
                      "?")[0].toUpperCase()}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-foreground">
                      {m.user?.full_name || m.user?.username || "Unknown"}
                    </span>
                    <span className="text-xs text-muted-foreground/70">
                      {m.user?.email}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {members.length > 5 && (
            <p className="mt-3 text-xs text-muted-foreground/70">
              +{members.length - 5} more —{" "}
              <Link
                href={`/teacher/classes/${id}/members`}
                className="underline hover:text-foreground"
              >
                see all
              </Link>
            </p>
          )}
        </div>

        {/* Manage Class — delete (UC-32) */}
        <div className="rounded-xl border border-error/30 p-5">
          <h2 className="text-sm font-semibold text-error">Manage Class</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Delete a class you no longer need. It will be removed from class
            lists.
          </p>
          <div className="mt-4">
            <button
              onClick={() => setConfirmingDelete(true)}
              className="rounded-lg border border-error/40 px-4 py-2 text-sm font-medium text-error hover:bg-error/10"
            >
              Delete Class
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation modal (Normal Flow step 3 / Alt 4.1 Cancel) */}
      {confirmingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-foreground">
              Delete this class?
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              This class will be removed from the web class lists. Learners
              will no longer be able to access it.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setConfirmingDelete(false)}
                disabled={processing}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={processing}
                className="rounded-lg bg-error px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-error/90 disabled:opacity-50"
              >
                {processing ? "Deleting..." : "Delete Class"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-foreground">
              Class deleted successfully
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              The class has been removed from your class list.
              Redirecting...
            </p>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => router.replace("/teacher/classes")}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80"
              >
                Back to Classes
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-foreground">
              Delete failed
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">{deleteError}</p>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setDeleteError("")}
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
