"use client";

import { useRouter } from "next/navigation";

import { aiService } from "@/services/ai.service";
import { questionBanksService } from "@/services/question-banks.service";
import { useAuthStore } from "@/stores/auth-store";

import {
  QuestionBankEditorForm,
  QuestionBankExcelImportModal,
  QuestionBankMaterialGenerateModal,
} from "../_components/question-bank-editor-form";
import {
  useQuestionBankEditorState,
  useQuestionBankEditorSubmit,
} from "../_lib/question-bank-editor";

/**
 * Create page wires editor state to the create API and redirects to detail after save.
 */
export default function CreateQuestionBankPage() {
  const router = useRouter();
  const profile = useAuthStore((state) => state.profile);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const editor = useQuestionBankEditorState();
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
      {/* Create Editor */}
      <QuestionBankEditorForm
        errors={editor.errors}
        form={editor.form}
        mode="create"
        onAddOption={editor.addOption}
        onAddQuestion={editor.addQuestion}
        onCancel={() => router.push("/teacher/question-banks")}
        onDeleteOption={editor.deleteOption}
        onDeleteQuestion={editor.deleteQuestion}
        onDismissSubmitError={editor.dismissSubmitError}
        onGenerateMaterial={() => editor.openMaterialGenerator(profile, refreshProfile)}
        onImportExcel={editor.openExcelImporter}
        onMetadataChange={editor.handleMetadataChange}
        onOptionChange={editor.updateOption}
        onQuestionFieldChange={editor.updateQuestionField}
        onSubmit={handleSubmit}
        questions={editor.questions}
        submitting={submitting}
      />

      {/* Excel Import Modal */}
      {editor.showExcelImporter && (
        <QuestionBankExcelImportModal
          onCancel={editor.closeExcelImporter}
          onQuestionsImported={editor.handleImportedQuestions}
        />
      )}

      {/* AI Material Generator Modal */}
      {editor.showMaterialGenerator && (
        <QuestionBankMaterialGenerateModal
          generateQuestions={aiService.generateQuestionsFromMaterial}
          onCancel={editor.closeMaterialGenerator}
          onQuestionsGenerated={editor.handleGeneratedQuestions}
        />
      )}
    </>
  );
}
