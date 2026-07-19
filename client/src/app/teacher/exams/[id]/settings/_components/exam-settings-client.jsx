"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { examsService } from "@/services/exams.service";
import { ExamQuestionPickerModal } from "../../../_components/exam-question-picker-modal";

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
  const [selectionMode, setSelectionMode] = useState("manual");
  const [pickerMode, setPickerMode] = useState("manual");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [questionSelectionDirty, setQuestionSelectionDirty] = useState(false);

  const locked = useMemo(() => isExamSettingsLocked(exam), [exam]);

  useEffect(() => {
    let ignore = false;

    examsService
      .getOne(examId)
      .then((data) => {
        if (ignore) return;
        setExam(data);
        setForm(buildSettingsForm(data));
        setSelectedQuestionIds((data.exam_questions ?? []).map((question) => question.source_question_id).filter(Boolean));
        setSelectedQuestions(data.exam_questions ?? []);
        setQuestionSelectionDirty(false);
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
    const errors = validateSettingsForm(form, selectedQuestionIds);
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
      const payloadForm = questionSelectionDirty
        ? form
        : { ...form, question_count: String(selectedQuestionIds.length) };
      const response = await examsService.updateSettings(
        examId,
        buildSettingsPayload(payloadForm, questionSelectionDirty ? selectedQuestionIds : null)
      );
      const updatedExam = response?.data?.exam;

      setExam(updatedExam);
      setForm(buildSettingsForm(updatedExam));
      setSelectedQuestionIds((updatedExam?.exam_questions ?? []).map((question) => question.source_question_id).filter(Boolean));
      setSelectedQuestions(updatedExam?.exam_questions ?? selectedQuestions);
      setQuestionSelectionDirty(false);
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
    <main className="min-h-full bg-background px-4 py-5 font-sans text-foreground [font-family:var(--font-geist-sans),Arial,sans-serif] sm:px-6 lg:px-8">
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
            onOpenQuestionPicker={(mode) => {
              setPickerMode(mode);
              setPickerOpen(true);
            }}
            onSelectionModeChange={(mode) => {
              setSelectionMode(mode);
              setFieldErrors((current) => ({ ...current, question_count: undefined }));
            }}
            selectedQuestionCount={selectedQuestionIds.length}
            selectedQuestions={selectedQuestions}
            selectionMode={selectionMode}
          />
          <ExamSettingsActions
            locked={locked}
            saving={saving}
            onCancel={() => router.push(`/teacher/exams/${examId}`)}
          />
        </form>
        <ExamQuestionPickerModal
          isOpen={pickerOpen}
          mode={pickerMode}
          questionBankId={exam.question_bank_id}
          randomCount={Number(form.question_count)}
          initialSelectedIds={selectedQuestionIds}
          onCancel={() => setPickerOpen(false)}
          onConfirm={({ questionIds, questions }) => {
            setSelectedQuestionIds(questionIds);
            setSelectedQuestions(questions);
            setQuestionSelectionDirty(true);
            setForm((current) => ({ ...current, question_count: String(questionIds.length) }));
            setFieldErrors((current) => ({ ...current, question_count: undefined }));
            setPickerOpen(false);
          }}
        />
      </section>
    </main>
  );
}
