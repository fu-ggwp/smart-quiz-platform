"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit3, Calendar, BookOpen, Layers, Eye, EyeOff, Check, AlertCircle } from "lucide-react";
import api from "@/services/api";
import { Button } from "@/components/ui/button";

export default function TeacherStudySetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const [studySet, setStudySet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Quản lý hiển thị đáp án
  const [showAllAnswers, setShowAllAnswers] = useState(false);
  const [revealedQuestions, setRevealedQuestions] = useState(new Set());

  useEffect(() => {
    if (!id) return;

    async function fetchDetails() {
      setLoading(true);
      try {
        const res = await api.get(`/api/study-sets/${id}`);
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
          <Button onClick={() => router.back()} className="w-full">
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
            <Button onClick={() => router.back()} variant="ghost" size="icon" type="button">
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
              onClick={() => router.push(`/teacher/study-sets/${id}/assign`)}
              variant="outline"
              size="sm"
            >
              Assign to Class
            </Button>
            <Button
              onClick={() => router.push(`/teacher/study-sets/${id}/edit`)} // Đường dẫn sửa bộ học liệu (hiện tại sẽ báo 404 do chưa xây dựng)
              size="sm"
              className="gap-2"
            >
              <Edit3 size={16} />
              Edit Set
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
              {studySet.subject && (
                <span className="text-xs font-semibold bg-muted text-muted-foreground px-2.5 py-1 rounded-full flex items-center gap-1">
                  <BookOpen size={12} />
                  {studySet.subject}
                </span>
              )}
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
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Description</h3>
              <p className="text-sm text-foreground leading-relaxed">{studySet.description}</p>
            </div>
          )}
        </div>

        {/* Questions Section Header */}
        <div className="flex items-center justify-between pt-4">
          <h2 className="text-xl font-bold text-foreground">
            Questions ({studySet.questions?.length || 0})
          </h2>
          <Button
            onClick={() => {
              setShowAllAnswers(!showAllAnswers);
              setRevealedQuestions(new Set()); // Reset các câu hỏi lẻ
            }}
            variant="ghost"
            size="sm"
            className="gap-2 text-xs text-primary"
          >
            {showAllAnswers ? <EyeOff size={14} /> : <Eye size={14} />}
            {showAllAnswers ? "Hide All Answers" : "Show All Answers"}
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
              const isRevealed = showAllAnswers || revealedQuestions.has(q.question_id);

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
                      <span className="text-xs capitalize font-semibold px-2 py-0.5 bg-muted text-muted-foreground rounded-md">
                        {q.difficulty || "medium"}
                      </span>
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
                          className={`flex items-center gap-3 p-3 rounded-xl border text-sm transition duration-150 ${
                            showSuccessBg
                              ? "border-emerald-500 bg-emerald-50/50 text-emerald-900 font-semibold"
                              : "border-border bg-muted/10 text-foreground"
                          }`}
                        >
                          <div
                            className={`size-5 rounded-full border flex items-center justify-center shrink-0 text-xs ${
                              showSuccessBg
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
    </main>
  );
}