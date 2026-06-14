export function ExamDetailSource({ exam }) {
  return (
    <section className="rounded-md border border-border bg-card p-4 shadow-sm sm:p-5">
      <h2 className="text-base font-bold text-foreground">Source Details</h2>
      <div className="mt-4 space-y-3 text-sm font-medium text-muted-foreground">
        <p>{exam.question_bank?.topic || "No topic"}</p>
        <p>
          Exam questions are configured from the selected teacher question bank and stored as exam
          question snapshots for the session.
        </p>
      </div>
    </section>
  );
}
