"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, BookOpen, Check, Edit3, Eye, EyeOff, ListChecks } from "lucide-react";

import { Button } from "@/components/ui/button";
import { questionBanksService } from "@/services/question-banks.service";

import { QuestionBanksBadge } from "../_components/question-banks-badge";
import { QuestionBanksStatePanel } from "../_components/question-banks-state-panel";
import { formatBankStatus, formatDate, getStatusTone } from "../_lib/question-banks.formatters";

function normalizeParamId(value) {
  return Array.isArray(value) ? value[0] : value;
}

function sortOptions(options = []) {
  return [...options].sort((left, right) => left.display_order - right.display_order);
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

        setQuestionBank(bankResponse?.data || null);
        setQuestions(questionRows || []);
        setShowAllAnswers(false);
        setRevealedQuestions(new Set());
      } catch (err) {
        if (ignore) return;

        setQuestionBank(null);
        setQuestions([]);
        setError(err.response?.data?.message || err.message || "Failed to load question bank details.");
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
            {questions.map((question, index) => (
              <QuestionCard
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

function QuestionCard({ index, isRevealed, onToggleReveal, question }) {
  const options = sortOptions(question.answer_options);

  return (
    <article className="grid gap-5 rounded-lg border border-border bg-card p-5 shadow-sm lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
      <div className="min-w-0 space-y-4">
        <div className="space-y-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">
            <ListChecks className="size-3.5" />
            Question #{index + 1}
          </span>

          <p className="break-words text-base font-semibold leading-7 text-foreground">{question.question_text}</p>
        </div>

        <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
          <p>Topic: <span className="font-semibold text-foreground">{question.topic || "None"}</span></p>
          <p>Chapter: <span className="font-semibold text-foreground">{question.chapter || "None"}</span></p>
        </div>
      </div>

      <div className="min-w-0 rounded-lg border border-border bg-background p-4">
        <div className="flex flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-bold text-foreground">Answer Options</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              aria-label={isRevealed ? "Hide answer" : "Show answer"}
              onClick={() => onToggleReveal(question.question_id)}
              size="icon"
              title={isRevealed ? "Hide answer" : "Show answer"}
              type="button"
              variant="ghost"
            >
              {isRevealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </Button>
          </div>
        </div>

        {options.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">
            No answer options
          </p>
        ) : (
          <div className="mt-4 space-y-2 text-sm">
            {options.map((option, optionIndex) => (
              <AnswerOption isRevealed={isRevealed} key={option.answer_option_id} option={option} optionIndex={optionIndex} />
            ))}
          </div>
        )}

        {isRevealed && question.explanation ? (
          <div className="mt-4 rounded-lg border border-primary/10 bg-primary/5 p-4">
            <h3 className="text-xs font-bold uppercase text-primary">Explanation</h3>
            <p className="mt-1 text-sm leading-6 text-foreground">{question.explanation}</p>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function AnswerOption({ isRevealed, option, optionIndex }) {
  const isCorrectVisible = isRevealed && option.is_correct;

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border p-3 ${
        isCorrectVisible
          ? "border-emerald-500 bg-emerald-50 text-emerald-950"
          : "border-border bg-background text-foreground"
      }`}
    >
      <span
        className={`flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
          isCorrectVisible
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-border bg-muted text-muted-foreground"
        }`}
      >
        {isCorrectVisible ? <Check className="size-3.5" /> : String.fromCharCode(65 + optionIndex)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="break-words leading-6">{option.option_text}</p>
        {isCorrectVisible ? <p className="mt-1 text-xs font-bold text-emerald-700">Correct answer</p> : null}
      </div>
    </div>
  );
}
