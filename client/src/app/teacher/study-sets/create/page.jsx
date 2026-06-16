"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save, ArrowLeft, Database, FileSpreadsheet } from "lucide-react";
import axiosClient from "@/services/axiosClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import QuestionBankSelector from "./QuestionBankSelector";
import ExcelImporter from "./ExcelImporter";

export default function CreateStudySetPage() {
  const router = useRouter();

  // --- 1. STATE FOR STUDY SET METADATA ---
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [visibility, setVisibility] = useState("private");
  const [questionBankId, setQuestionBankId] = useState(null);
  const [showExcelImporter, setShowExcelImporter] = useState(false);

  // --- 2. STATE FOR DRAFT QUESTIONS ---
  const [questions, setQuestions] = useState([
    {
      question_text: "",
      explanation: "",
      topic: "",
      chapter: "",
      options: [
        { option_text: "", is_correct: false },
        { option_text: "", is_correct: false }
      ]
    }
  ]);

  // --- 3. UI STATE FOR MODALS/PANELS ---
  const [showQBSelector, setShowQBSelector] = useState(false);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // --- 4. MANUAL DRAFT MANIPULATION ---

  // Add a new blank question card
  const addBlankQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        question_text: "",
        explanation: "",
        topic: "",
        chapter: "",
        options: [
          { option_text: "", is_correct: false },
          { option_text: "", is_correct: false }
        ]
      }
    ]);
  };

  // Delete a question card
  const deleteQuestion = (qIndex) => {
    setQuestions((prev) => {
      const updated = prev.filter((_, idx) => idx !== qIndex);
      // If no questions left have a source_question_id, release the lock on the question bank
      const hasImported = updated.some(q => q.source_question_id);
      if (!hasImported) {
        setQuestionBankId(null);
      }
      return updated;
    });

    setErrors((prev) => {
      const next = {};
      Object.keys(prev).forEach((key) => {
        const match = key.match(/^q_(\d+)_(.+)$/);
        if (match) {
          const idx = parseInt(match[1], 10);
          const suffix = match[2];
          if (idx === qIndex) {
            // Delete errors for this deleted question card
            return;
          } else if (idx > qIndex) {
            // Shift index down by 1 since questions shifted
            next[`q_${idx - 1}_${suffix}`] = prev[key];
          } else {
            // Keep unchanged
            next[key] = prev[key];
          }
        } else {
          // Keep other errors like title, questions, but clear submit
          if (key !== "submit") {
            next[key] = prev[key];
          }
        }
      });
      return next;
    });
  };

  // Update question text, explanation, metadata, etc.
  const handleQuestionFieldChange = (qIndex, field, value) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[qIndex] = { ...updated[qIndex], [field]: value };
      return updated;
    });
    setErrors((prev) => {
      const next = { ...prev };
      delete next[`q_${qIndex}_text`];
      delete next.submit;
      return next;
    });
  };

  // Add a blank option to a specific question
  const addOptionToQuestion = (qIndex) => {
    setQuestions((prev) =>
      prev.map((q, idx) =>
        idx === qIndex
          ? {
            ...q,
            options: [...q.options, { option_text: "", is_correct: false }]
          }
          : q
      )
    );
    setErrors((prev) => {
      const next = { ...prev };
      delete next[`q_${qIndex}_options`];
      delete next.submit;
      return next;
    });
  };

  // Delete an option from a specific question
  const deleteOptionFromQuestion = (qIndex, optIndex) => {
    setQuestions((prev) =>
      prev.map((q, idx) =>
        idx === qIndex
          ? {
            ...q,
            options: q.options.filter((_, oIdx) => oIdx !== optIndex)
          }
          : q
      )
    );
    setErrors((prev) => {
      const next = { ...prev };
      delete next[`q_${qIndex}_options`];
      delete next.submit;
      return next;
    });
  };

  // Update option text or toggle correct status
  const handleOptionChange = (qIndex, optIndex, field, value) => {
    setQuestions((prev) =>
      prev.map((q, idx) =>
        idx === qIndex
          ? {
            ...q,
            options: q.options.map((opt, oIdx) =>
              oIdx === optIndex ? { ...opt, [field]: value } : opt
            )
          }
          : q
      )
    );
    setErrors((prev) => {
      const next = { ...prev };
      delete next[`q_${qIndex}_options`];
      delete next.submit;
      return next;
    });
  };

  // --- 5. QUESTION BANK IMPORT CALLBACK ---
  const handleQBQuestionsImported = (importedQs, selectedBankId) => {
    // Save source question bank mapping
    setQuestionBankId(selectedBankId);

    // Format imported questions to match the draft structure
    const formattedQs = importedQs.map((q) => ({
      question_text: q.question_text,
      explanation: q.explanation || "",
      topic: q.topic || "",
      chapter: q.chapter || "",
      source_question_id: q.question_id, // Save parent question reference
      options: q.answer_options.map((opt) => ({
        option_text: opt.option_text,
        is_correct: opt.is_correct
      }))
    }));

    // Append to existing draft list
    setQuestions((prev) => [...prev, ...formattedQs]);
    setShowQBSelector(false); // Hide the QB selector panel
  };

  const handleResetQuestionBank = () => {
    setQuestions((prev) => prev.filter((q) => !q.source_question_id));
    setQuestionBankId(null);
  };

  const handleExcelQuestionsImported = (importedQs) => {
    const formattedQs = importedQs.map((q) => ({
      question_text: q.question_text,
      explanation: q.explanation || "",
      topic: q.topic || "",
      chapter: q.chapter || "",
      options: q.options.map((opt) => ({
        option_text: opt.option_text,
        is_correct: opt.is_correct
      }))
    }));

    setQuestions((prev) => [...prev, ...formattedQs]);
    setShowExcelImporter(false);
  };
  // --- 6. SAVE STUDY SET TO DATABASE ---
  const handleSave = async (e) => {
    e.preventDefault();
    setErrors({});

    const newErrors = {};

    // A. Validate basic details
    if (!title.trim()) {
      newErrors.title = "Study set title is required.";
    }
    if (questions.length === 0) {
      newErrors.questions = "A study set must contain at least one question.";
    }

    // B. Validate draft questions
    questions.forEach((q, idx) => {
      if (!q.question_text.trim()) {
        newErrors[`q_${idx}_text`] = "Question prompt cannot be empty.";
      }
      if (q.options.length < 2) {
        newErrors[`q_${idx}_options`] = "Question must have at least 2 options.";
      } else {
        const hasEmptyOpt = q.options.some((opt) => !opt.option_text.trim());
        if (hasEmptyOpt) {
          newErrors[`q_${idx}_options`] = "All options must be filled out.";
        } else {
          const hasCorrect = q.options.some((opt) => opt.is_correct);
          if (!hasCorrect) {
            newErrors[`q_${idx}_options`] = "At least one correct option must be selected.";
          }
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // C. Send POST request
    setSaving(true);
    try {
      await axiosClient.post("/api/study-sets", {
        title,
        description,
        subject: subject || null,
        topic: topic || null,
        visibility,
        questionBankId,
        questions
      });
      // Redirect to the teacher list view on success
      router.push("/teacher/study-sets");
    } catch (err) {
      console.error("Failed to create study set:", err);
      setErrors({
        submit: err.response?.data?.error || "Failed to create study set. Please try again."
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">

        {/* Page Header */}
        <div className="flex items-center gap-3">
          <Button onClick={() => router.back()} variant="ghost" size="icon" type="button">
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Create Study Set</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Add metadata and write questions manually or import them from your Question Banks.
            </p>
          </div>
        </div>

        {errors.submit && (
          <div className="bg-rose-50 text-rose-800 p-4 rounded-xl border border-rose-100 text-sm font-semibold">
            {errors.submit}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Section 1: Study Set Metadata Details */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-foreground border-b border-border pb-2">Study Set Details</h2>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-semibold text-foreground">Title <span className="text-rose-500"> *</span></label>
                <Input
                  placeholder="e.g. Midterm Physics Review"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setErrors((prev) => ({ ...prev, title: null }));
                  }}
                />
                {errors.title && (
                  <p className="text-xs font-semibold text-rose-500 mt-1">{errors.title}</p>
                )}
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-semibold text-foreground">Description</label>
                <textarea
                  className="min-h-[80px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Provide details about the topics covered in this study set."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">Subject</label>
                <Input
                  placeholder="e.g. Physics, History"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">General Topic</label>
                <Input
                  placeholder="e.g. Thermodynamics, WW2"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">Visibility</label>
                <select
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-ring"
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                >
                  <option value="private">Private</option>
                  <option value="public">Public</option>
                  <option value="class_only">Class Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Questions Editor */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Questions ({questions.length})</h2>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowExcelImporter(true)}
                  type="button"
                  variant="outline"
                  className="gap-2"
                >
                  <FileSpreadsheet size={16} />
                  Import from Excel
                </Button>
                <Button
                  onClick={() => setShowQBSelector(true)}
                  type="button"
                  variant="outline"
                  className="gap-2"
                >
                  <Database size={16} />
                  Import from Question Bank
                </Button>
              </div>
            </div>

            {errors.questions && (
              <div className="bg-rose-50/50 text-rose-600 border border-rose-100 px-4 py-3 rounded-xl text-sm font-semibold">
                {errors.questions}
              </div>
            )}

            {/* Questions drafting list */}
            <div className="space-y-6">
              {questions.map((q, qIndex) => (
                <div key={qIndex} className="relative rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">

                  {/* Header bar of question card */}
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <span className="text-sm font-bold text-muted-foreground">
                      Question #{qIndex + 1}
                    </span>
                    <Button
                      onClick={() => deleteQuestion(qIndex)}
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>

                  {/* Question text */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-foreground">Question
                      <span className="text-rose-500"> *</span></label>
                    <textarea
                      className="min-h-[60px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      placeholder="Enter the question text"
                      value={q.question_text}
                      onChange={(e) => handleQuestionFieldChange(qIndex, "question_text", e.target.value)}
                    />
                    {errors[`q_${qIndex}_text`] && (
                      <p className="text-xs font-semibold text-rose-500 mt-0.5">{errors[`q_${qIndex}_text`]}</p>
                    )}
                  </div>

                  {/* Question metadata */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Topic</label>
                      <Input
                        placeholder="e.g. Gravity"
                        value={q.topic}
                        className="h-9 text-xs"
                        onChange={(e) => handleQuestionFieldChange(qIndex, "topic", e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Chapter</label>
                      <Input
                        placeholder="e.g. Chapter 2"
                        value={q.chapter}
                        className="h-9 text-xs"
                        onChange={(e) => handleQuestionFieldChange(qIndex, "chapter", e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Options Editor */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-foreground">Answer Options *</label>
                      <Button
                        onClick={() => addOptionToQuestion(qIndex)}
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1.5 text-xs text-primary"
                      >
                        <Plus size={14} />
                        Add Option
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {q.options.map((opt, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            className="rounded border-input text-primary focus:ring-primary size-4 cursor-pointer"
                            checked={opt.is_correct}
                            onChange={(e) => handleOptionChange(qIndex, optIndex, "is_correct", e.target.checked)}
                            title="Mark as correct answer"
                          />

                          <Input
                            placeholder={`Option ${optIndex + 1}`}
                            value={opt.option_text}
                            onChange={(e) => handleOptionChange(qIndex, optIndex, "option_text", e.target.value)}
                          />

                          {q.options.length > 2 && (
                            <Button
                              onClick={() => deleteOptionFromQuestion(qIndex, optIndex)}
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-muted-foreground hover:text-rose-600"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    {errors[`q_${qIndex}_options`] && (
                      <p className="text-xs font-semibold text-rose-500 mt-1">{errors[`q_${qIndex}_options`]}</p>
                    )}
                  </div>

                  {/* Explanation */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-foreground">Answer Explanation</label>
                    <textarea
                      className="min-h-[40px] w-full rounded-xl border border-input bg-background px-3 py-1.5 text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      placeholder="Explain why the correct answers are right (optional)"
                      value={q.explanation}
                      onChange={(e) => handleQuestionFieldChange(qIndex, "explanation", e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Add blank question button */}
            <Button
              onClick={addBlankQuestion}
              type="button"
              variant="outline"
              className="w-full h-12 border-dashed gap-2 rounded-2xl"
            >
              <Plus size={16} />
              Add Question Card
            </Button>
          </div>

          {/* Action Save/Cancel Footer */}
          <div className="flex justify-end gap-3 border-t border-border pt-6">
            <Button
              onClick={() => router.back()}
              type="button"
              variant="outline"
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="gap-2">
              <Save size={16} />
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </div>

      {/* Question Bank Selector Popup */}
      {showQBSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-card rounded-2xl shadow-2xl border border-border">
            <QuestionBankSelector
              onQuestionsSelected={handleQBQuestionsImported}
              onCancel={() => setShowQBSelector(false)}
              lockedBankId={questionBankId}
              onResetBank={handleResetQuestionBank}
              alreadyImportedIds={questions.map((q) => q.source_question_id).filter(Boolean)}
            />
          </div>
        </div>
      )}

      {/* Excel Importer Popup */}
      {showExcelImporter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-card rounded-2xl shadow-2xl border border-border">
            <ExcelImporter
              onQuestionsImported={handleExcelQuestionsImported}
              onCancel={() => setShowExcelImporter(false)}
            />
          </div>
        </div>
      )}
    </main>
  );
}
