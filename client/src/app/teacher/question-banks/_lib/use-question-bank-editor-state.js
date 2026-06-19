"use client";

import { useState } from "react";

import {
  emptyOption,
  emptyQuestion,
  initialQuestionBankForm,
  normalizeMultipleChoiceOptions,
  normalizeTrueFalseOptions,
  shiftQuestionErrorsAfterDelete,
} from "./question-bank-editor";

export function useQuestionBankEditorState({
  initialForm = initialQuestionBankForm,
  initialQuestions = [],
} = {}) {
  const [form, setForm] = useState(initialForm);
  const [questions, setQuestions] = useState(initialQuestions);
  const [errors, setErrors] = useState({});

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
      question_type: "multiple_choice",
      score: 1,
      explanation: question.explanation || "",
      subject: "",
      topic: question.topic || "",
      chapter: question.chapter || "",
      options: normalizeMultipleChoiceOptions(question.options || question.answer_options || []),
    }));

    if (drafts.length === 0) return;

    setQuestions((current) => [...current, ...drafts]);
    clearError("questions");
  }

  function deleteQuestion(index) {
    setQuestions((current) => current.filter((_, currentIndex) => currentIndex !== index));
    setErrors((current) => shiftQuestionErrorsAfterDelete(current, index));
  }

  function updateQuestionField(index, field, value) {
    setQuestions((current) => current.map((question, currentIndex) => {
      if (currentIndex !== index) return question;

      if (field === "question_type" && value === "true_false") {
        return { ...question, question_type: value, options: normalizeTrueFalseOptions(question.options) };
      }

      if (field === "question_type") {
        return { ...question, question_type: value, options: normalizeMultipleChoiceOptions(question.options) };
      }

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

      if (field === "is_correct" && question.question_type === "true_false" && value) {
        return {
          ...question,
          options: options.map((option, currentOptionIndex) => ({
            ...option,
            is_correct: currentOptionIndex === optionIndex,
          })),
        };
      }

      return { ...question, options };
    }));
    clearError(`q_${questionIndex}_options`);
  }

  return {
    addOption,
    addQuestion,
    appendImportedQuestions,
    deleteOption,
    deleteQuestion,
    errors,
    form,
    handleMetadataChange,
    questions,
    setErrors,
    setForm,
    setQuestions,
    updateOption,
    updateQuestionField,
  };
}
