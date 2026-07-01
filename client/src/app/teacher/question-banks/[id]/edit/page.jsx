"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { questionBanksService } from "@/services/question-banks.service";
import ConfirmModal from "@/components/common/ConfirmModal";

import {
  QuestionBankEditorForm,
  QuestionBankExcelImportModal,
  QuestionBankMaterialGenerateModal,
} from "../../_components/question-bank-editor-form";
import { QuestionBanksStatePanel } from "../../_components/question-banks-state-panel";
import {
  toQuestionBankForm,
  toQuestionDraft,
  useQuestionBankEditorState,
  useQuestionBankEditorSubmit,
} from "../../_lib/question-bank-editor";

function normalizeParamId(value) {
  return Array.isArray(value) ? value[0] : value;
}

export default function EditQuestionBankPage() {
  const router = useRouter();
  const params = useParams();
  const questionBankId = useMemo(() => normalizeParamId(params?.id), [params]);
  const detailHref = `/teacher/question-banks/${questionBankId}`;
  const editor = useQuestionBankEditorState();
  const { setErrors, setForm, setQuestions } = editor;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { handleSubmit } = useQuestionBankEditorSubmit({
    editor,
    fallbackErrorMessage: "Question bank could not be updated.",
    onSave: (payload) => questionBanksService.update(questionBankId, payload),
    onSuccess: () => router.push(detailHref),
  });

  const loadQuestionBank = useCallback(async () => {
    if (!questionBankId) return;

    setLoading(true);
    setLoadError("");

    try {
      const [bankResponse, questionRows] = await Promise.all([
        questionBanksService.getOne(questionBankId),
        questionBanksService.listQuestions(questionBankId),
      ]);

      setForm(toQuestionBankForm(bankResponse));
      setQuestions((questionRows || []).map(toQuestionDraft));
      setErrors({});
    } catch (err) {
      setLoadError(err.response?.data?.error || err.message || "Failed to load question bank.");
    } finally {
      setLoading(false);
    }
  }, [questionBankId, setErrors, setForm, setQuestions]);

  useEffect(() => {
    void Promise.resolve().then(loadQuestionBank);
  }, [loadQuestionBank]);

  async function executeDelete() {
    editor.setErrors({});
    setArchiving(true);

    try {
      await questionBanksService.remove(questionBankId);
      router.push("/teacher/question-banks");
    } catch (err) {
      editor.setErrors({ submit: err.response?.data?.error || err.message || "Question bank delete failed." });
    } finally {
      setArchiving(false);
      setShowDeleteModal(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-4xl">
          <QuestionBanksStatePanel title="Loading question bank" description="Fetching metadata and questions." />
        </section>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-4xl">
          <QuestionBanksStatePanel
            action={<Button onClick={loadQuestionBank} type="button">Try Again</Button>}
            icon={<AlertCircle className="size-5" />}
            title="Unable to load question bank"
            description={loadError}
          />
        </section>
      </main>
    );
  }

  return (
    <>
      <QuestionBankEditorForm
        actionSlot={(
          <Button disabled={archiving || submitting} onClick={() => setShowDeleteModal(true)} type="button" variant="destructive">
            {archiving ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            {archiving ? "Deleting..." : "Delete"}
          </Button>
        )}
        errors={editor.errors}
        form={editor.form}
        mode="edit"
        onAddOption={editor.addOption}
        onAddQuestion={editor.addQuestion}
        onCancel={() => router.push(detailHref)}
        onDeleteOption={editor.deleteOption}
        onDeleteQuestion={editor.deleteQuestion}
        onGenerateMaterial={editor.openMaterialGenerator}
        onImportExcel={editor.openExcelImporter}
        onMetadataChange={editor.handleMetadataChange}
        onOptionChange={editor.updateOption}
        onQuestionFieldChange={editor.updateQuestionField}
        onSubmit={handleSubmit}
        questions={editor.questions}
        submitting={submitting || archiving}
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

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Question Bank?"
        message="Are you sure you want to delete this question bank? This action is permanent and cannot be undone."
        confirmLabel={archiving ? "Deleting..." : "Delete"}
        cancelLabel="Cancel"
        onConfirm={executeDelete}
        onCancel={() => setShowDeleteModal(false)}
        variant="danger"
      />
    </>
  );
}
