export function ExamSettingsAlerts({ locked, error, success }) {
  return (
    <>
      {locked ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          This exam can no longer be configured because it has started, closed, or already has learner attempts.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-md border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-bold text-primary">
          {success}
        </div>
      ) : null}
    </>
  );
}
