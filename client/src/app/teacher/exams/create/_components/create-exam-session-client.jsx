"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import classesService from "@/services/classes.service";
import { examsService } from "@/services/exams.service";
import { questionBanksService } from "@/services/question-banks.service";
import { ExamQuestionPickerModal } from "../../_components/exam-question-picker-modal";

import { CreateExamForm } from "./create-exam-form";
import { CreateExamLoadingState } from "./create-exam-state";
import { getErrorMessage, getQuestionCount, INITIAL_FORM, toDateTimePayload } from "./create-exam-options";

export function CreateExamSessionClient() {
  const router = useRouter();
  const [form, setForm] = useState(INITIAL_FORM);
  const [classes, setClasses] = useState([]);
  const [questionBanks, setQuestionBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingAction, setSubmittingAction] = useState(null);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [selectionMode, setSelectionMode] = useState("random");
  const [pickerMode, setPickerMode] = useState("manual");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);

  const selectedBank = useMemo(
    () => questionBanks.find((bank) => bank.question_bank_id === form.question_bank_id),
    [form.question_bank_id, questionBanks]
  );
  const availableQuestions = getQuestionCount(selectedBank);

  const loadFormOptions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [classRows, bankResult] = await Promise.all([
        classesService.listMine(),
        questionBanksService.listReady(),
      ]);

      const activeClasses = (classRows ?? []).filter((item) => item.status === "active");
      const availableBanks = bankResult ?? [];

      setClasses(activeClasses);
      setQuestionBanks(availableBanks);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadFormOptions();
  }, [loadFormOptions]);

  function updateField(name, value) {
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "question_bank_id" ? { question_count: "10" } : {}),
    }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));

    if (name === "question_bank_id") {
      setSelectedQuestionIds([]);
      setSelectedQuestions([]);
    }
  }

  function handleInputChange(event) {
    updateField(event.target.name, event.target.value);
  }

  function validate(nextStatus) {
    const errors = {};
    const questionCount = Number(form.question_count);
    const durationMinutes = Number(form.duration_minutes);
    const attemptLimit = Number(form.attempt_limit);
    const startTime = form.start_at ? new Date(form.start_at).getTime() : null;
    const endTime = form.end_at ? new Date(form.end_at).getTime() : null;
    const durationEndTime = startTime && Number.isInteger(durationMinutes)
      ? startTime + durationMinutes * 60 * 1000
      : null;

    if (!form.title.trim()) errors.title = "Exam title is required.";
    if (!form.class_id) errors.class_id = "Please select an active class.";
    if (!form.question_bank_id) errors.question_bank_id = "Please select a question bank.";
    if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
      errors.duration_minutes = "Duration must be a positive whole number.";
    }
    if (!Number.isInteger(attemptLimit) || attemptLimit <= 0) {
      errors.attempt_limit = "Allowed attempts must be a positive whole number.";
    }
    if (!Number.isInteger(questionCount) || questionCount <= 0) {
      errors.question_count = "Question count must be a positive whole number.";
    } else if (form.question_bank_id && questionCount > availableQuestions) {
      errors.question_count = `Only ${availableQuestions} questions are available in the selected bank.`;
    }
    if (selectedQuestionIds.length <= 0) {
      errors.question_count = selectionMode === "random"
        ? "Pick random questions before creating the exam."
        : "Choose at least one question before creating the exam.";
    }
    if (form.question_bank_id && availableQuestions <= 0) {
      errors.question_bank_id = "The selected question bank has no available questions.";
    }

    if (form.start_at && startTime && startTime < Date.now()) errors.start_at = "Start time cannot be in the past.";
    if (nextStatus === "active" && !form.start_at) errors.start_at = "Start time is required before activating.";
    if (nextStatus === "active" && !form.end_at) errors.end_at = "End time is required before activating.";

    if ((form.start_at && !form.end_at) || (!form.start_at && form.end_at)) {
      errors.start_at = errors.start_at || "Start and end time must be provided together.";
      errors.end_at = errors.end_at || "Start and end time must be provided together.";
    }

    if (startTime && endTime && endTime <= startTime) {
      errors.end_at = "End time must be later than start time.";
    }
    if (durationEndTime && endTime && endTime <= durationEndTime) {
      errors.end_at = "End time must be later than start time plus duration.";
      errors.duration_minutes = errors.duration_minutes || "Duration must fit within the exam window.";
    }

    return errors;
  }

  async function submitExam(nextStatus) {
    setError("");
    const errors = validate(nextStatus);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setError("Please fix the highlighted fields before creating the exam session.");
      return;
    }

    setSubmittingAction(nextStatus);

    try {
      const response = await examsService.create({
        title: form.title.trim(),
        description: form.description.trim() || null,
        class_id: form.class_id,
        question_bank_id: form.question_bank_id,
        status: nextStatus,
        start_at: toDateTimePayload(form.start_at),
        end_at: toDateTimePayload(form.end_at),
        duration_minutes: Number(form.duration_minutes),
        attempt_limit: Number(form.attempt_limit),
        question_count: selectedQuestionIds.length,
        question_ids: selectedQuestionIds,
        result_visibility: form.result_visibility,
        access_code: form.access_code.trim() || null,
        randomize_questions: form.randomize_questions,
        randomize_answers: form.randomize_answers,
      });

      router.push("/teacher/exams");
    } catch (err) {
      setError(getErrorMessage(err));
      setFieldErrors(err?.response?.data?.fields ?? {});
    } finally {
      setSubmittingAction(null);
    }
  }

  return (
    <main className="min-h-full bg-background px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-normal text-foreground">Create Exam Session</h1>
          </div>

          <Button asChild variant="ghost">
            <Link href="/teacher/exams">
              <ArrowLeft className="size-4" />
              Back to exams
            </Link>
          </Button>
        </div>

        {loading ? (
          <CreateExamLoadingState />
        ) : (
          <CreateExamForm
            availableQuestions={availableQuestions}
            classes={classes}
            error={error}
            fieldErrors={fieldErrors}
            form={form}
            isSubmitting={Boolean(submittingAction)}
            onFieldChange={updateField}
            onInputChange={handleInputChange}
            onOpenQuestionPicker={(mode) => {
              setPickerMode(mode);
              setPickerOpen(true);
            }}
            onSelectionModeChange={(mode) => {
              setSelectionMode(mode);
              setFieldErrors((current) => ({ ...current, question_count: undefined }));
            }}
            onSubmitExam={submitExam}
            questionBanks={questionBanks}
            selectedQuestionCount={selectedQuestionIds.length}
            selectedQuestions={selectedQuestions}
            selectionMode={selectionMode}
            submittingAction={submittingAction}
          />
        )}
        <ExamQuestionPickerModal
          isOpen={pickerOpen}
          mode={pickerMode}
          questionBankId={form.question_bank_id}
          randomCount={Number(form.question_count)}
          initialSelectedIds={selectedQuestionIds}
          onCancel={() => setPickerOpen(false)}
          onConfirm={({ questionIds, questions }) => {
            setSelectedQuestionIds(questionIds);
            setSelectedQuestions(questions);
            setForm((current) => ({ ...current, question_count: String(questionIds.length) }));
            setFieldErrors((current) => ({ ...current, question_count: undefined }));
            setPickerOpen(false);
          }}
        />
      </section>
    </main>
  );
}
