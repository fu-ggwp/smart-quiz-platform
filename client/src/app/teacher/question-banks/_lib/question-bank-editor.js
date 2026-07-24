"use client";

import { useState } from "react";

import {
  canUsePremiumFeature,
  PREMIUM_FEATURES,
  PREMIUM_REQUIRED_MESSAGE,
} from "@/lib/premium";

export const initialQuestionBankForm = {
  title: "",
  description: "",
  subject: "",
  status: "Draft",
};

/**
 * Create one empty option in the editor draft shape.
 */
export function emptyOption() {
  return { option_text: "", is_correct: false };
}

/**
 * Group blank chapters under one readable label for chapter accordions.
 */
export function getQuestionChapterLabel(question) {
  return question?.chapter?.trim() || "No Chapter";
}

/**
 * Preserve question indexes while grouping cards by chapter for rendering.
 */
export function groupQuestionsByChapter(questions = [], getGroupKey = getQuestionChapterLabel) {
  const groups = [];
  const groupIndexes = new Map();

  questions.forEach((question, index) => {
    const chapter = getGroupKey(question) || "No Chapter";

    if (!groupIndexes.has(chapter)) {
      groupIndexes.set(chapter, groups.length);
      groups.push({ chapter, questions: [] });
    }

    groups[groupIndexes.get(chapter)].questions.push({ question, index });
  });

  return groups;
}

/**
 * Create a new editable question with the minimum two answer options.
 */
export function emptyQuestion() {
  return {
    question_text: "",
    explanation: "",
    chapter: "",
    groupChapter: "No Chapter",
    options: [emptyOption(), emptyOption()],
  };
}

/**
 * Keep server options in display order before converting them to editor state.
 */
export function sortQuestionOptions(options = []) {
  return [...options].sort((left, right) => (left.display_order || 0) - (right.display_order || 0));
}

/**
 * Normalize server/imported options into the editor option shape.
 */
export function toEditorOptions(options = []) {
  return sortQuestionOptions(options).map((option) => ({
    option_text: option.option_text || "",
    is_correct: Boolean(option.is_correct),
  }));
}

/**
 * Convert server question rows into the client draft shape used by the editor.
 */
export function toQuestionDraft(question) {
  const sourceOptions = question?.answer_options || question?.options || [];

  return {
    question_id: question?.question_id,
    source_question_id: question?.source_question_id || null,
    question_text: question?.question_text || "",
    explanation: question?.explanation || "",
    chapter: question?.chapter || "",
    groupChapter: getQuestionChapterLabel(question),
    options: toEditorOptions(sourceOptions),
  };
}

/**
 * Convert question-bank metadata into controlled form state.
 */
export function toQuestionBankForm(questionBank) {
  return {
    title: questionBank?.title || "",
    description: questionBank?.description || "",
    subject: questionBank?.subject || "",
    status: questionBank?.status === "Ready" ? "Ready" : "Draft",
  };
}

/**
 * Convert editor state into the API payload expected by the backend validator.
 */
export function buildQuestionBankPayload(form, questions) {
  return {
    title: form.title.trim(),
    description: form.description.trim() || null,
    subject: form.subject.trim() || null,
    status: form.status,
    questions: questions.map((question) => ({
      question_id: question.question_id,
      source_question_id: question.source_question_id || null,
      question_text: question.question_text.trim(),
      explanation: question.explanation?.trim() || null,
      chapter: question.chapter?.trim() || null,
      answer_options: question.options.map((option) => ({
        option_text: option.option_text.trim(),
        is_correct: Boolean(option.is_correct),
      })),
    })),
  };
}

/**
 * Client-side validation mirrors the backend rules for faster feedback.
 */
export function validateQuestionBankEditor(form, questions) {
  const errors = {};

  if (!form.title.trim()) {
    errors.title = "Please complete all required information.";
  }

  questions.forEach((question, index) => {
    const correctCount = question.options.filter((option) => option.is_correct).length;

    if (!question.question_text.trim()) {
      errors[`q_${index}_text`] = "Question prompt cannot be empty.";
    }

    if (question.options.length < 2) {
      errors[`q_${index}_options`] = "Question must have at least 2 options.";
    } else if (correctCount < 1) {
      errors[`q_${index}_options`] = "At least one correct option must be selected.";
    }

    if (!errors[`q_${index}_options`] && question.options.some((option) => !option.option_text.trim())) {
      errors[`q_${index}_options`] = "All options must be filled out.";
    }
  });

  return errors;
}

/**
 * Convert nested backend field errors into the editor's per-card error keys.
 */
export function mapQuestionBankServerErrors(fields = {}) {
  const errors = {};

  Object.entries(fields).forEach(([field, message]) => {
    const questionMatch = field.match(/^questions\.(\d+)\.(.+)$/);
    if (!questionMatch) {
      errors[field] = message;
      return;
    }

    const [, index, suffix] = questionMatch;
    if (suffix === "question_text") errors[`q_${index}_text`] = message;
    else if (suffix.startsWith("answer_options")) errors[`q_${index}_options`] = message;
    else errors[`q_${index}_${suffix}`] = message;
  });

  return errors;
}

/**
 * Re-index question errors after a card is deleted.
 */
function shiftQuestionErrorsAfterDelete(errors, deletedIndex) {
  const next = {};

  Object.entries(errors).forEach(([key, value]) => {
    const match = key.match(/^q_(\d+)_(.+)$/);
    if (!match) {
      if (key !== "submit") next[key] = value;
      return;
    }

    const currentIndex = Number(match[1]);
    const suffix = match[2];
    if (currentIndex < deletedIndex) next[key] = value;
    if (currentIndex > deletedIndex) next[`q_${currentIndex - 1}_${suffix}`] = value;
  });

  return next;
}

/**
 * Owns all draft state for create/edit pages: metadata, questions, errors, modals.
 */
export function useQuestionBankEditorState({
  initialForm = initialQuestionBankForm,
  initialQuestions = [],
} = {}) {
  const [form, setForm] = useState(initialForm);
  const [questions, setQuestions] = useState(initialQuestions);
  const [errors, setErrors] = useState({});
  const [showExcelImporter, setShowExcelImporter] = useState(false);
  const [showMaterialGenerator, setShowMaterialGenerator] = useState(false);

  // Clear one field error and the submit banner once the teacher edits again.
  function clearError(name) {
    setErrors((current) => {
      const next = { ...current };
      delete next[name];
      delete next.submit;
      return next;
    });
  }

  function dismissSubmitError() {
    setErrors((current) => {
      const next = { ...current };
      delete next.submit;
      return next;
    });
  }

  function handleMetadataChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    clearError(name);
  }

  function addQuestion() {
    setQuestions((current) => [...current, emptyQuestion()]);
    clearError("questions");
  }

  /**
   * Append imported/generated questions without replacing existing draft cards.
   */
  function appendImportedQuestions(importedQuestions = []) {
    const drafts = importedQuestions.map((question) => ({
      question_text: question.question_text || "",
      explanation: question.explanation || "",
      chapter: question.chapter || "",
      groupChapter: getQuestionChapterLabel(question),
      options: toEditorOptions(question.options || question.answer_options || []),
    }));

    if (drafts.length === 0) return;

    setQuestions((current) => [...current, ...drafts]);
    clearError("questions");
  }

  function handleImportedQuestions(importedQuestions) {
    appendImportedQuestions(importedQuestions);
    setShowExcelImporter(false);
  }

  function handleGeneratedQuestions(generatedQuestions) {
    appendImportedQuestions(generatedQuestions);
    setShowMaterialGenerator(false);
  }

  function deleteQuestion(index) {
    setQuestions((current) => current.filter((_, currentIndex) => currentIndex !== index));
    setErrors((current) => shiftQuestionErrorsAfterDelete(current, index));
  }

  function updateQuestionField(index, field, value) {
    setQuestions((current) => current.map((question, currentIndex) => {
      if (currentIndex !== index) return question;
      return { ...question, [field]: value };
    }));

    clearError(field === "question_text" ? `q_${index}_text` : `q_${index}_${field}`);
  }

  function addOption(index) {
    setQuestions((current) => current.map((question, currentIndex) => (
      currentIndex === index
        ? { ...question, options: [...question.options, emptyOption()] }
        : question
    )));
    clearError(`q_${index}_options`);
  }

  function deleteOption(questionIndex, optionIndex) {
    setQuestions((current) => current.map((question, currentIndex) => (
      currentIndex === questionIndex
        ? { ...question, options: question.options.filter((_, currentOptionIndex) => currentOptionIndex !== optionIndex) }
        : question
    )));
    clearError(`q_${questionIndex}_options`);
  }

  function updateOption(questionIndex, optionIndex, field, value) {
    setQuestions((current) => current.map((question, currentIndex) => {
      if (currentIndex !== questionIndex) return question;

      const options = question.options.map((option, currentOptionIndex) => {
        if (currentOptionIndex !== optionIndex) return option;
        return { ...option, [field]: value };
      });

      return { ...question, options };
    }));
    clearError(`q_${questionIndex}_options`);
  }

  return {
    addOption,
    addQuestion,
    appendImportedQuestions,
    closeExcelImporter: () => setShowExcelImporter(false),
    closeMaterialGenerator: () => setShowMaterialGenerator(false),
    deleteOption,
    deleteQuestion,
    dismissSubmitError,
    errors,
    form,
    handleGeneratedQuestions,
    handleImportedQuestions,
    handleMetadataChange,
    openExcelImporter: () => setShowExcelImporter(true),
    openMaterialGenerator: async (profile, refreshProfile) => {
      const currentProfile = profile?.premium ? profile : await refreshProfile?.();

      if (!canUsePremiumFeature(currentProfile, PREMIUM_FEATURES.AI_GENERATE_FROM_MATERIAL)) {
        setErrors((current) => ({ ...current, submit: PREMIUM_REQUIRED_MESSAGE }));
        return;
      }

      setErrors((current) => {
        const next = { ...current };
        delete next.submit;
        return next;
      });
      setShowMaterialGenerator(true);
    },
    questions,
    setErrors,
    setForm,
    setQuestions,
    showExcelImporter,
    showMaterialGenerator,
    updateOption,
    updateQuestionField,
  };
}

/**
 * Shared submit hook for create and edit pages.
 * It validates locally, saves through the provided service, then maps API errors back to fields.
 */
export function useQuestionBankEditorSubmit({ editor, fallbackErrorMessage, onSave, onSuccess }) {
  const [submitting, setSubmitting] = useState(false);
  const [errorScrollSignal, setErrorScrollSignal] = useState(0);

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = validateQuestionBankEditor(editor.form, editor.questions);
    editor.setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setErrorScrollSignal((current) => current + 1);
      return;
    }

    setSubmitting(true);
    try {
      const response = await onSave(buildQuestionBankPayload(editor.form, editor.questions));
      onSuccess(response);
    } catch (err) {
      const fieldErrors = mapQuestionBankServerErrors(err.response?.data?.fields || {});
      editor.setErrors({
        ...fieldErrors,
        submit: Object.keys(fieldErrors).length
          ? "Please review the highlighted fields."
          : err.response?.data?.error || err.message || fallbackErrorMessage,
      });
      setErrorScrollSignal((current) => current + 1);
    } finally {
      setSubmitting(false);
    }
  }

  return { errorScrollSignal, handleSubmit, submitting };
}
