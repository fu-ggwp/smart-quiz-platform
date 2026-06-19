"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { questionBanksService } from "@/services/question-banks.service";

import { QuestionBankEditorForm, QuestionBankExcelImportModal } from "../../_components/question-bank-editor-form";
import { QuestionBanksStatePanel } from "../../_components/question-banks-state-panel";
import {
  buildQuestionBankPayload,
  mapQuestionBankServerErrors,
  toQuestionBankForm,
  toQuestionDraft,
  validateQuestionBankEditor,
} from "../../_lib/question-bank-editor";
import { useQuestionBankEditorState } from "../../_lib/use-question-bank-editor-state";

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
  const [showExcelImporter, setShowExcelImporter] = useState(false);

  const loadQuestionBank = useCallback(async () => {
    if (!questionBankId) return;

    setLoading(true);
    setLoadError("");

    try {
      const [bankResponse, questionRows] = await Promise.all([
        questionBanksService.getOne(questionBankId),
        questionBanksService.listQuestions(questionBankId),
      ]);

      setForm(toQuestionBankForm(bankResponse?.data));
      setQuestions((questionRows || []).map(toQuestionDraft));
      setErrors({});
    } catch (err) {
      setLoadError(err.response?.data?.message || err.message || "Failed to load question bank.");
    } finally {
      setLoading(false);
    }
  }, [questionBankId, setErrors, setForm, setQuestions]);

  useEffect(() => {
    void Promise.resolve().then(loadQuestionBank);
  }, [loadQuestionBank]);

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = validateQuestionBankEditor(editor.form, editor.questions);
    editor.setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      await questionBanksService.update(
        questionBankId,
        buildQuestionBankPayload(editor.form, editor.questions),
      );
      router.push(detailHref);
    } catch (err) {
      const fieldErrors = mapQuestionBankServerErrors(err.response?.data?.fields || {});
      editor.setErrors({
        ...fieldErrors,
        submit: Object.keys(fieldErrors).length
          ? "Please review the highlighted fields."
          : err.response?.data?.message || err.message || "Question bank could not be updated.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm("Delete this question bank?");
    if (!confirmed) return;

    editor.setErrors({});
    setArchiving(true);

    try {
      await questionBanksService.remove(questionBankId);
      router.push("/teacher/question-banks");
    } catch (err) {
      editor.setErrors({ submit: err.response?.data?.message || err.message || "Question bank delete failed." });
    } finally {
      setArchiving(false);
    }
  }

  function handleExcelQuestionsImported(importedQuestions) {
    editor.appendImportedQuestions(importedQuestions);
    setShowExcelImporter(false);
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
          <Button disabled={archiving || submitting} onClick={handleDelete} type="button" variant="destructive">
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
        onImportExcel={() => setShowExcelImporter(true)}
        onMetadataChange={editor.handleMetadataChange}
        onOptionChange={editor.updateOption}
        onQuestionFieldChange={editor.updateQuestionField}
        onSubmit={handleSubmit}
        questions={editor.questions}
        submitting={submitting || archiving}
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
