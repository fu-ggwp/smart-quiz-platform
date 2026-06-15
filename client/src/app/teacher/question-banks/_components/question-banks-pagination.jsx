export function QuestionBanksPagination({ onPageChange, pagination }) {
  const totalPages = Math.max(1, pagination.totalPages || 0);
  const currentPage = pagination.page || 1;
  const count = pagination.total || 0;
  const pageSize = pagination.limit || 10;
  const startItem = count === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, count);
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
              page === currentPage ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground"
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