"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, Save, ArrowLeft, Database, FileSpreadsheet } from "lucide-react";
import axiosClient from "@/services/axiosClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import QuestionCardEditor from "@/components/question-creator/QuestionCardEditor";
import ExcelImporter from "@/components/question-creator/ExcelImporter";
import QuestionBankSelector from "../../create/QuestionBankSelector";
import ClassSelectorModal from "../../create/ClassSelectorModal";
import ToastNotification from "../../ToastNotification";
import ConfirmModal from "@/components/common/ConfirmModal";

export default function EditStudySetPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  // --- 1. STATE FOR STUDY SET METADATA ---
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [topic, setTopic] = useState("");
  const [visibility, setVisibility] = useState("private");
  const [questionBankId, setQuestionBankId] = useState(null);

  // --- 1.1 CLASSES SELECTION STATE ---
  const [selectedClassIds, setSelectedClassIds] = useState([]);
  const [selectedClassNames, setSelectedClassNames] = useState([]);
  const [showClassSelector, setShowClassSelector] = useState(false);

  // --- 2. STATE FOR DRAFT QUESTIONS ---
  const [questions, setQuestions] = useState([]);

  // --- 3. UI STATE ---
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [showQBSelector, setShowQBSelector] = useState(false);
  const [showExcelImporter, setShowExcelImporter] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [confirmData, setConfirmData] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    onCancel: null,
  });

  // --- 4. FETCH DATA ON MOUNT ---
  useEffect(() => {
    if (!id) return;

    async function loadStudySet() {
      setLoading(true);
      try {
        const res = await axiosClient.get(`/api/study-sets/${id}`);
        const data = res.data?.data;
        if (data) {
          setTitle(data.title || "");
          setDescription(data.description || "");
          setTopic(data.topic || "");
          setVisibility(data.visibility || "private");
          setQuestionBankId(data.source_question_bank_id || null);

          // Map questions & answers options
          const formattedQuestions = (data.questions || []).map((q) => ({
            question_id: q.question_id,
            question_text: q.question_text || "",
            explanation: q.explanation || "",
            chapter: q.chapter || "",
            source_question_id: q.source_question_id || null,
            options: (q.answer_options || []).map((opt) => ({
              answer_option_id: opt.answer_option_id,
              option_text: opt.option_text || "",
              is_correct: !!opt.is_correct,
            })),
          }));
          setQuestions(formattedQuestions);

          // Populate class assignments if study_set_assignments exists
          if (data.study_set_assignments && data.study_set_assignments.length > 0) {
            const classIds = data.study_set_assignments.map((a) => a.class_id);
            const classNames = data.study_set_assignments.map((a) => a.classes?.class_name || "Lớp học");
            setSelectedClassIds(classIds);
            setSelectedClassNames(classNames);
          }
        }
      } catch (err) {
        console.error("Failed to load study set details:", err);
        setErrors({ submit: "Failed to load study set details. Please try again." });
      } finally {
        setLoading(false);
      }
    }

    loadStudySet();
  }, [id]);

  // --- 5. MANUAL DRAFT MANIPULATION ---

  // Add a new blank question card
  const addBlankQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        question_text: "",
        explanation: "",
        chapter: "",
        options: [
          { option_text: "", is_correct: false },
          { option_text: "", is_correct: false }
        ]
      }
    ]);

    // Clear question list validation error and toast
    setErrors((prev) => {
      const next = { ...prev };
      delete next.questions;
      delete next.submit;
      return next;
    });
    setToast({ message: "", type: "success" });
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
            return;
          } else if (idx > qIndex) {
            next[`q_${idx - 1}_${suffix}`] = prev[key];
          } else {
            next[key] = prev[key];
          }
        } else {
          if (key !== "submit") {
            next[key] = prev[key];
          }
        }
      });
      return next;
    });
  };

  // Update question fields
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
    setToast({ message: "", type: "success" });
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
    setToast({ message: "", type: "success" });
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
    setToast({ message: "", type: "success" });
  };

  // --- 6. QUESTION BANK IMPORT CALLBACKS ---
  const handleQBQuestionsImported = (importedQs, selectedBankId) => {
    setQuestionBankId(selectedBankId);

    const formattedQs = importedQs.map((q) => ({
      question_text: q.question_text,
      explanation: q.explanation || "",
      chapter: q.chapter || "",
      source_question_id: q.question_id,
      options: q.answer_options.map((opt) => ({
        option_text: opt.option_text,
        is_correct: opt.is_correct
      }))
    }));

    setQuestions((prev) => [...prev, ...formattedQs]);
    setShowQBSelector(false);

    setErrors((prev) => {
      const next = { ...prev };
      delete next.questions;
      delete next.submit;
      return next;
    });
    setToast({ message: "", type: "success" });
  };

  const handleResetQuestionBank = () => {
    setQuestions((prev) => prev.filter((q) => !q.source_question_id));
    setQuestionBankId(null);
  };

  const handleExcelQuestionsImported = (importedQs) => {
    const formattedQs = importedQs.map((q) => ({
      question_text: q.question_text,
      explanation: q.explanation || "",
      chapter: q.chapter || "",
      options: q.options.map((opt) => ({
        option_text: opt.option_text,
        is_correct: opt.is_correct
      }))
    }));

    setQuestions((prev) => [...prev, ...formattedQs]);
    setShowExcelImporter(false);

    setErrors((prev) => {
      const next = { ...prev };
      delete next.questions;
      delete next.submit;
      return next;
    });
    setToast({ message: "", type: "success" });
  };

  // --- 7. CLASS SELECTION CALLBACKS ---
  const handleClassesConfirmed = (ids, names) => {
    setSelectedClassIds(ids);
    setSelectedClassNames(names);
    setShowClassSelector(false);

    if (visibility === "class_only" && ids.length === 0) {
      setVisibility("private");
      setToast({
        message: "Visibility changed to Private because no classes were selected.",
        type: "warning",
      });
    }

    setErrors((prev) => {
      const next = { ...prev };
      delete next.classIds;
      delete next.submit;
      return next;
    });
  };

  const handleClassSelectionCancelled = () => {
    setShowClassSelector(false);
  };

  const handleClassSelectorClick = () => {
    if (visibility === "private") {
      setConfirmData({
        isOpen: true,
        title: "Change Visibility to Class Only",
        message: "Assigning this study set to a class will change its visibility to 'Class Only'. Do you want to proceed?",
        onConfirm: () => {
          setVisibility("class_only");
          setConfirmData((prev) => ({ ...prev, isOpen: false }));
          setShowClassSelector(true);
        },
        onCancel: () => {
          setConfirmData((prev) => ({ ...prev, isOpen: false }));
        },
      });
    } else {
      setShowClassSelector(true);
    }
  };

  // --- 8. SAVE CHANGES ---
  const handleSave = async (e) => {
    e.preventDefault();
    setErrors({});

    const newErrors = {};

    // Validate details
    if (!title.trim()) {
      newErrors.title = "Study set title is required.";
    }
    if (questions.length === 0) {
      newErrors.questions = "A study set must contain at least one question.";
    }
    if (visibility === "class_only" && selectedClassIds.length === 0) {
      newErrors.classIds = "Please select at least one class.";
    }

    // Validate questions
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
      setToast({
        message: "Please fill out all required fields and correct the errors.",
        type: "error"
      });
      return;
    }

    setSaving(true);
    try {
      await axiosClient.patch(`/api/study-sets/${id}`, {
        title,
        description,
        subject: null,
        topic: topic || null,
        visibility,
        classId: selectedClassIds,
        questionBankId,
        questions
      });

      // Save success toast to localStorage to persist across navigation
      localStorage.setItem(
        "study_set_toast",
        JSON.stringify({ message: `Updated study set "${title}" successfully.`, type: "success" })
      );

      router.push(`/teacher/study-sets/${id}`);
    } catch (err) {
      console.error("Failed to update study set:", err);
      const errMsg = err.response?.data?.error || "Failed to update study set. Please try again.";
      setErrors({
        submit: errMsg
      });
      setToast({
        message: errMsg,
        type: "error"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-muted-foreground font-semibold">Loading study set details...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">

        {/* Page Header */}
        <div className="flex items-center gap-3">
          <Button onClick={() => router.back()} variant="ghost" size="icon" type="button">
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Edit Study Set</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Modify details, edit draft questions, or manage imported items.
            </p>
          </div>
        </div>

        {errors.submit && (
          <div className="bg-rose-50 text-rose-800 p-4 rounded-xl border border-rose-100 text-sm font-semibold">
            {errors.submit}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Study Set Metadata */}
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
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.title;
                      delete next.submit;
                      return next;
                    });
                    setToast({ message: "", type: "success" });
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
                  onChange={(e) => {
                    const val = e.target.value;
                    if (visibility === "class_only" && val !== "class_only" && selectedClassIds.length > 0) {
                      setConfirmData({
                        isOpen: true,
                        title: "Clear Assigned Classes?",
                        message: "Changing visibility from 'Class Only' to 'Public' or 'Private' will clear all assigned classes. Do you want to proceed?",
                        onConfirm: () => {
                          setSelectedClassIds([]);
                          setSelectedClassNames([]);
                          setVisibility(val);
                          setConfirmData((prev) => ({ ...prev, isOpen: false }));
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next.classIds;
                            delete next.submit;
                            return next;
                          });
                        },
                        onCancel: () => {
                          setConfirmData((prev) => ({ ...prev, isOpen: false }));
                        },
                      });
                      return;
                    }

                    setVisibility(val);
                    if (val === "class_only") {
                      if (selectedClassIds.length === 0) {
                        setShowClassSelector(true);
                        setErrors((prev) => ({
                          ...prev,
                          classIds: "Please select at least one class."
                        }));
                      }
                    } else {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.classIds;
                        delete next.submit;
                        return next;
                      });
                      setToast({ message: "", type: "success" });
                    }
                  }}
                >
                  <option value="private">Private</option>
                  <option value="public">Public</option>
                  <option value="class_only">Class Only</option>
                </select>
              </div>

              {/* Class Selection */}
              <div className="space-y-1.5 md:col-span-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="text-sm font-semibold text-foreground flex items-center gap-1">
                  Assigned Classes {visibility === "class_only" && <span className="text-rose-500"> *</span>}
                </label>
                <div
                  onClick={handleClassSelectorClick}
                  className="cursor-pointer transition duration-150"
                  title="Click to edit class assignments"
                >
                  {selectedClassIds.length === 0 ? (
                    visibility === "class_only" ? (
                      <p className="text-xs text-rose-600 font-semibold bg-rose-50 p-3 rounded-xl border border-rose-200 hover:bg-rose-100/70 hover:border-rose-300">
                        No classes selected. Click here to select at least one class.
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground bg-muted/40 p-3 rounded-xl border border-border hover:bg-muted/60">
                        No classes selected. Click here to select classes to assign (optional).
                      </p>
                    )
                  ) : (
                    <div className="flex flex-wrap gap-1.5 bg-primary/5 p-3 rounded-xl border border-primary/20 hover:bg-primary/10 hover:border-primary/30">
                      <span className="text-xs font-semibold text-primary/80 self-center mr-1">Assigned to:</span>
                      {selectedClassNames.map((name, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center rounded-lg bg-primary px-2.5 py-1 text-xs font-bold text-white shadow-sm"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {errors.classIds && (
                  <p className="text-xs font-semibold text-rose-500 mt-1">{errors.classIds}</p>
                )}
              </div>
            </div>
          </div>

          {/* Questions List */}
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

            <div className="space-y-6">
              {questions.map((q, qIndex) => (
                <QuestionCardEditor
                  key={qIndex}
                  question={q}
                  qIndex={qIndex}
                  errors={errors}
                  onFieldChange={(field, value) => handleQuestionFieldChange(qIndex, field, value)}
                  onDelete={() => deleteQuestion(qIndex)}
                  onAddOption={() => addOptionToQuestion(qIndex)}
                  onDeleteOption={(optIndex) => deleteOptionFromQuestion(qIndex, optIndex)}
                  onOptionChange={(optIndex, field, value) => handleOptionChange(qIndex, optIndex, field, value)}
                />
              ))}
            </div>

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

          {/* Action Footer */}
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

      {/* Class Selector Modal Popup */}
      {showClassSelector && (
        <ClassSelectorModal
          initialSelectedIds={selectedClassIds}
          onConfirm={handleClassesConfirmed}
          onCancel={handleClassSelectionCancelled}
        />
      )}

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

      {/* Toast Notification */}
      <ToastNotification
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "success" })}
      />
      <ConfirmModal
        isOpen={confirmData.isOpen}
        title={confirmData.title}
        message={confirmData.message}
        onConfirm={confirmData.onConfirm}
        onCancel={confirmData.onCancel}
      />
    </main>
  );
}
