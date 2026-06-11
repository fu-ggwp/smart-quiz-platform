"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import classesService from "../../../../services/classes.service";

const JOIN_POLICY_OPTIONS = [
  { value: "teacher_approval", label: "Teacher Approval (students need approval to join)" },
  { value: "auto_approve", label: "Auto Approve (students join instantly)" },
];

export default function CreateClassPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    class_name: "",
    subject: "",
    grade_level: "",
    academic_year: "",
    description: "",
    learner_capacity: 50,
    join_policy: "teacher_approval",
    start_date: "",
    end_date: "",
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.class_name.trim()) {
      setError("Class name is required.");
      return;
    }

    setSubmitting(true);
    try {
      const newClass = await classesService.create({
        class_name: form.class_name.trim(),
        subject: form.subject || undefined,
        grade_level: form.grade_level || undefined,
        academic_year: form.academic_year || undefined,
        description: form.description || undefined,
        learner_capacity: Number(form.learner_capacity) || 50,
        join_policy: form.join_policy,
        start_date: form.start_date || undefined,
        end_date: form.end_date || undefined,
      });
      router.push(`/teacher/classes/${newClass.class_id}`);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Failed to create class.");
    } finally {
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
            className="text-sm text-neutral-500 hover:text-neutral-800"
          >
            ← Back
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* Class Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">
              Class Name <span className="text-red-500">*</span>
            </label>
            <input
              name="class_name"
              value={form.class_name}
              onChange={handleChange}
              placeholder="e.g. Math Grade 10 - 2024"
              className="rounded-lg border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-neutral-400"
            />
          </div>

          {/* Subject + Grade Level */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Subject</label>
              <input
                name="subject"
                value={form.subject}
                onChange={handleChange}
                placeholder="e.g. Mathematics"
                className="rounded-lg border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-neutral-400"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Grade Level</label>
              <input
                name="grade_level"
                value={form.grade_level}
                onChange={handleChange}
                placeholder="e.g. Grade 10"
                className="rounded-lg border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-neutral-400"
              />
            </div>
          </div>

          {/* Academic Year */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Academic Year</label>
            <input
              name="academic_year"
              value={form.academic_year}
              onChange={handleChange}
              placeholder="e.g. 2024-2025"
              className="rounded-lg border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-neutral-400"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Optional description for your class..."
              rows={3}
              className="rounded-lg border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-neutral-400 resize-none"
            />
          </div>

          {/* Learner Capacity */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Max Students</label>
            <input
              name="learner_capacity"
              type="number"
              min={1}
              max={500}
              value={form.learner_capacity}
              onChange={handleChange}
              className="rounded-lg border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-neutral-400"
            />
          </div>

          {/* Join Policy */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Join Policy</label>
            <select
              name="join_policy"
              value={form.join_policy}
              onChange={handleChange}
              className="rounded-lg border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-neutral-400"
            >
              {JOIN_POLICY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Start + End Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Start Date</label>
              <input
                name="start_date"
                type="date"
                value={form.start_date}
                onChange={handleChange}
                className="rounded-lg border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-neutral-400"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">End Date</label>
              <input
                name="end_date"
                type="date"
                value={form.end_date}
                onChange={handleChange}
                className="rounded-lg border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-neutral-400"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-lg bg-black py-3 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Creating..." : "Create Class"}
          </button>

        </form>
      </section>
    </main>
  );
}
