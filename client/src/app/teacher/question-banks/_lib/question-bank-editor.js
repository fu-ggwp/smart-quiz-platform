"use client";

import { useState } from "react";

export const initialQuestionBankForm = {
  title: "",
  description: "",
  topic: "",
  status: "Draft",
};

export function emptyOption(label = "") {
  return { option_text: label, is_correct: false };
}

export function getQuestionChapterLabel(question) {
  return question?.chapter?.trim() || "No Chapter";
}

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

export function emptyQuestion() {
  return {
    question_text: "",
    explanation: "",
    chapter: "",
    groupChapter: "No Chapter",
    options: [emptyOption(), emptyOption()],
  };
}

export function sortQuestionOptions(options = []) {
  return [...options].sort((left, right) => (left.display_order || 0) - (right.display_order || 0));
}

export function normalizeMultipleChoiceOptions(options = []) {
  const next = sortQuestionOptions(options).map((option) => ({
    option_text: option.option_text || "",
    is_correct: Boolean(option.is_correct),
  }));

  while (next.length < 2) next.push(emptyOption());
  return next;
}

export function toQuestionDraft(question) {
  const sourceOptions = question?.answer_options || question?.options || [];

  return {
    question_id: question?.question_id,
    source_question_id: question?.source_question_id || null,
    question_text: question?.question_text || "",
    explanation: question?.explanation || "",
    chapter: question?.chapter || "",
    groupChapter: getQuestionChapterLabel(question),
    options: normalizeMultipleChoiceOptions(sourceOptions),
  };
}

export function toQuestionBankForm(questionBank) {
  return {
    title: questionBank?.title || "",
    description: questionBank?.description || "",
    topic: questionBank?.topic || "",
    status: questionBank?.status === "Ready" ? "Ready" : "Draft",
  };
}

export function buildQuestionBankPayload(form, questions) {
  return {
    title: form.title.trim(),
    description: form.description.trim() || null,
    topic: form.topic.trim() || null,
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

export function useQuestionBankEditorState({
  initialForm = initialQuestionBankForm,
  initialQuestions = [],
} = {}) {
  const [form, setForm] = useState(initialForm);
  const [questions, setQuestions] = useState(initialQuestions);
  const [errors, setErrors] = useState({});
  const [showExcelImporter, setShowExcelImporter] = useState(false);
  const [showMaterialGenerator, setShowMaterialGenerator] = useState(false);

  function clearError(name) {
    setErrors((current) => {
      const next = { ...current };
      delete next[name];
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

  function appendImportedQuestions(importedQuestions = []) {
    const drafts = importedQuestions.map((question) => ({
      question_text: question.question_text || "",
      explanation: question.explanation || "",
      chapter: question.chapter || "",
      groupChapter: getQuestionChapterLabel(question),
      options: normalizeMultipleChoiceOptions(question.options || question.answer_options || []),
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
    errors,
    form,
    handleGeneratedQuestions,
    handleImportedQuestions,
    handleMetadataChange,
    openExcelImporter: () => setShowExcelImporter(true),
    openMaterialGenerator: () => setShowMaterialGenerator(true),
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

export function useQuestionBankEditorSubmit({ editor, fallbackErrorMessage, onSave, onSuccess }) {
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = validateQuestionBankEditor(editor.form, editor.questions);
    editor.setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

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
    } finally {
      setSubmitting(false);
    }
  }

  return { handleSubmit, submitting };
}
