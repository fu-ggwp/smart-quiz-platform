"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { questionBanksService } from "@/services/question-banks.service";

import { QuestionBankEditorForm, QuestionBankExcelImportModal } from "../_components/question-bank-editor-form";
import {
  buildQuestionBankPayload,
  emptyQuestion,
  mapQuestionBankServerErrors,
  validateQuestionBankEditor,
} from "../_lib/question-bank-editor";
import { useQuestionBankEditorState } from "../_lib/use-question-bank-editor-state";

export default function CreateQuestionBankPage() {
  const router = useRouter();
  const editor = useQuestionBankEditorState({ initialQuestions: [emptyQuestion()] });
  const [submitting, setSubmitting] = useState(false);
  const [showExcelImporter, setShowExcelImporter] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = validateQuestionBankEditor(editor.form, editor.questions);
    editor.setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const response = await questionBanksService.create(
        buildQuestionBankPayload(editor.form, editor.questions),
      );
      const questionBankId = response?.data?.question_bank_id;
      router.push(questionBankId ? `/teacher/question-banks/${questionBankId}` : "/teacher/question-banks");
    } catch (err) {
      const fieldErrors = mapQuestionBankServerErrors(err.response?.data?.fields || {});
      editor.setErrors({
        ...fieldErrors,
        submit: Object.keys(fieldErrors).length
          ? "Please review the highlighted fields."
          : err.response?.data?.message || err.message || "Question bank could not be created.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  function handleExcelQuestionsImported(importedQuestions) {
    editor.appendImportedQuestions(importedQuestions);
    setShowExcelImporter(false);
  }

  return (
    <>
      <QuestionBankEditorForm
        errors={editor.errors}
        form={editor.form}
        mode="create"
        onAddOption={editor.addOption}
        onAddQuestion={editor.addQuestion}
        onCancel={() => router.push("/teacher/question-banks")}
        onDeleteOption={editor.deleteOption}
        onDeleteQuestion={editor.deleteQuestion}
        onImportExcel={() => setShowExcelImporter(true)}
        onMetadataChange={editor.handleMetadataChange}
        onOptionChange={editor.updateOption}
        onQuestionFieldChange={editor.updateQuestionField}
        onSubmit={handleSubmit}
        questions={editor.questions}
        submitting={submitting}
      />

      {showExcelImporter && (
        <QuestionBankExcelImportModal
          onCancel={() => setShowExcelImporter(false)}
          onQuestionsImported={handleExcelQuestionsImported}
        />
      )}
    </>
  );
}
