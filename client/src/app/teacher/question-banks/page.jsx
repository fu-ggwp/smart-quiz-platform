"use client";

import Link from "next/link";
import { AlertCircle, BookOpen, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useQuestionBanksPage } from "@/hooks/use-question-banks-page";

import { QuestionBanksFilterBar } from "./_components/question-banks-filter-bar";
import { QuestionBanksHeader } from "./_components/question-banks-header";
import { QuestionBanksPagination } from "./_components/question-banks-pagination";
import { QuestionBanksStatePanel } from "./_components/question-banks-state-panel";
import { QuestionBanksTable } from "./_components/question-banks-table";

export default function QuestionBanksPage() {
  const {
    draftKeyword,
    draftStatus,
    draftSubject,
    error,
    handleKeywordChange,
    loading,
    loadQuestionBanks,
    onApplyFilters,
    onPageChange,
    onResetFilters,
    onStatusChange,
    onSubjectChange,
    pagination,
    questionBanks,
    subjectOptions,
  } = useQuestionBanksPage();

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl space-y-6">
        <QuestionBanksHeader />

        <QuestionBanksFilterBar
          keyword={draftKeyword}
          onApply={onApplyFilters}
          onKeywordChange={handleKeywordChange}
          onReset={onResetFilters}
          onStatusChange={onStatusChange}
          onSubjectChange={onSubjectChange}
          subjectOptions={subjectOptions}
          status={draftStatus}
          subject={draftSubject}
        />

        {loading ? (
          <QuestionBanksStatePanel title="Loading question banks" description="Fetching your teacher repositories." />
        ) : error ? (
          <QuestionBanksStatePanel
            action={
              <Button onClick={loadQuestionBanks} type="button">
                Try Again
              </Button>
            }
            icon={<AlertCircle className="size-5" />}
            title="Unable to load question banks"
            description={error}
          />
        ) : questionBanks.length ? (
          <>
            <QuestionBanksTable questionBanks={questionBanks} />
            <QuestionBanksPagination pagination={pagination} onPageChange={onPageChange} />
          </>
        ) : (
          <QuestionBanksStatePanel
            action={
              <Button asChild>
                <Link href="/teacher/question-banks/create">
                  <Plus className="size-4" />
                  Create Question Bank
                </Link>
              </Button>
            }
            icon={<BookOpen className="size-5" />}
            title="No question banks found"
            description="Create a repository before adding reusable questions."
          />
        )}
      </section>
    </main>
  );
}
