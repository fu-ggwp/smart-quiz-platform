"use client";

import { useRouter } from "next/navigation";

import { formatDate, getStatusTone, QuestionBanksBadge } from "./question-banks-badge";

/**
 * Read-only table for teacher banks. Rows are keyboard-clickable detail links.
 */
export function QuestionBanksTable({ questionBanks }) {
  const router = useRouter();

  function openQuestionBank(questionBankId) {
    router.push(`/teacher/question-banks/${questionBankId}`);
  }



  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-muted text-left text-xs font-bold uppercase tracking-wide text-muted-foreground">
            <tr>
              {["Question Bank", "Subject", "Status", "Questions", "Updated"].map((header) => (
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
                
              >
                <td className="px-4 py-3">
                  <p className="font-bold text-foreground">{bank.title}</p>
                  <p className="max-w-xl text-xs text-muted-foreground">{bank.description || "No description"}</p>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{bank.subject || "No subject"}</td>
                <td className="px-4 py-3">
                  <QuestionBanksBadge tone={getStatusTone(bank.status)}>{bank.status}</QuestionBanksBadge>
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
