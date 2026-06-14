"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { examsService } from "@/services/exams.service";

import { ExamRandomizationSection } from "./exam-randomization-section";
import { ExamSessionSettingsSection } from "./exam-session-settings-section";
import { ExamSettingsActions } from "./exam-settings-actions";
import { ExamSettingsAlerts } from "./exam-settings-alerts";
import { ExamSettingsHeader } from "./exam-settings-header";
import { ExamSettingsError, ExamSettingsLoading } from "./exam-settings-state";
import {
  buildSettingsForm,
  buildSettingsPayload,
  getExamSettingsErrorMessage,
  isExamSettingsLocked,
  validateSettingsForm,
} from "./exam-settings-utils";

export function ExamSettingsClient({ examId }) {
  const router = useRouter();
  const [exam, setExam] = useState(null);
  const [form, setForm] = useState(buildSettingsForm(null));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState("");

  const locked = useMemo(() => isExamSettingsLocked(exam), [exam]);

  useEffect(() => {
    let ignore = false;

    examsService
      .getOne(examId)
      .then((data) => {
        if (ignore) return;
        setExam(data);
        setForm(buildSettingsForm(data));
        setFieldErrors({});
        setError("");
      })
      .catch((loadError) => {
        if (ignore) return;
        setError(getExamSettingsErrorMessage(loadError));
      })
      .finally(() => {
        if (ignore) return;
        setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [examId]);

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
    setSuccess("");
  }

  function validateForm() {
    const errors = validateSettingsForm(form);
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (locked || !validateForm()) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await examsService.updateSettings(examId, buildSettingsPayload(form));
      const updatedExam = response?.data?.exam;

      setExam(updatedExam);
      setForm(buildSettingsForm(updatedExam));
      setSuccess(response?.data?.message || "Exam settings have been updated successfully.");
      setFieldErrors({});
    } catch (saveError) {
      setError(getExamSettingsErrorMessage(saveError));
      setFieldErrors(saveError?.response?.data?.fields || {});
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <ExamSettingsLoading />;
  }

  if (error && !exam) {
    return <ExamSettingsError message={error} />;
  }

  return (
    <main className="min-h-screen bg-background px-4 py-5 font-sans text-foreground [font-family:var(--font-geist-sans),Arial,sans-serif] sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl space-y-6">
        <ExamSettingsHeader examId={examId} />
        <ExamSettingsAlerts locked={locked} error={error} success={success} />

        <form onSubmit={handleSubmit} className="space-y-5">
          <ExamSessionSettingsSection
            exam={exam}
            form={form}
            fieldErrors={fieldErrors}
            locked={locked}
            saving={saving}
            onFieldChange={updateField}
          />
          <ExamRandomizationSection
            form={form}
            locked={locked}
            saving={saving}
            onFieldChange={updateField}
          />
          <ExamSettingsActions
            locked={locked}
            saving={saving}
            onCancel={() => router.push(`/teacher/exams/${examId}`)}
          />
        </form>
      </section>
    </main>
  );
}
