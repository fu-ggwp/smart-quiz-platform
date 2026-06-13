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

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto w-full max-w-3xl">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Members</h1>
          <Link
            href={`/teacher/classes/${id}`}
            className="text-sm text-neutral-400 hover:text-neutral-700"
          >
            ← Back to class
          </Link>
        </div>

        {loading && <p className="text-sm text-neutral-400">Loading...</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}

        {!loading && !error && members.length === 0 && (
          <p className="text-sm text-neutral-400">No members yet.</p>
        )}

        {!loading && !error && members.length > 0 && (
          <div className="rounded-xl border border-neutral-200">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_1fr_auto] gap-4 border-b border-neutral-100 px-5 py-3">
              <span className="text-xs font-medium text-neutral-400">Name</span>
              <span className="text-xs font-medium text-neutral-400">Email</span>
              <span className="text-xs font-medium text-neutral-400">Joined</span>
            </div>

            {/* Rows */}
            <ul className="divide-y divide-neutral-100">
              {members.map((m) => (
                <li
                  key={m.class_member_id}
                  className="grid grid-cols-[1fr_1fr_auto] items-center gap-4 px-5 py-3"
                >
                  {/* Avatar + name */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-medium text-neutral-600">
                      {(m.user?.full_name || m.user?.username || "?")[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-neutral-800">
                      {m.user?.full_name || m.user?.username || "Unknown"}
                    </span>
                  </div>

                  {/* Email */}
                  <span className="truncate text-sm text-neutral-500">
                    {m.user?.email ?? "—"}
                  </span>

                  {/* Joined at */}
                  <span className="text-xs text-neutral-400 whitespace-nowrap">
                    {m.joined_at ? new Date(m.joined_at).toLocaleDateString() : "—"}
                  </span>
                </li>
              ))}
            </ul>

            {/* Footer count */}
            <div className="border-t border-neutral-100 px-5 py-3">
              <span className="text-xs text-neutral-400">{members.length} member{members.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
