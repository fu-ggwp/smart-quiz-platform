"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { questionBanksService } from "@/services/question-banks.service";

import { QuestionBankForm } from "../_components/question-bank-form";

const initialForm = {
  title: "",
  description: "",
  topic: "",
  status: "Private",
};

function buildPayload(form) {
  return {
    title: form.title.trim(),
    description: form.description.trim() || null,
    topic: form.topic.trim() || null,
    status: form.status,
  };
}

export default function CreateQuestionBankPage() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

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
      const response = await questionBanksService.create(buildPayload(form));
      const questionBankId = response?.data?.question_bank_id;

      if (questionBankId) {
        router.push(`/teacher/question-banks/${questionBankId}`);
        return;
      }

      router.push("/teacher/question-banks");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Question bank could not be created.");
      setFieldErrors(err.response?.data?.fields || {});
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <QuestionBankForm
      description="Create a reusable repository for questions before importing or generating items."
      error={error}
      fieldErrors={fieldErrors}
      form={form}
      onChange={handleChange}
      onSubmit={handleSubmit}
      submitLabel="Create Question Bank"
      submitting={submitting}
      title="Create Question Bank"
    />
  );
}