"use client";

import { useCallback, useEffect, useState } from "react";

import axiosClient from "@/services/axios-client";
import { AppPagination } from "@/components/common/app-pagination";

const STATUS_OPTIONS = [
  { value: "", label: "All resources" },
  { value: "visible", label: "Visible" },
  { value: "hidden", label: "Hidden" },
];

const ROWS_PER_PAGE = [10, 20, 50];
const DEFAULT_PARAMS = { page: 1, limit: 10, q: "", status: "" };

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : "—";
}

export default function AdminResourcesPage() {
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [draft, setDraft] = useState({ q: "", status: "" });
  const [pending, setPending] = useState(null); // { id, title, hidden }
  const [updatingId, setUpdatingId] = useState(null);
  const [modalError, setModalError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async (active) => {
    setLoading(true);
    setError(null);
    try {
      const query = Object.fromEntries(
        Object.entries(active).filter(([, v]) => v !== "" && v != null)
      );
      const res = await axiosClient.get("/api/study-sets/admin/resources", { params: query });
      const data = res.data.data;
      setItems(data?.items ?? []);
      setPagination(data?.pagination ?? { page: 1, totalPages: 1, total: 0, limit: active.limit });
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err.message ||
          "Failed to load data. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(params);
  }, [load, params]);

  const applyFilters = () => setParams((p) => ({ ...p, ...draft, page: 1 }));
  const resetFilters = () => {
    setDraft({ q: "", status: "" });
    setParams({ ...DEFAULT_PARAMS });
  };
  const changePage = (page) => setParams((p) => ({ ...p, page }));
  const changeLimit = (limit) => setParams((p) => ({ ...p, limit, page: 1 }));

  const openConfirm = (item, hidden) => {
    setPending({ id: item.study_set_id, title: item.title, hidden });
    setModalError("");
  };
  const closeConfirm = () => setPending(null);

  const confirm = async () => {
    setModalError("");
    setUpdatingId(pending.id);
    try {
      await axiosClient.patch(`/api/study-sets/admin/resources/${pending.id}/visibility`, {
        hidden: pending.hidden,
      });
      setNotice(
        pending.hidden
          ? "The public learning resource has been hidden successfully."
          : "The public learning resource has been restored successfully."
      );
      setPending(null);
      await load(params);
    } catch (err) {
      setModalError(
        err?.response?.data?.error ||
          err.message ||
          "The information is invalid. Please check and try again."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <main className="min-h-screen px-6 py-10">
      <section className="mx-auto w-full max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Resource Management</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Review public study sets and hide inappropriate content.
            </p>
          </div>
          <span className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
            {pagination.total ?? 0} resources
          </span>
        </div>

        {/* Filter bar */}
        <div className="mb-6 grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
          <input
            type="text"
            value={draft.q}
            onChange={(e) => setDraft((d) => ({ ...d, q: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            placeholder="Search title, description, topic"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm lg:col-span-2"
          />
          <select
            value={draft.status}
            onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <div className="flex gap-2">
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

        {/* Success notice (MSG47) */}
        {notice && (
          <div className="mb-4 rounded-lg bg-success/10 px-4 py-3 text-sm text-success">
            {notice}
          </div>
        )}

        {/* Loading */}
        {loading && <p className="text-sm text-muted-foreground">Loading resources...</p>}

        {/* Error (MSG13 / MSG11) */}
        {!loading && error && (
          <div className="rounded-lg bg-error/10 px-4 py-3 text-sm text-error">
            {error}{" "}
            <button onClick={() => load(params)} className="underline">
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
                      {["Resource", "Owner", "Status", "Questions", "Updated", "Action"].map((h) => (
                        <th key={h} className="px-4 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.map((r) => (
                      <tr key={r.study_set_id} className="align-top transition hover:bg-muted/50">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-foreground">{r.title}</p>
                          <p className="max-w-md truncate text-xs text-muted-foreground">
                            {r.description || "No description"}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {r.teacher?.full_name || r.teacher?.username || "—"}
                        </td>
                        <td className="px-4 py-3">
                          {r.is_admin_hidden ? (
                            <span className="inline-flex rounded-full bg-error/10 px-2 py-0.5 text-xs font-medium text-error">
                              Hidden
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                              Visible
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{r.question_count ?? 0}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDate(r.updated_at || r.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          {r.is_admin_hidden ? (
                            <button
                              onClick={() => openConfirm(r, false)}
                              disabled={updatingId === r.study_set_id}
                              className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
                            >
                              Restore
                            </button>
                          ) : (
                            <button
                              onClick={() => openConfirm(r, true)}
                              disabled={updatingId === r.study_set_id}
                              className="rounded-md bg-error px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                            >
                              Hide
                            </button>
                          )}
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

      {/* Confirmation modal (no reason input) */}
      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl">
            <h3 className="text-lg font-semibold">
              {pending.hidden ? "Hide this resource?" : "Restore this resource?"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {pending.hidden
                ? `"${pending.title}" will be removed from public access.`
                : `"${pending.title}" will become publicly visible again.`}
            </p>

            {modalError && <p className="mt-3 text-sm text-error">{modalError}</p>}

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={closeConfirm}
                disabled={updatingId === pending.id}
                className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirm}
                disabled={updatingId === pending.id}
                className={`rounded-md px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 ${
                  pending.hidden ? "bg-error" : "bg-primary"
                }`}
              >
                {updatingId === pending.id
                  ? "Working..."
                  : pending.hidden
                    ? "Confirm Hide"
                    : "Confirm Restore"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
