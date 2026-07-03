"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, BookOpen, ChevronDown, ChevronRight, Edit3, Eye, EyeOff } from "lucide-react";

import { QuestionPreviewCard } from "@/components/questions/question-preview-card";
import { Button } from "@/components/ui/button";
import { questionBanksService } from "@/services/question-banks.service";

import { formatBankStatus, formatDate, getStatusTone, QuestionBanksBadge } from "../_components/question-banks-badge";
import { QuestionBanksStatePanel } from "../_components/question-banks-state-panel";
import { groupQuestionsByChapter } from "../_lib/question-bank-editor";

function normalizeParamId(value) {
  return Array.isArray(value) ? value[0] : value;
}

export default function QuestionBankDetailPage() {
  const params = useParams();
  const router = useRouter();
  const questionBankId = useMemo(() => normalizeParamId(params?.id), [params]);

  const [questionBank, setQuestionBank] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAllAnswers, setShowAllAnswers] = useState(false);
  const [revealedQuestions, setRevealedQuestions] = useState(new Set());
  const [collapsedChapters, setCollapsedChapters] = useState({});

  const questionGroups = useMemo(() => groupQuestionsByChapter(questions), [questions]);

  useEffect(() => {
    if (!questionBankId) return;

    let ignore = false;

    async function loadQuestionBankDetail() {
      setLoading(true);
      setError("");

      try {
        const [bankResponse, questionRows] = await Promise.all([
          questionBanksService.getOne(questionBankId),
          questionBanksService.listQuestions(questionBankId),
        ]);

        if (ignore) return;

        setQuestionBank(bankResponse || null);
        setQuestions(questionRows || []);
        setShowAllAnswers(false);
        setRevealedQuestions(new Set());
        setCollapsedChapters({});
      } catch (err) {
        if (ignore) return;

        setQuestionBank(null);
        setQuestions([]);
        setError(err.response?.data?.error || err.message || "Failed to load question bank details.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadQuestionBankDetail();

    return () => {
      ignore = true;
    };
  }, [questionBankId]);

  function toggleRevealQuestion(questionId) {
    setRevealedQuestions((current) => {
      const next = new Set(current);

      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }

      return next;
    });
  }

  function toggleAllAnswers() {
    setShowAllAnswers((current) => !current);
    setRevealedQuestions(new Set());
  }

  function toggleChapter(chapter) {
    setCollapsedChapters((current) => ({
      ...current,
      [chapter]: !current[chapter],
    }));
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-5xl">
          <QuestionBanksStatePanel title="Loading question bank" description="Fetching metadata and questions." />
        </section>
      </main>
    );
  }

  if (error || !questionBank) {
    return (
      <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-5xl">
          <QuestionBanksStatePanel
            action={
              <Button onClick={() => router.back()} type="button">
                Go Back
              </Button>
            }
            icon={<AlertCircle className="size-5" />}
            title="Unable to load question bank"
            description={error || "Question bank not found."}
          />
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Button asChild size="sm" variant="ghost" className="mb-3 -ml-3">
              <Link href="/teacher/question-banks">
                <ArrowLeft className="size-4" />
                Back
              </Link>
            </Button>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold text-foreground">{questionBank.title}</h1>
              <QuestionBanksBadge tone={getStatusTone(questionBank.status)}>
                {formatBankStatus(questionBank.status)}
              </QuestionBanksBadge>
            </div>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              {questionBank.description || "No description provided for this question bank."}
            </p>
          </div>

          <Button asChild size="sm">
            <Link href={`/teacher/question-banks/${questionBank.question_bank_id}/edit`}>
              <Edit3 className="size-4" />
              Edit Question Bank
            </Link>
          </Button>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetadataItem label="Topic" value={questionBank.topic || "No topic"} />
          <MetadataItem label="Questions" value={String(questions.length)} />
          <MetadataItem label="Created" value={formatDate(questionBank.created_at)} />
          <MetadataItem label="Updated" value={formatDate(questionBank.updated_at || questionBank.created_at)} />
        </section>

        <section className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Questions ({questions.length})</h2>
            <p className="text-sm text-muted-foreground">Review prompts, answer choices, and explanations in this bank.</p>
          </div>
          <Button disabled={questions.length === 0} onClick={toggleAllAnswers} size="sm" type="button" variant="outline">
            {showAllAnswers ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            {showAllAnswers ? "Hide All Answers" : "Show All Answers"}
          </Button>
        </section>

        {questions.length === 0 ? (
          <QuestionBanksStatePanel
            icon={<BookOpen className="size-5" />}
            title="No questions yet"
            description="Open edit mode to add reusable questions to this bank."
          />
        ) : (
          <div className="space-y-4">
            {questionGroups.map((group) => {
              const isExpanded = !collapsedChapters[group.chapter];

              return (
                <section key={group.chapter} className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                  <button
                    className="flex w-full items-center justify-between gap-3 border-b border-border px-4 py-3 text-left hover:bg-muted/50"
                    onClick={() => toggleChapter(group.chapter)}
                    type="button"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      {isExpanded ? <ChevronDown className="size-4 shrink-0" /> : <ChevronRight className="size-4 shrink-0" />}
                      <span className="truncate text-sm font-bold text-foreground">{group.chapter}</span>
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                      {group.questions.length} {group.questions.length === 1 ? "question" : "questions"}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="space-y-4 p-4">
                      {group.questions.map(({ question, index }) => (
                        <QuestionPreviewCard
                          index={index}
                          isRevealed={showAllAnswers || revealedQuestions.has(question.question_id)}
                          key={question.question_id}
                          onToggleReveal={toggleRevealQuestion}
                          question={question}
                        />
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function MetadataItem({ label, value }) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
      <p className="text-xs font-bold uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
