"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import classesService from "../../../../services/classes.service";
import ToastNotification from "@/app/teacher/study-sets/ToastNotification";

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-neutral-400">{label}</span>
      <span className="text-sm text-neutral-800">{value}</span>
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
  const [toast, setToast] = useState({ message: "", type: "success" });

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
      setToast({
        message: err?.response?.data?.error || err.message || "Failed to resolve request.",
        type: "error",
      });
    } finally {
      setResolving(null);
    }
  }

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
        <button
          onClick={() => router.push("/teacher/classes")}
          className="text-sm text-neutral-500 underline"
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
              <p className="text-sm text-neutral-500">{cls.description}</p>
            )}
          </div>
          <Link
            href="/teacher/classes"
            className="shrink-0 text-sm text-neutral-400 hover:text-neutral-700"
          >
            ← Back
          </Link>
        </div>

        {/* Class Info */}
        <div className="rounded-xl border border-neutral-200 p-5">
          <h2 className="mb-4 text-sm font-semibold text-neutral-700">
            Class Info
          </h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
            <InfoRow label="Subject" value={cls.subject} />
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
            <InfoRow label="Start Date" value={cls.start_date} />
            <InfoRow label="End Date" value={cls.end_date} />
          </div>
        </div>

        {/* Class Code */}
        <div className="rounded-xl border border-neutral-200 p-5">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-neutral-400">Class Code</span>
              <span className="font-mono text-2xl font-bold tracking-widest text-neutral-800">
                {cls.class_code}
              </span>
            </div>
            <Link
              href={`/teacher/classes/${id}/invite`}
              className="rounded-lg border border-neutral-200 px-4 py-2 text-sm hover:bg-neutral-50"
            >
              View Invite Options
            </Link>
          </div>
        </div>

        {/* Join Requests — only shown when policy is teacher_approval */}
        {cls.join_policy === "teacher_approval" && (
          <div className="rounded-xl border border-neutral-200 p-5">
            <div className="mb-4 flex items-center gap-2">
              <h2 className="text-sm font-semibold text-neutral-700">
                Join Requests
              </h2>
              {joinRequests.length > 0 && (
                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                  {joinRequests.length} pending
                </span>
              )}
            </div>

            {joinRequests.length === 0 ? (
              <p className="text-sm text-neutral-400">
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
                      <span className="text-sm font-medium text-neutral-800">
                        {req.user?.full_name || req.user?.username || "Unknown"}
                      </span>
                      <span className="text-xs text-neutral-400">
                        {req.user?.email}
                      </span>
                      {req.request_message && (
                        <span className="mt-0.5 text-xs italic text-neutral-500">
                          &quot;{req.request_message}&quot;
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleResolve(req.join_request_id, "approved")
                        }
                        disabled={resolving === req.join_request_id}
                        className="rounded-lg bg-black px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() =>
                          handleResolve(req.join_request_id, "rejected")
                        }
                        disabled={resolving === req.join_request_id}
                        className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
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
        <div className="rounded-xl border border-neutral-200 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-700">
              Members
              <span className="ml-2 text-xs font-normal text-neutral-400">
                {members.length} / {cls.learner_capacity}
              </span>
            </h2>
            <Link
              href={`/teacher/classes/${id}/members`}
              className="text-xs text-neutral-500 hover:text-neutral-800"
            >
              View all →
            </Link>
          </div>

          {members.length === 0 ? (
            <p className="text-sm text-neutral-400">No members yet.</p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {previewMembers.map((m) => (
                <li
                  key={m.class_member_id}
                  className="flex items-center gap-3 py-2.5"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-medium text-neutral-600">
                    {(m.user?.full_name ||
                      m.user?.username ||
                      "?")[0].toUpperCase()}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-neutral-800">
                      {m.user?.full_name || m.user?.username || "Unknown"}
                    </span>
                    <span className="text-xs text-neutral-400">
                      {m.user?.email}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {members.length > 5 && (
            <p className="mt-3 text-xs text-neutral-400">
              +{members.length - 5} more —{" "}
              <Link
                href={`/teacher/classes/${id}/members`}
                className="underline hover:text-neutral-700"
              >
                see all
              </Link>
            </p>
          )}
        </div>
      </div>

      <ToastNotification
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "success" })}
      />
    </main>
  );
}
