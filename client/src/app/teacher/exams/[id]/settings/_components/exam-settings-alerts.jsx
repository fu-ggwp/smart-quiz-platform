export function ExamSettingsAlerts({ locked, error, success }) {
  return (
    <>
      {locked ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          Active exam sessions cannot be configured after their start time. Draft exams remain editable until they are activated.
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
