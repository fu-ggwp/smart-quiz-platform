"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { questionsService } from "@/services/questions.service";

import { QuestionBanksStatePanel } from "../../../../_components/question-banks-state-panel";

const questionTypes = [
  { value: "multiple_choice", label: "Multiple choice" },
  { value: "true_false", label: "True/False" },
];

function normalizeParamId(value) {
  return Array.isArray(value) ? value[0] : value;
}

function sortOptions(options = []) {
  return [...options].sort(
    (left, right) => left.display_order - right.display_order,
  );
}

function emptyOption() {
  return { option_text: "", is_correct: false };
}

function normalizeTrueFalseOptions(options = []) {
  const next = normalizeSingleCorrectOptions(options).slice(0, 2);

  while (next.length < 2) {
    next.push({
      option_text: next.length === 0 ? "True" : "False",
      is_correct: next.length === 0,
    });
  }

  if (next.every((option) => !option.is_correct)) {
    next[0].is_correct = true;
  }

  let correctSeen = false;
  return next.map((option, index) => {
    const fallbackText = index === 0 ? "True" : "False";

    if (!option.is_correct) {
      return {
        option_text: option.option_text || fallbackText,
        is_correct: false,
      };
    }

    if (correctSeen) {
      return {
        option_text: option.option_text || fallbackText,
        is_correct: false,
      };
    }

    correctSeen = true;
    return {
      option_text: option.option_text || fallbackText,
      is_correct: true,
    };
  });
}

function normalizeSingleCorrectOptions(options = []) {
  let correctSeen = false;

  return sortOptions(options).map((option) => {
    if (!option.is_correct) {
      return { option_text: option.option_text || "", is_correct: false };
    }

    if (correctSeen) {
      return { option_text: option.option_text || "", is_correct: false };
    }

    correctSeen = true;
    return { option_text: option.option_text || "", is_correct: true };
  });
}

function toFormValues(question) {
  const questionType =
    question?.question_type === "true_false" ? "true_false" : "multiple_choice";
  const options = normalizeSingleCorrectOptions(question?.answer_options || []);

  return {
    question_text: question?.question_text || "",
    question_type: questionType,
    score: String(question?.score ?? 1),
    explanation: question?.explanation || "",
    subject: question?.subject || "",
    topic: question?.topic || "",
    chapter: question?.chapter || "",
    answer_options:
      questionType === "true_false"
        ? normalizeTrueFalseOptions(options)
        : options.length >= 2
          ? options
          : [emptyOption(), emptyOption()],
  };
}

function buildPayload(form) {
  return {
    question_text: form.question_text.trim(),
    question_type: form.question_type,
    score: Number(form.score),
    explanation: form.explanation.trim() || null,
    subject: form.subject.trim() || null,
    topic: form.topic.trim() || null,
    chapter: form.chapter.trim() || null,
    answer_options: form.answer_options.map((option) => ({
      option_text: option.option_text.trim(),
      is_correct: Boolean(option.is_correct),
    })),
  };
}

function validateForm(form) {
  const errors = {};
  const options = form.answer_options;
  const score = Number(form.score);

  if (!form.question_text.trim()) {
    errors.question_text = "Please complete all required information.";
  }

  if (!Number.isFinite(score) || score < 0) {
    errors.score = "Score must be 0 or greater.";
  }

  options.forEach((option, index) => {
    if (!option.option_text.trim()) {
      errors[`answer_options.${index}.option_text`] =
        "Please complete all required information.";
    }
  });

  const correctCount = options.filter((option) => option.is_correct).length;

  if (form.question_type === "multiple_choice") {
    if (options.length < 2) {
      errors.answer_options =
        "Multiple choice questions need at least 2 answer options.";
    } else if (correctCount !== 1) {
      errors.answer_options = "Select exactly one correct answer.";
    }
  }

  if (form.question_type === "true_false") {
    if (options.length !== 2) {
      errors.answer_options =
        "True/false questions need exactly 2 answer options.";
    } else if (correctCount !== 1) {
      errors.answer_options =
        "True/false questions need exactly one correct answer.";
    }
  }

  return errors;
}

function normalizeAnswerOptionsError(message = "") {
  if (!message) return "Question answer options could not be updated.";

  if (message.toLowerCase().includes("at least 2 answer options")) {
    return "Multiple choice questions need at least 2 answer options.";
  }

  return message;
}

function isAnswerOptionsError(message = "") {
  return /answer[_ ]options|answer options|multiple-choice|multiple choice/i.test(
    message,
  );
}

export default function EditQuestionPage() {
  const params = useParams();
  const questionBankId = useMemo(() => normalizeParamId(params?.id), [params]);
  const questionId = useMemo(() => normalizeParamId(params?.qid), [params]);
  const detailHref = `/teacher/question-banks/${questionBankId}`;

  const [form, setForm] = useState(toFormValues(null));
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [savedMessage, setSavedMessage] = useState("");

  const loadQuestion = useCallback(async () => {
    if (!questionId) return;

    setLoading(true);
    setLoadError("");

    try {
      const response = await questionsService.getOne(questionId);
      setForm(toFormValues(response?.data));
    } catch (err) {
      setLoadError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load question.",
      );
    } finally {
      setLoading(false);
    }
  }, [questionId]);

  useEffect(() => {
    async function loadCurrentQuestion() {
      await loadQuestion();
    }

    loadCurrentQuestion();
  }, [loadQuestion]);

  function clearFieldError(name) {
    setSavedMessage("");
    setSubmitError("");
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  }

  function updateField(name, value) {
    setForm((current) => {
      if (name !== "question_type") return { ...current, [name]: value };

      if (value === "true_false") {
        return {
          ...current,
          question_type: value,
          answer_options: normalizeTrueFalseOptions(current.answer_options),
        };
      }

      const answerOptions =
        current.answer_options.length >= 2
          ? current.answer_options
          : [emptyOption(), emptyOption()];
      return {
        ...current,
        question_type: value,
        answer_options: answerOptions,
      };
    });
    clearFieldError(name);
  }

  function updateOption(index, field, value) {
    setForm((current) => {
      const nextOptions = current.answer_options.map((option, optionIndex) => {
        if (optionIndex !== index) return option;

        if (field === "is_correct") {
          return { ...option, is_correct: true };
        }

        return { ...option, [field]: value };
      });

      if (field === "is_correct") {
        return {
          ...current,
          answer_options: nextOptions.map((option, optionIndex) => ({
            ...option,
            is_correct: optionIndex === index,
          })),
        };
      }

      return { ...current, answer_options: nextOptions };
    });
    setSavedMessage("");
    setSubmitError("");
    setFieldErrors((current) => ({
      ...current,
      answer_options: undefined,
      [`answer_options.${index}.option_text`]: undefined,
    }));
  }

  function addOption() {
    setForm((current) => ({
      ...current,
      answer_options: [...current.answer_options, emptyOption()],
    }));
    setSavedMessage("");
    setSubmitError("");
    setFieldErrors((current) => ({ ...current, answer_options: undefined }));
  }

  function removeOption(index) {
    setForm((current) => ({
      ...current,
      answer_options: current.answer_options.filter(
        (_, optionIndex) => optionIndex !== index,
      ),
    }));
    setSavedMessage("");
    setSubmitError("");
    setFieldErrors((current) => ({ ...current, answer_options: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSavedMessage("");
    setSubmitError("");

    const errors = validateForm(form);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await questionsService.update(
        questionId,
        buildPayload(form),
      );
      setForm(toFormValues(response?.data));
      setSavedMessage(
        response?.message || "Question has been saved successfully.",
      );
    } catch (err) {
      const responseFields = err.response?.data?.fields || {};
      const responseMessage =
        err.response?.data?.message ||
        err.message ||
        "Question could not be updated.";

      if (
        Object.keys(responseFields).length === 0 &&
        isAnswerOptionsError(responseMessage)
      ) {
        setFieldErrors({
          answer_options: normalizeAnswerOptionsError(responseMessage),
        });
        setSubmitError("");
        return;
      }

      setFieldErrors(responseFields);
      setSubmitError(
        Object.keys(responseFields).length > 0
          ? ""
          : responseMessage,
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-4xl">
          <QuestionBanksStatePanel
            title="Loading question"
            description="Fetching saved question details."
          />
        </section>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-4xl">
          <QuestionBanksStatePanel
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button onClick={loadQuestion} type="button">
                  Try Again
                </Button>
                <Button asChild variant="outline">
                  <Link href={detailHref}>Back</Link>
                </Button>
              </div>
            }
            icon={<AlertCircle className="size-5" />}
            title="Unable to load question"
            description={loadError}
          />
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-4xl space-y-6">
        <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Button asChild size="sm" variant="ghost" className="mb-3 -ml-3">
              <Link href={detailHref}>
                <ArrowLeft className="size-4" />
                Back
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Edit Question
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Update the prompt, metadata, answer choices, and explanation.
            </p>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5">
          <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
              <TextAreaField
                error={fieldErrors.question_text}
                label="Question"
                name="question_text"
                onChange={(event) =>
                  updateField("question_text", event.target.value)
                }
                placeholder="Enter the question text"
                required
                value={form.question_text}
              />

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <SelectField
                  error={fieldErrors.question_type}
                  label="Type"
                  name="question_type"
                  onChange={(event) =>
                    updateField("question_type", event.target.value)
                  }
                  options={questionTypes}
                  value={form.question_type}
                />
                <NumberField
                  error={fieldErrors.score}
                  label="Score"
                  min="0"
                  name="score"
                  onChange={(event) => updateField("score", event.target.value)}
                  step="0.5"
                  value={form.score}
                />
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <TextField
                error={fieldErrors.subject}
                label="Subject"
                name="subject"
                onChange={(event) => updateField("subject", event.target.value)}
                placeholder="e.g. Math"
                value={form.subject}
              />
              <TextField
                error={fieldErrors.topic}
                label="Topic"
                name="topic"
                onChange={(event) => updateField("topic", event.target.value)}
                placeholder="e.g. Algebra"
                value={form.topic}
              />
              <TextField
                error={fieldErrors.chapter}
                label="Chapter"
                name="chapter"
                onChange={(event) => updateField("chapter", event.target.value)}
                placeholder="e.g. Chapter 2"
                value={form.chapter}
              />
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Answer Options
                </h2>
                <p className="text-sm text-muted-foreground">
                  Choose one correct answer.
                </p>
              </div>
              <Button
                disabled={form.question_type === "true_false"}
                onClick={addOption}
                size="sm"
                type="button"
                variant="outline"
              >
                <Plus className="size-4" />
                Add Option
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              {form.answer_options.map((option, index) => (
                <AnswerOptionRow
                  error={fieldErrors[`answer_options.${index}.option_text`]}
                  index={index}
                  key={index}
                  onRemove={removeOption}
                  onUpdate={updateOption}
                  option={option}
                  removable={
                    form.question_type !== "true_false" &&
                    form.answer_options.length > 2
                  }
                />
              ))}
            </div>
            <FieldError>{fieldErrors.answer_options}</FieldError>
          </section>

          <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <TextAreaField
              error={fieldErrors.explanation}
              label="Answer Explanation"
              name="explanation"
              onChange={(event) =>
                updateField("explanation", event.target.value)
              }
              placeholder="Explain why the correct answer is right"
              value={form.explanation}
            />
          </section>

          {submitError ? (
            <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {submitError}
            </p>
          ) : null}
          {savedMessage ? (
            <p className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
              <CheckCircle2 className="size-4" />
              {savedMessage}
            </p>
          ) : null}

          <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-end">
            <Button asChild disabled={submitting} variant="outline">
              <Link href={detailHref}>Cancel</Link>
            </Button>
            <Button disabled={submitting} type="submit">
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </section>
    </main>
  );
}

function FieldError({ children }) {
  if (!children) return null;
  return (
    <p className="mt-1 text-xs font-semibold text-destructive">{children}</p>
  );
}

function FieldLabel({ children, htmlFor, required = false }) {
  return (
    <label className="text-sm font-semibold text-foreground" htmlFor={htmlFor}>
      {children}
      {required ? <span className="text-destructive">*</span> : null}
    </label>
  );
}

function TextField({ error, label, name, required = false, ...props }) {
  return (
    <div className="space-y-1.5">
      <FieldLabel htmlFor={name} required={required}>
        {label}
      </FieldLabel>
      <Input aria-invalid={Boolean(error)} id={name} name={name} {...props} />
      <FieldError>{error}</FieldError>
    </div>
  );
}

function NumberField({ error, label, name, ...props }) {
  return (
    <div className="space-y-1.5">
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <Input
        aria-invalid={Boolean(error)}
        id={name}
        name={name}
        type="number"
        {...props}
      />
      <FieldError>{error}</FieldError>
    </div>
  );
}

function TextAreaField({ error, label, name, required = false, ...props }) {
  return (
    <div className="space-y-1.5">
      <FieldLabel htmlFor={name} required={required}>
        {label}
      </FieldLabel>
      <textarea
        aria-invalid={Boolean(error)}
        className="min-h-28 w-full resize-y rounded-2xl border border-transparent bg-input/50 px-3 py-2 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20"
        id={name}
        name={name}
        {...props}
      />
      <FieldError>{error}</FieldError>
    </div>
  );
}

function SelectField({ error, label, name, options, ...props }) {
  return (
    <div className="space-y-1.5">
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <select
        aria-invalid={Boolean(error)}
        className="h-10 w-full rounded-2xl border border-transparent bg-input/50 px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20"
        id={name}
        name={name}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <FieldError>{error}</FieldError>
    </div>
  );
}

function AnswerOptionRow({
  error,
  index,
  onRemove,
  onUpdate,
  option,
  removable,
}) {
  const optionLabel = String.fromCharCode(65 + index);

  return (
    <div className="grid gap-3 rounded-lg border border-border bg-background p-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-start">
      <label className="flex min-h-10 items-center gap-2 text-sm font-semibold text-foreground">
        <input
          checked={option.is_correct}
          className="size-4 cursor-pointer accent-primary"
          name="correct_answer"
          onChange={() => onUpdate(index, "is_correct", true)}
          title="Mark as correct answer"
          type="radio"
        />
        Correct
      </label>

      <div className="min-w-0 space-y-1.5">
        <Input
          aria-invalid={Boolean(error)}
          onChange={(event) =>
            onUpdate(index, "option_text", event.target.value)
          }
          placeholder={`Option ${optionLabel}`}
          value={option.option_text}
        />
        <FieldError>{error}</FieldError>
      </div>

      <Button
        disabled={!removable}
        onClick={() => onRemove(index)}
        size="icon"
        title={
          removable ? "Remove option" : "At least two options are required"
        }
        type="button"
        variant="ghost"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
