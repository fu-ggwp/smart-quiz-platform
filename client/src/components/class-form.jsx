"use client";

import { useState } from "react";

/**
 * Shared class form (UC-30 Create / UC-31 Update). Presentational only:
 * it owns the field state and required-field validation, then hands a clean
 * payload to `onSubmit`. The parent page does the API call + navigation.
 *
 * `class_code` / `invitation_token` are intentionally NOT editable here, so
 * existing membership and join links keep working when a class is updated.
 */

const JOIN_POLICY_OPTIONS = [
  { value: "teacher_approval", label: "Teacher Approval (students need approval to join)" },
  { value: "auto_approve", label: "Auto Approve (students join instantly)" },
];

const GRADE_LEVEL_OPTIONS = [
  { value: "", label: "Select grade level" },
  { value: "Primary School", label: "Primary School" },
  { value: "Secondary School", label: "Secondary School" },
  { value: "High School", label: "High School" },
  { value: "Undergraduate", label: "Undergraduate" },
  { value: "Postgraduate", label: "Postgraduate" },
  { value: "Others", label: "Others" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "closed", label: "Closed" },
  { value: "archived", label: "Archived" },
];

const DEFAULTS = {
  class_name: "",
  subject: "",
  grade_level: "",
  academic_year: "",
  description: "",
  learner_capacity: 50,
  join_policy: "teacher_approval",
  status: "active",
};

export default function ClassForm({
  initialValues = {},
  onSubmit,
  submitting = false,
  error = "",
  submitLabel = "Save",
  submittingLabel = "Saving...",
  showStatus = false,
}) {
  const [form, setForm] = useState({ ...DEFAULTS, ...initialValues });
  const [localError, setLocalError] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setLocalError("");

    // MSG02 — required field
    if (!String(form.class_name).trim()) {
      setLocalError("Class name is required.");
      return;
    }

    const payload = {
      class_name: String(form.class_name).trim(),
      subject: String(form.subject ?? "").trim(),
      grade_level: form.grade_level,
      academic_year: String(form.academic_year ?? "").trim(),
      description: form.description ?? "",
      learner_capacity: Number(form.learner_capacity) || 50,
      join_policy: form.join_policy,
    };
    if (showStatus) payload.status = form.status;

    onSubmit(payload);
  }

  return (
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

      {/* Subject */}
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

      {/* Grade Level */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Grade Level</label>
        <select
          name="grade_level"
          value={form.grade_level}
          onChange={handleChange}
          className="rounded-lg border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-neutral-400"
        >
          {GRADE_LEVEL_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
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
          className="resize-none rounded-lg border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-neutral-400"
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

      {/* Status — edit only */}
      {showStatus && (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Class Status</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="rounded-lg border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-neutral-400"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Error (MSG02 / MSG03 / MSG11 / MSG13) */}
      {(localError || error) && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {localError || error}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="mt-2 rounded-lg bg-black py-3 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? submittingLabel : submitLabel}
      </button>
    </form>
  );
}
