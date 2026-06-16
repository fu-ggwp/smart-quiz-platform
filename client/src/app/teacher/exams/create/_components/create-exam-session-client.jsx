"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import classesService from "@/services/classes.service";
import { examsService } from "@/services/exams.service";
import { questionBanksService } from "@/services/question-banks.service";

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
        questionBanksService.listAssigned(),
      ]);

      const activeClasses = (classRows ?? []).filter((item) => item.status === "active");
      const availableBanks = bankResult ?? [];
      const firstUsableBank = availableBanks.find((bank) => getQuestionCount(bank) > 0);

      setClasses(activeClasses);
      setQuestionBanks(availableBanks);
      setForm((current) => ({
        ...current,
        class_id: current.class_id || activeClasses[0]?.class_id || "",
        question_bank_id: current.question_bank_id || firstUsableBank?.question_bank_id || availableBanks[0]?.question_bank_id || "",
      }));
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
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
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
    } else if (questionCount > availableQuestions) {
      errors.question_count = `Only ${availableQuestions} questions are available in the selected bank.`;
    }
    if (availableQuestions <= 0) {
      errors.question_bank_id = "The selected question bank has no available questions.";
    }

    if (nextStatus === "active") {
      if (!form.start_at) errors.start_at = "Start time is required before activating.";
      if (!form.end_at) errors.end_at = "End time is required before activating.";
      if (startTime && startTime < Date.now()) errors.start_at = "Start time cannot be in the past.";
    }

    if ((form.start_at && !form.end_at) || (!form.start_at && form.end_at)) {
      errors.start_at = errors.start_at || "Start and end time must be provided together.";
      errors.end_at = errors.end_at || "Start and end time must be provided together.";
    }

    if (startTime && endTime && endTime <= startTime) {
      errors.end_at = "End time must be later than start time.";
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
        question_count: Number(form.question_count),
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
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-normal text-foreground">Create Exam Session</h1>
            <p className="mt-2 text-sm text-muted-foreground">Create an official exam session for one of your active classes.</p>
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
            onSubmitExam={submitExam}
            questionBanks={questionBanks}
            selectedBank={selectedBank}
            submittingAction={submittingAction}
          />
        )}
      </section>
    </main>
  );
}
