export function ExamSessionsPagination({ meta, showingText, visiblePages, onGoToPage }) {
  return (
    <footer className="flex flex-col gap-4 rounded-md border border-border bg-card px-5 py-4 text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm font-bold">{showingText}</div>
      <nav className="flex items-center gap-2" aria-label="Exam sessions pagination">
        <button
          type="button"
          onClick={() => onGoToPage(Math.max((meta.page ?? 1) - 1, 1))}
          disabled={(meta.page ?? 1) <= 1}
          className="h-9 rounded-md border border-border bg-card px-4 text-sm font-bold text-foreground transition hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        {visiblePages.map((page) => (
          <button
            type="button"
            key={page}
            onClick={() => onGoToPage(page)}
            className={`h-9 min-w-9 rounded-md border px-3 text-sm font-bold transition ${
              page === meta.page
                ? "border-auth-action bg-auth-action text-auth-action-foreground"
                : "border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            {page}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onGoToPage(Math.min((meta.page ?? 1) + 1, meta.totalPages ?? 1))}
          disabled={(meta.page ?? 1) >= (meta.totalPages ?? 1)}
          className="h-9 rounded-md border border-border bg-card px-4 text-sm font-bold text-foreground transition hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </nav>
    </footer>
  );
}
