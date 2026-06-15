const itemsPerPage = 10;

export function buildQuestionBankParams({ keyword, page, status }) {
  return {
    keyword: keyword.trim() || undefined,
    status: status === "all" ? undefined : status,
    page,
    limit: itemsPerPage,
    sortBy: "updated_at",
    sortOrder: "desc",
  };
}