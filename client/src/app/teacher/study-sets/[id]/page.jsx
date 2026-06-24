"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit3, Trash2, Calendar, BookOpen, Layers, Eye, EyeOff, Check, AlertCircle, UserPlus } from "lucide-react";
import axiosClient from "@/services/axiosClient";
import { Button } from "@/components/ui/button";
import ToastNotification from "../ToastNotification";
import ClassSelectorModal from "../create/ClassSelectorModal";
import ConfirmModal from "@/components/common/ConfirmModal";

export default function TeacherStudySetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const [studySet, setStudySet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [showClassSelector, setShowClassSelector] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmData, setConfirmData] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    onCancel: null,
  });

  useEffect(() => {
    const savedToast = localStorage.getItem("study_set_toast");
    if (savedToast) {
      try {
        const parsed = JSON.parse(savedToast);
        setTimeout(() => setToast(parsed), 0);
      } catch (e) {
        console.error(e);
      }
      localStorage.removeItem("study_set_toast");
    }
  }, []);

  // Quản lý hiển thị đáp án
  const [revealedQuestions, setRevealedQuestions] = useState(new Set());
  const isAllRevealed = studySet?.questions?.length > 0 && revealedQuestions.size === studySet.questions.length;

  useEffect(() => {
    if (!id) return;

    async function fetchDetails() {
      setLoading(true);
      try {
        const res = await axiosClient.get(`/api/study-sets/${id}`);
        setStudySet(res.data?.data || null);
      } catch (err) {
        console.error("Failed to load study set:", err);
        setError("Failed to load study set details. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchDetails();
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await axiosClient.delete(`/api/study-sets/${id}`);
      localStorage.setItem(
        "study_set_toast",
        JSON.stringify({ message: `Deleted study set "${studySet.title}" successfully.`, type: "success" })
      );
      router.push("/teacher/study-sets");
    } catch (err) {
      console.error("Failed to delete study set:", err);
      setToast({
        message: err.response?.data?.error || "Failed to delete study set. Please try again.",
        type: "error"
      });
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  // Toggle xem đáp án của từng câu riêng lẻ
  const toggleRevealQuestion = (qId) => {
    setRevealedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) {
        next.delete(qId);
      } else {
        next.add(qId);
      }
      return next;
    });
  };

  const handleAssignConfirm = async (ids) => {
    setSaving(true);
    const isClearingClassOnly = studySet.visibility === "class_only" && ids.length === 0;

    try {
      const payload = { classId: ids };
      if (studySet.visibility === "private" && ids.length > 0) {
        payload.visibility = "class_only";
      } else if (isClearingClassOnly) {
        payload.visibility = "private";
      }

      await axiosClient.patch(`/api/study-sets/${id}`, payload);
      setToast({
        message: isClearingClassOnly
          ? `Visibility of study set "${studySet.title}" reverted to Private because no classes were selected.`
          : `Assigned study set "${studySet.title}" successfully.`,
        type: isClearingClassOnly ? "warning" : "success",
      });
      setShowClassSelector(false);

      // Re-fetch details to update UI immediately
      const res = await axiosClient.get(`/api/study-sets/${id}`);
      setStudySet(res.data?.data || null);
    } catch (err) {
      console.error("Failed to update assignments:", err);
      setToast({
        message: err.response?.data?.error || "Failed to update assignments. Please try again.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const assignedClassIds = (studySet?.study_set_assignments || []).map((a) => a.class_id);
  const assignedClassNames = (studySet?.study_set_assignments || [])
    .map((a) => a.classes?.class_name)
    .filter(Boolean);

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-muted-foreground font-semibold">Loading study set...</p>
        </div>
      </main>
    );
  }

  if (error || !studySet) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4 rounded-2xl border border-border bg-card p-6 shadow-lg">
          <AlertCircle className="size-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-foreground">Error Occurred</h2>
          <p className="text-sm text-muted-foreground">{error || "Study set not found."}</p>
          <Button onClick={() => router.push("/teacher/study-sets")} className="w-full">
            Go Back
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">

        {/* Navigation & Header Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button onClick={() => router.push("/teacher/study-sets")} variant="ghost" size="icon" type="button">
              <ArrowLeft className="size-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">{studySet.title}</h1>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                <Calendar size={12} />
                Created on {new Date(studySet.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            <Button
              onClick={() => {
                if (studySet.visibility === "private") {
                  setConfirmData({
                    isOpen: true,
                    title: "Change Visibility to Class Only",
                    message: "Assigning this study set to a class will change its visibility to 'Class Only'. Do you want to proceed?",
                    onConfirm: () => {
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
              }}
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={saving}
            >
              <UserPlus size={14} />
              {saving ? "Saving..." : "Assign to Class"}
            </Button>
            <Button
              onClick={() => router.push(`/teacher/study-sets/${id}/edit`)}
              variant="outline"
              size="sm"
              className="gap-1.5"
            >
              <Edit3 size={14} />
              Edit Set
            </Button>
            <Button
              onClick={() => setShowDeleteModal(true)}
              variant="outline"
              disabled={deleting}
              size="sm"
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 gap-1.5"
            >
              <Trash2 size={14} />
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>

        {/* Study Set Metadata Card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap gap-4 items-center justify-between border-b border-border pb-4">
            <div className="flex flex-wrap gap-2">
              <span className="text-xs font-semibold bg-primary/10 text-primary px-2.5 py-1 rounded-full capitalize">
                {studySet.visibility?.replace("_", " ")}
              </span>
              {studySet.topic && (
                <span className="text-xs font-semibold bg-muted text-muted-foreground px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Layers size={12} />
                  {studySet.topic}
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              Total Questions: <strong className="text-foreground">{studySet.questions?.length || 0}</strong>
            </span>
          </div>

          {studySet.description && (
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-foreground">Description</h3>
              <p className="text-sm text-foreground leading-relaxed">{studySet.description}</p>
            </div>
          )}

          {/* Assigned Classes */}
          <div className="space-y-1.5 pt-3 border-t border-border/60">
            <h3 className="text-sm font-bold text-foreground">Assigned Classes</h3>
            {assignedClassNames.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Not assigned to any classes.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {assignedClassNames.map((name, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary shadow-sm"
                  >
                    {name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Questions Section Header */}
        <div className="flex items-center justify-between pt-4">
          <h2 className="text-xl font-bold text-foreground">
            Questions ({studySet.questions?.length || 0})
          </h2>
          <Button
            onClick={() => {
              if (isAllRevealed) {
                setRevealedQuestions(new Set());
              } else {
                const allIds = (studySet?.questions || []).map((q) => q.question_id);
                setRevealedQuestions(new Set(allIds));
              }
            }}
            variant="ghost"
            size="sm"
            className="gap-2 text-xs text-primary"
          >
            {isAllRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
            {isAllRevealed ? "Hide All Answers" : "Show All Answers"}
          </Button>
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          {studySet.questions?.length === 0 ? (
            <div className="text-center py-12 rounded-2xl border border-dashed border-border bg-card">
              <p className="text-sm text-muted-foreground">This study set contains no questions.</p>
            </div>
          ) : (
            studySet.questions?.map((q, index) => {
              const isRevealed = revealedQuestions.has(q.question_id);

              return (
                <div
                  key={q.question_id}
                  className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4 hover:shadow-md transition duration-200"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <span className="text-sm font-bold text-muted-foreground">
                      Question #{index + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => toggleRevealQuestion(q.question_id)}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        title={isRevealed ? "Hide Answer" : "Show Answer"}
                      >
                        {isRevealed ? <EyeOff size={16} /> : <Eye size={16} />}
                      </Button>
                    </div>
                  </div>

                  {/* Question Text */}
                  <p className="text-base text-foreground font-medium leading-relaxed">
                    {q.question_text}
                  </p>

                  {/* Options List */}
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {q.answer_options?.map((opt) => {
                      const showSuccessBg = isRevealed && opt.is_correct;

                      return (
                        <div
                          key={opt.answer_option_id}
                          className={`flex items-center gap-3 p-3 rounded-xl border text-sm transition duration-150 ${showSuccessBg
                              ? "border-emerald-500 bg-emerald-50/50 text-emerald-900 font-semibold"
                              : "border-border bg-muted/10 text-foreground"
                            }`}
                        >
                          <div
                            className={`size-5 rounded-full border flex items-center justify-center shrink-0 text-xs ${showSuccessBg
                                ? "border-emerald-500 bg-emerald-500 text-white"
                                : "border-border text-muted-foreground bg-muted/40"
                              }`}
                          >
                            {showSuccessBg ? <Check size={12} /> : null}
                          </div>
                          <span className="break-words w-full">{opt.option_text}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation (Shown only when revealed and exists) */}
                  {isRevealed && q.explanation && (
                    <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 text-xs space-y-1">
                      <h4 className="font-bold text-primary">Explanation</h4>
                      <p className="text-muted-foreground leading-relaxed">{q.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
      <ToastNotification
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "success" })}
      />

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Study Set"
        message={`Are you sure you want to delete "${studySet?.title}"? This action is permanent and cannot be undone.`}
        confirmLabel={deleting ? "Deleting..." : "Delete"}
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
        variant="danger"
      />

      {showClassSelector && (
        <ClassSelectorModal
          initialSelectedIds={assignedClassIds}
          onConfirm={handleAssignConfirm}
          onCancel={() => setShowClassSelector(false)}
        />
      )}
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
