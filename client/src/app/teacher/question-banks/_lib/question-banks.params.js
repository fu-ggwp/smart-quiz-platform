import { ITEMS_PER_PAGE } from "./question-banks.constants";

export function buildQuestionBankParams({ keyword, page, status, subject }) {
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
