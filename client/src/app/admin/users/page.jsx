"use client";

import { useState } from "react";
import Link from "next/link";

import { useAdminUsers, DEFAULT_USER_FILTERS } from "@/hooks/use-admin-users";
import { AppPagination } from "@/components/common/app-pagination";

const ROLE_OPTIONS = [
  { value: "", label: "All roles" },
  { value: "learner", label: "Learner" },
  { value: "teacher", label: "Teacher" },
  { value: "admin", label: "Admin" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "locked", label: "Locked" },
  { value: "disabled", label: "Disabled" },
];

const SORT_OPTIONS = [
  { value: "latest", label: "Latest created" },
  { value: "name", label: "Name (A–Z)" },
];

const ROWS_PER_PAGE = [10, 20, 50];
const FILTER_DRAFT_DEFAULTS = {
  q: "",
  role: "",
  status: "",
  sortBy: "latest",
};

const STATUS_TONE = {
  active: "bg-success/10 text-success",
  pending: "bg-warning/10 text-warning",
  locked: "bg-error/10 text-error",
  disabled: "bg-muted text-muted-foreground",
};

function Badge({ children, className = "" }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${className}`}>
      {children}
    </span>
  );
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : "—";
}

export default function AdminUsersPage() {
  const { items, pagination, params, setParams, loading, error, reload } = useAdminUsers();

  // Draft holds the filter inputs; Apply commits them (resetting to page 1).
  const [draft, setDraft] = useState({
    q: params.q,
    role: params.role,
    status: params.status,
    sortBy: params.sortBy,
  });

  const applyFilters = () => setParams((p) => ({ ...p, ...draft, page: 1 }));
  const resetFilters = () => {
    setDraft(FILTER_DRAFT_DEFAULTS);
    setParams({ ...DEFAULT_USER_FILTERS });
  };
  const changePage = (page) => setParams((p) => ({ ...p, page }));
  const changeLimit = (limit) => setParams((p) => ({ ...p, limit, page: 1 }));

  return (
    <main className="min-h-screen px-6 py-10">
      <section className="mx-auto w-full max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">User Management</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Admin views the list of users in the system.
            </p>
          </div>
          <span className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
            {pagination.total ?? 0} users
          </span>
        </div>

        {/* Filter bar */}
        <div className="mb-6 grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5">
          <input
            type="text"
            value={draft.q}
            onChange={(e) => setDraft((d) => ({ ...d, q: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            placeholder="Search name, email, role, status"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm lg:col-span-2"
          />
          <select
            value={draft.role}
            onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value }))}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            {ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            value={draft.status}
            onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            value={draft.sortBy}
            onChange={(e) => setDraft((d) => ({ ...d, sortBy: e.target.value }))}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <div className="flex gap-2 lg:col-span-5">
            <button
              onClick={applyFilters}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Apply
            </button>
            <button
              onClick={resetFilters}
              className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && <p className="text-sm text-muted-foreground">Loading users...</p>}

        {/* Error (MSG13 / MSG11) */}
        {!loading && error && (
          <div className="rounded-lg bg-error/10 px-4 py-3 text-sm text-error">
            {error}{" "}
            <button onClick={reload} className="underline">
              Try again
            </button>
          </div>
        )}

        {/* Empty (MSG45) */}
        {!loading && !error && items.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <p className="text-muted-foreground">No matching data was found.</p>
            <button onClick={resetFilters} className="text-sm underline">
              Clear filters
            </button>
          </div>
        )}

        {/* Table */}
        {!loading && !error && items.length > 0 && (
          <>
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border text-sm">
                  <thead className="bg-muted text-left text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    <tr>
                      {["User", "Role", "Status", "Joined", "Action"].map((h) => (
                        <th key={h} className="px-4 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.map((u) => (
                      <tr key={u.user_id} className="align-middle transition hover:bg-muted/50">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-foreground">{u.full_name}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className="bg-muted text-muted-foreground">{u.active_role}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={STATUS_TONE[u.account_status] ?? "bg-muted text-muted-foreground"}>
                            {u.account_status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(u.created_at)}</td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin/users/${u.user_id}`}
                            className="text-sm font-medium text-primary hover:underline"
                          >
                            Detail
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination + rows per page */}
            <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Rows per page</span>
                <select
                  value={params.limit}
                  onChange={(e) => changeLimit(Number(e.target.value))}
                  className="rounded-md border border-border bg-background px-2 py-1"
                >
                  {ROWS_PER_PAGE.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <AppPagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={changePage}
              />
            </div>
          </>
        )}
      </section>
    </main>
  );
}
