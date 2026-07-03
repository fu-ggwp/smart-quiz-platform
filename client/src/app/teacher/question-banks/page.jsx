"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertCircle, BookOpen, Plus } from "lucide-react";
import { AppPagination } from "@/components/common/app-pagination";

import { Button } from "@/components/ui/button";
import { useQuestionBanksPage } from "@/hooks/use-question-banks-page";

import { QuestionBanksFilterBar } from "./_components/question-banks-filter-bar";
import { QuestionBanksStatePanel } from "./_components/question-banks-state-panel";
import { QuestionBanksTable } from "./_components/question-banks-table";

const itemsPerPage = 10;

function buildQuestionBankParams({ keyword, page, status }) {
  return {
    keyword: keyword.trim() || undefined,
    status: status === "all" ? undefined : status,
    page,
    limit: itemsPerPage,
    sortBy: "updated_at",
    sortOrder: "desc",
  };
}

export default function QuestionBanksPage() {
  const [pendingKeyword, setPendingKeyword] = useState("");
  const [pendingStatus, setPendingStatus] = useState("all");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [appliedStatus, setAppliedStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const params = useMemo(
    () => buildQuestionBankParams({ keyword: appliedKeyword, page: currentPage, status: appliedStatus }),
    [appliedKeyword, appliedStatus, currentPage]
  );

  const {
    error,
    loading,
    loadQuestionBanks,
    pagination,
    questionBanks,
  } = useQuestionBanksPage({ params });

  function applyFilters() {
    setAppliedKeyword(pendingKeyword);
    setAppliedStatus(pendingStatus);
    setCurrentPage(1);
  }

  function resetFilters() {
    setPendingKeyword("");
    setPendingStatus("all");
    setAppliedKeyword("");
    setAppliedStatus("all");
    setCurrentPage(1);
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Question Banks</h1>
            <p className="mt-2 text-sm text-muted-foreground">Manage teacher-owned repositories for study sets and exams.</p>
          </div>

          <Button asChild>
            <Link href="/teacher/question-banks/create">
              <Plus className="size-4" />
              Create Question Bank
            </Link>
          </Button>
        </div>

        <QuestionBanksFilterBar
          keyword={pendingKeyword}
          onApply={applyFilters}
          onKeywordChange={(event) => setPendingKeyword(event.target.value)}
          onReset={resetFilters}
          onStatusChange={(event) => setPendingStatus(event.target.value)}
          status={pendingStatus}
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
            <AppPagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={setCurrentPage}
            />
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
