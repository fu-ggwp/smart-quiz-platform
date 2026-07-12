"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import classesService from "@/services/classes.service";
import ClassForm from "@/components/class-form";

export default function CreateClassPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(values) {
    setError("");
    setSubmitting(true);
    try {
      const newClass = await classesService.create(values);
      router.push(`/teacher/classes/${newClass.class_id}`);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Failed to create class.");
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <section className="mx-auto w-full max-w-xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-semibold">Create Class</h1>
          <Link
            href="/teacher/classes"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back
          </Link>
        </div>

        <ClassForm
          onSubmit={handleSubmit}
          submitting={submitting}
          error={error}
          submitLabel="Create Class"
          submittingLabel="Creating..."
        />
      </section>
    </main>
  );
}
