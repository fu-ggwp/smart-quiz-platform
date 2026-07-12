"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { usersService } from "@/services/users.service";
import { useAuth } from "@/hooks/use-auth";

// Action verbs (§3.9.2) mapped to the DB account_status enum: Ban → disabled,
// Restore → active.
const ACTIONS = {
  restore: { label: "Restore", status: "active", tone: "bg-success" },
  ban: { label: "Ban", status: "disabled", tone: "bg-error" },
};

function availableActions(current) {
  if (current === "active") return ["ban"];
  if (current === "disabled") return ["restore"];
  // Any other status (legacy locked/pending) → can restore to active or ban.
  return ["restore", "ban"];
}

const STATUS_TONE = {
  active: "bg-success/10 text-success",
  pending: "bg-warning/10 text-warning",
  locked: "bg-error/10 text-error",
  disabled: "bg-muted text-muted-foreground",
};

function formatDateTime(value) {
  return value ? new Date(value).toLocaleString() : "—";
}

function Row({ label, children }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{children || "—"}</dd>
    </div>
  );
}

export default function AdminUserDetailPage() {
  const { id } = useParams();
  const { profile } = useAuth();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);

  const [pending, setPending] = useState(null); // { key, label, status }
  const [modalError, setModalError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await usersService.getForAdmin(id);
      setUser(data ?? null);
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err.message ||
          "Failed to load data. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const isSelf = profile?.userId && user?.user_id && profile.userId === user.user_id;

  const openConfirm = (key) => {
    setPending({ key, ...ACTIONS[key] });
    setModalError("");
  };
  const closeConfirm = () => setPending(null);

  const confirm = async () => {
    setModalError("");
    setUpdating(true);
    try {
      const updated = await usersService.updateStatus(id, {
        status: pending.status,
      });
      setUser(updated ?? null);
      setNotice("User account status has been updated successfully.");
      setPending(null);
    } catch (err) {
      setModalError(
        err?.response?.data?.error ||
          err.message ||
          "The information is invalid. Please check and try again."
      );
    } finally {
      setUpdating(false);
    }
  };

  return (
    <main className="min-h-screen px-6 py-10">
      <section className="mx-auto w-full max-w-4xl">
        <Link
          href="/admin/users"
          className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to users
        </Link>

        {loading && <p className="text-sm text-muted-foreground">Loading user...</p>}

        {!loading && error && (
          <div className="rounded-lg bg-error/10 px-4 py-3 text-sm text-error">
            {error}{" "}
            <button onClick={load} className="underline">
              Try again
            </button>
          </div>
        )}

        {!loading && !error && user && (
          <>
            {notice && (
              <div className="mb-4 rounded-lg bg-success/10 px-4 py-3 text-sm text-success">
                {notice}
              </div>
            )}

            {/* Profile summary */}
            <header className="mb-6 rounded-xl border border-border bg-card p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-semibold leading-tight">{user.full_name}</h1>
                  <p className="text-sm text-muted-foreground">@{user.username}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                    STATUS_TONE[user.account_status] ?? "bg-muted text-muted-foreground"
                  }`}
                >
                  {user.account_status}
                </span>
              </div>

              <dl className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                <Row label="Email">{user.email}</Row>
                <Row label="Phone">{user.phone_number}</Row>
                <Row label="Role">{user.active_role}</Row>
                <Row label="Premium">{user.is_premium ? "Premium" : "Free"}</Row>
                <Row label="Joined">{formatDateTime(user.created_at)}</Row>
                <Row label="Last updated">{formatDateTime(user.updated_at)}</Row>
              </dl>

              {user.bio && (
                <p className="mt-4 border-t border-border pt-4 text-sm text-muted-foreground">
                  {user.bio}
                </p>
              )}
            </header>

            {/* Status actions */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold">Account status</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Control this user&apos;s access to the platform.
              </p>

              {isSelf ? (
                <p className="mt-4 rounded-md bg-warning/10 px-4 py-3 text-sm text-warning">
                  You cannot change your own account status.
                </p>
              ) : (
                <div className="mt-4 flex flex-wrap gap-2">
                  {availableActions(user.account_status).map((key) => (
                    <button
                      key={key}
                      onClick={() => openConfirm(key)}
                      className={`rounded-md px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 ${ACTIONS[key].tone}`}
                    >
                      {ACTIONS[key].label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </section>

      {/* Confirmation modal */}
      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl">
            <h3 className="text-lg font-semibold">{pending.label} this user?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {user?.full_name} will be set to{" "}
              <span className="font-medium capitalize">{pending.status}</span>.
            </p>

            {modalError && <p className="mt-3 text-sm text-error">{modalError}</p>}

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={closeConfirm}
                disabled={updating}
                className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirm}
                disabled={updating}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {updating ? "Updating..." : `Confirm ${pending.label}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
