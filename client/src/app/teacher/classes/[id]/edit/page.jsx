"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import classesService from "@/services/classes.service";
import ClassForm from "@/components/class-form";

/**
 * Edit Class (UC-31 / §2.3.5). Teacher edits the metadata of a class they own.
 * Loads current values, prefills the shared ClassForm, and PATCHes the change.
 * On success shows MSG51. `class_code` is shown read-only and never edited.
 */
export default function EditClassPage() {
  const { id } = useParams();
  const router = useRouter();

  const [initial, setInitial] = useState(null);
  const [classCode, setClassCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const cls = await classesService.getOne(id);
      setClassCode(cls.class_code ?? "");
      setInitial({
        class_name: cls.class_name ?? "",
        grade_level: cls.grade_level ?? "",
        academic_year: cls.academic_year ?? "",
        description: cls.description ?? "",
        learner_capacity: cls.learner_capacity ?? 50,
        join_policy: cls.join_policy ?? "teacher_approval",
        status: cls.status ?? "active",
      });
    } catch (err) {
      setLoadError(err?.response?.data?.error || err.message || "Failed to load class.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(values) {
    setError("");
    setNotice("");
    setSubmitting(true);
    try {
      await classesService.update(id, values);
      // MSG51 — class updated successfully
      setNotice("Class information has been updated successfully.");
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Failed to update class.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <section className="mx-auto w-full max-w-xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-semibold">Edit Class</h1>
          <Link
            href="/teacher/classes"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back
          </Link>
        </div>

        {loading && <p className="text-sm text-muted-foreground/70">Loading class...</p>}

        {!loading && loadError && (
          <div className="rounded-lg bg-error/10 px-4 py-3 text-sm text-error">
            {loadError}{" "}
            <button onClick={load} className="underline">
              Try again
            </button>
          </div>
        )}

        {!loading && !loadError && initial && (
          <>
            {/* Class code is generated and immutable */}
            {classCode && (
              <p className="mb-5 text-sm text-muted-foreground/70">
                Class code: <span className="font-mono text-muted-foreground">{classCode}</span>
                <span className="ml-2 text-xs">(cannot be changed)</span>
              </p>
            )}

            {notice && (
              <p className="mb-5 rounded-lg bg-success/10 px-4 py-3 text-sm text-success">
                {notice}{" "}
                <Link href="/teacher/classes" className="underline">
                  Back to classes
                </Link>
              </p>
            )}

            <ClassForm
              initialValues={initial}
              onSubmit={handleSubmit}
              submitting={submitting}
              error={error}
              submitLabel="Update Class Information"
              submittingLabel="Saving..."
              showStatus
            />
          </>
        )}
      </section>
    </main>
  );
}
