"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, Archive, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { questionBanksService } from "@/services/question-banks.service";

import { QuestionBankForm } from "../../_components/question-bank-form";
import { QuestionBanksStatePanel } from "../../_components/question-banks-state-panel";

function toFormValues(questionBank) {
  return {
    title: questionBank?.title || "",
    description: questionBank?.description || "",
    topic: questionBank?.topic || "",
    status: questionBank?.status === "Assigned" ? "Assigned" : "Private",
  };
}

function buildPayload(form) {
  return {
    title: form.title.trim(),
    description: form.description.trim() || null,
    topic: form.topic.trim() || null,
    status: form.status,
  };
}

export default function EditQuestionBankPage() {
  const router = useRouter();
  const params = useParams();
  const questionBankId = useMemo(() => {
    const id = params?.id;
    return Array.isArray(id) ? id[0] : id;
  }, [params]);

  const [form, setForm] = useState(toFormValues(null));
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const loadQuestionBank = useCallback(async () => {
    if (!questionBankId) return;

    setLoading(true);
    setLoadError("");

    try {
      const response = await questionBanksService.getOne(questionBankId);
      setForm(toFormValues(response?.data));
    } catch (err) {
      setLoadError(err.response?.data?.message || err.message || "Failed to load question bank.");
    } finally {
      setLoading(false);
    }
  }, [questionBankId]);

  useEffect(() => {
    async function loadCurrentQuestionBank() {
      await loadQuestionBank();
    }

    loadCurrentQuestionBank();
  }, [loadQuestionBank]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setFieldErrors({});

    if (!form.title.trim()) {
      setError("Please complete all required information.");
      setFieldErrors({ title: "Please complete all required information." });
      return;
    }

    setSubmitting(true);
    try {
      await questionBanksService.update(questionBankId, buildPayload(form));
      router.push(`/teacher/question-banks/${questionBankId}`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Question bank could not be updated.");
      setFieldErrors(err.response?.data?.fields || {});
    } finally {
      setSubmitting(false);
    }
  }

  async function handleArchive() {
    const confirmed = window.confirm("Archive this question bank?");
    if (!confirmed) return;

    setError("");
    setArchiving(true);

    try {
      await questionBanksService.remove(questionBankId);
      router.push("/teacher/question-banks");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Question bank archive failed.");
    } finally {
      setArchiving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-3xl">
          <QuestionBanksStatePanel title="Loading question bank" description="Fetching saved information." />
        </section>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-3xl">
          <QuestionBanksStatePanel
            action={
              <Button onClick={loadQuestionBank} type="button">
                Try Again
              </Button>
            }
            icon={<AlertCircle className="size-5" />}
            title="Unable to load question bank"
            description={loadError}
          />
        </section>
      </main>
    );
  }

  return (
    <QuestionBankForm
      actionSlot={
        <Button disabled={archiving || submitting} onClick={handleArchive} type="button" variant="destructive">
          {archiving ? <Loader2 className="size-4 animate-spin" /> : <Archive className="size-4" />}
          {archiving ? "Archiving..." : "Archive"}
        </Button>
      }
      description="Update metadata teachers use to find, assign, and reuse this question bank."
      error={error}
      fieldErrors={fieldErrors}
      form={form}
      onChange={handleChange}
      onSubmit={handleSubmit}
      submitLabel="Save Changes"
      submitting={submitting}
      title="Edit Question Bank"
    />
  );
}