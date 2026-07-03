"use client";

import { useRouter } from "next/navigation";

import { questionBanksService } from "@/services/question-banks.service";

import {
  QuestionBankEditorForm,
  QuestionBankExcelImportModal,
  QuestionBankMaterialGenerateModal,
} from "../_components/question-bank-editor-form";
import {
  emptyQuestion,
  useQuestionBankEditorState,
  useQuestionBankEditorSubmit,
} from "../_lib/question-bank-editor";

export default function CreateQuestionBankPage() {
  const router = useRouter();
  const editor = useQuestionBankEditorState({ initialQuestions: [emptyQuestion()] });
  const { handleSubmit, submitting } = useQuestionBankEditorSubmit({
    editor,
    fallbackErrorMessage: "Question bank could not be created.",
    onSave: questionBanksService.create,
    onSuccess: (response) => {
      const questionBankId = response?.question_bank_id;
      router.push(questionBankId ? `/teacher/question-banks/${questionBankId}` : "/teacher/question-banks");
    },
  });

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
        onGenerateMaterial={editor.openMaterialGenerator}
        onImportExcel={editor.openExcelImporter}
        onMetadataChange={editor.handleMetadataChange}
        onOptionChange={editor.updateOption}
        onQuestionFieldChange={editor.updateQuestionField}
        onSubmit={handleSubmit}
        questions={editor.questions}
        submitting={submitting}
      />

      {editor.showExcelImporter && (
        <QuestionBankExcelImportModal
          onCancel={editor.closeExcelImporter}
          onQuestionsImported={editor.handleImportedQuestions}
        />
      )}

      {editor.showMaterialGenerator && (
        <QuestionBankMaterialGenerateModal
          generateQuestions={questionBanksService.generateFromMaterial}
          onCancel={editor.closeMaterialGenerator}
          onQuestionsGenerated={editor.handleGeneratedQuestions}
        />
      )}
    </>
  );
}
