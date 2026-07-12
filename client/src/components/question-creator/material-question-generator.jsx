"use client";

import { useRef, useState } from "react";
import { AlertTriangle, FileCheck, FileText, FileUp, Loader2, Plus, RotateCcw, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import QuestionCardEditor from "@/components/question-creator/question-card-editor";

const acceptedTypes = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

/**
 * Read an API error from either validation or AI service failure responses.
 */
function getErrorMessage(error) {
  return error?.response?.data?.message
    || error?.response?.data?.error
    || error?.message
    || "AI processing is currently unavailable. Please try again later.";
}

/**
 * Upload PDF/DOCX material, generate question drafts, preview them, then add to editor.
 */
export default function MaterialQuestionGenerator({
  generateQuestions,
  onCancel,
  onQuestionsGenerated,
}) {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [focus, setFocus] = useState("");
  const [questionCount, setQuestionCount] = useState(5);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);

  /**
   * Accept one supported material file and clear stale preview results.
   */
  function handleFileChange(event) {
    const selectedFile = event.target.files?.[0];
    event.target.value = "";

    if (!selectedFile) return;

    if (!acceptedTypes.includes(selectedFile.type)) {
      setFile(null);
      setGeneratedQuestions([]);
      setError("Only PDF or DOCX files are supported.");
      return;
    }

    setFile(selectedFile);
    setGeneratedQuestions([]);
    setError("");
  }

  /**
   * Validate inputs, call the AI generation API, and store preview questions.
   */
  async function handleGenerate() {
    const count = Number(questionCount);

    if (!file) {
      setError("Please upload a PDF or DOCX learning material file.");
      return;
    }

    if (!Number.isInteger(count) || count < 1 || count > 30) {
      setError("Question count must be a number from 1 to 30.");
      return;
    }

    const payload = new FormData();
    payload.append("material", file);
    payload.append("questionCount", String(count));
    payload.append("focus", focus.trim());

    setGenerating(true);
    setError("");

    try {
      const data = await generateQuestions(payload);
      const questions = data?.questions || [];
      setGeneratedQuestions(questions);

      if (!questions.length) {
        setError("AI returned no usable questions. Try a clearer material file or focus request.");
      }
    } catch (err) {
      setGeneratedQuestions([]);
      setError(getErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  }

  /**
   * Send previewed questions back to the question-bank draft editor.
   */
  function handleAddToDraft() {
    if (!generatedQuestions.length) return;
    onQuestionsGenerated(generatedQuestions);
  }

  const hasPreview = generatedQuestions.length > 0;

  return (
    <div className="w-full rounded-2xl border border-border bg-card p-6 shadow-lg">
      <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Generate Questions from Material</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Upload a PDF or DOCX file and generate multiple choice question drafts.
          </p>
        </div>
        <Button onClick={onCancel} variant="ghost" size="sm" type="button">
          Cancel
        </Button>
      </div>

      <div className="space-y-5">
        {/* Material Upload */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full rounded-2xl border-2 border-dashed border-border bg-muted/20 p-8 text-center transition hover:border-ring"
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileChange}
          />
          <span className="flex flex-col items-center gap-3">
            <span className="rounded-full bg-muted p-3 text-primary">
              {file ? <FileCheck className="size-6" /> : <FileUp className="size-6" />}
            </span>
            <span>
              <span className="block text-sm font-semibold text-foreground">
                {file ? file.name : "Click to upload material"}
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                Supports PDF and DOCX files up to 15MB
              </span>
            </span>
          </span>
        </button>

        {/* Generation Settings */}
        <div className="grid gap-4 md:grid-cols-[180px_1fr]">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Number of Question</label>
            <Input
              min="1"
              max="30"
              type="number"
              value={questionCount}
              onChange={(event) => setQuestionCount(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Focus Content</label>
            <textarea
              className="min-h-[78px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="e.g. Focus on definitions, formulas, or chapter 2 examples."
              value={focus}
              onChange={(event) => setFocus(event.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-error/20 bg-error/10 p-4 text-sm text-error">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {hasPreview && (
          /* Generated Question Preview */
          <div className="space-y-4 rounded-2xl border border-border bg-muted/20 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">
                  Preview ({generatedQuestions.length})
                </h3>
              </div>
              <Button onClick={handleGenerate} disabled={generating} type="button" variant="outline" size="sm" className="gap-2">
                {generating ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
                Regenerate
              </Button>
            </div>

            <div className="max-h-[52vh] space-y-4 overflow-y-auto pr-1">
              {generatedQuestions.map((question, index) => (
                <QuestionCardEditor
                  key={`${question.question_text}-${index}`}
                  question={question}
                  qIndex={index}
                  readOnly
                  onAddOption={() => {}}
                  onDelete={() => {}}
                  onDeleteOption={() => {}}
                  onFieldChange={() => {}}
                  onOptionChange={() => {}}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal Actions */}
      <div className="mt-6 flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
        <Button onClick={onCancel} variant="outline" size="sm" type="button">
          Cancel
        </Button>
        <Button onClick={handleGenerate} disabled={generating} variant={hasPreview ? "outline" : "default"} size="sm" type="button" className="gap-2">
          {generating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {hasPreview ? "Regenerate" : "Generate"}
        </Button>
        <Button onClick={handleAddToDraft} disabled={!hasPreview || generating} size="sm" type="button" className="gap-2">
          <Plus className="size-4" />
          Add to Draft
        </Button>
      </div>
    </div>
  );
}
