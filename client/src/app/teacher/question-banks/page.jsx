"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, BookOpen, Plus, Search, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { questionBanksService } from "@/services/question-banks.service";

const ITEMS_PER_PAGE = 10;

const statusOptions = [
  { value: "all", label: "All status" },
  { value: "draft", label: "Private" },
  { value: "reviewed", label: "Assigned" },
  { value: "archived", label: "Archived" },
];

function buildParams({ keyword, page, status, subject }) {
  return {
    keyword: keyword.trim() || undefined,
    subject: subject === "all" ? undefined : subject,
    status: status === "all" ? undefined : status,
    page,
    limit: ITEMS_PER_PAGE,
    sortBy: "updated_at",
    sortOrder: "desc",
  };
}

function formatDate(value) {
  if (!value) return "Not updated";
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatLabel(value) {
  if (!value) return "None";
  return value.charAt(0).toUpperCase() + value.slice(1).replaceAll("_", " ");
}

function formatBankStatus(value) {
  if (value === "draft") return "Private";
  if (value === "reviewed") return "Assigned";
  return formatLabel(value);
}

function getStatusTone(value) {
  if (value === "reviewed") return "green";
  if (value === "archived") return "red";
  return "neutral";
}

export default function QuestionBanksPage() {
  const [questionBanks, setQuestionBanks] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: ITEMS_PER_PAGE, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [keyword, setKeyword] = useState("");
  const [subject, setSubject] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  const params = useMemo(
    () => buildParams({ keyword, page, status, subject }),
    [keyword, page, status, subject]
  );

  const fetchQuestionBanks = useCallback(async (activeParams, fallbackPage) => {
    try {
      const data = await questionBanksService.listMine(activeParams);
      setQuestionBanks(data?.items ?? []);
      setPagination(data?.pagination ?? { page: fallbackPage, limit: ITEMS_PER_PAGE, total: 0, totalPages: 0 });
      setError(null);
    } catch (err) {
      setQuestionBanks([]);
      setPagination({ page: fallbackPage, limit: ITEMS_PER_PAGE, total: 0, totalPages: 0 });
      setError(err.response?.data?.message || err.message || "Failed to load question banks.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadQuestionBanks = useCallback(async () => {
    setLoading(true);
    setError(null);
    await fetchQuestionBanks(params, page);
  }, [fetchQuestionBanks, page, params]);

  const fetchSubjects = useCallback(async () => {
    try {
      const data = await questionBanksService.listSubjects();
      setSubjects(data ?? []);
    } catch {
      setSubjects([]);
    } finally {
      setSubjectsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchQuestionBanks(params, page);
  }, [fetchQuestionBanks, page, params]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSubjects();
  }, [fetchSubjects]);

  const subjectOptions = useMemo(
    () => [
      { value: "all", label: subjectsLoading ? "Loading subjects" : "All subjects" },
      ...subjects.map((value) => ({ value, label: value })),
    ],
    [subjects, subjectsLoading]
  );

  function handleKeywordChange(event) {
    setLoading(true);
    setError(null);
    setKeyword(event.target.value);
    setPage(1);
  }

  function handleFilterChange(setter) {
    return (event) => {
      setLoading(true);
      setError(null);
      setter(event.target.value);
      setPage(1);
    };
  }

  function resetFilters() {
    setLoading(true);
    setError(null);
    setKeyword("");
    setSubject("all");
    setStatus("all");
    setPage(1);
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl space-y-6">
        <PageHeader />

        <FilterBar
          keyword={keyword}
          onKeywordChange={handleKeywordChange}
          onReset={resetFilters}
          onStatusChange={handleFilterChange(setStatus)}
          onSubjectChange={handleFilterChange(setSubject)}
          subjectOptions={subjectOptions}
          status={status}
          subject={subject}
        />

        {loading ? (
          <StatePanel title="Loading question banks" description="Fetching your teacher repositories." />
        ) : error ? (
          <StatePanel
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
            <PaginationBar
              pagination={pagination}
              onPageChange={(nextPage) => {
                setLoading(true);
                setError(null);
                setPage(nextPage);
              }}
            />
          </>
        ) : (
          <StatePanel
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

function PageHeader() {
  return (
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
  );
}

function FilterBar({
  keyword,
  onKeywordChange,
  onReset,
  onStatusChange,
  onSubjectChange,
  subjectOptions,
  status,
  subject,
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-[minmax(240px,1fr)_repeat(2,minmax(150px,190px))_auto]">
        <Field label="Search Question Banks">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-8" onChange={onKeywordChange} placeholder="Title, description, subject, topic" value={keyword} />
          </div>
        </Field>

        <SelectField label="Subject" onChange={onSubjectChange} options={subjectOptions} value={subject} />
        <SelectField label="Status" onChange={onStatusChange} options={statusOptions} value={status} />

        <div className="flex items-end justify-end">
          <Button onClick={onReset} type="button" variant="ghost">
            <SlidersHorizontal className="size-4" />
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}

function QuestionBanksTable({ questionBanks }) {
  const router = useRouter();

  function openQuestionBank(questionBankId) {
    router.push(`/teacher/question-banks/${questionBankId}`);
  }

  function handleRowKeyDown(event, questionBankId) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openQuestionBank(questionBankId);
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-muted text-left text-xs font-bold uppercase tracking-wide text-muted-foreground">
            <tr>
              {[
                "Question Bank",
                "Subject",
                "Status",
                "Questions",
                "Updated",
              ].map((header) => (
                <th className="px-4 py-3" key={header}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {questionBanks.map((bank) => (
              <tr
                aria-label={`View details for ${bank.title}`}
                className="cursor-pointer align-top outline-none transition hover:bg-muted/50 focus-visible:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring"
                key={bank.question_bank_id}
                onClick={() => openQuestionBank(bank.question_bank_id)}
                onKeyDown={(event) => handleRowKeyDown(event, bank.question_bank_id)}
                role="button"
                tabIndex={0}
              >
                <td className="px-4 py-3">
                  <p className="font-bold text-foreground">{bank.title}</p>
                  <p className="max-w-xl text-xs text-muted-foreground">{bank.description || "No description"}</p>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  <p>{bank.subject || "No subject"}</p>
                  <p className="text-xs">{bank.topic || "No topic"}</p>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={getStatusTone(bank.status)}>
                    {formatBankStatus(bank.status)}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{bank.questionCount ?? 0}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(bank.updated_at || bank.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Badge({ children, tone }) {
  const toneClass =
    tone === "green"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
      : tone === "amber"
        ? "bg-amber-50 text-amber-700 ring-amber-100"
        : tone === "red"
          ? "bg-rose-50 text-rose-700 ring-rose-100"
          : "bg-muted text-muted-foreground ring-border";

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${toneClass}`}>{children}</span>;
}

function Field({ children, label }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      {children}
    </label>
  );
}

function SelectField({ label, onChange, options, value }) {
  return (
    <Field label={label}>
      <select
        className="h-8 w-full rounded-2xl border border-transparent bg-input/50 px-2.5 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
        onChange={onChange}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

function StatePanel({ action, description, icon, title }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
      {icon ? (
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {icon}
        </div>
      ) : null}
      <h3 className="text-base font-bold text-foreground">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

function PaginationBar({ onPageChange, pagination }) {
  const totalPages = Math.max(1, pagination.totalPages || 0);
  const currentPage = pagination.page || 1;
  const count = pagination.total || 0;
  const startItem = count === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, count);
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm shadow-sm">
      <span className="font-semibold text-foreground">
        Showing {startItem}&ndash;{endItem} of {count} question banks
      </span>
      <div className="flex flex-wrap items-center gap-2">
        <button
          className="h-8 rounded-full px-3 text-sm font-medium text-muted-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          type="button"
        >
          Previous
        </button>
        {pages.map((page) => (
          <button
            className={`flex size-8 items-center justify-center rounded-full text-sm font-bold transition ${
              page === currentPage
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            key={page}
            onClick={() => onPageChange(page)}
            type="button"
          >
            {page}
          </button>
        ))}
        <button
          className="h-8 rounded-full px-3 text-sm font-medium text-muted-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          type="button"
        >
          Next
        </button>
      </div>
    </div>
  );
}
