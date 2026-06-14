import { formatDateTime, formatVisibility } from "../../_components/exam-session-options";

function SummaryItem({ label, value }) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <div className="text-xs font-bold uppercase text-muted-foreground">{label}</div>
      <div className="mt-2 text-sm font-bold text-foreground">{value || "Not set"}</div>
    </div>
  );
}

export function ExamDetailSummary({ exam }) {
  return (
    <div className="rounded-md border border-border bg-card p-4 shadow-sm sm:p-5">
      <h2 className="text-base font-bold text-foreground">Configuration Summary</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <SummaryItem label="Class" value={exam.classes?.class_name} />
        <SummaryItem label="Question Source" value={exam.question_bank?.title} />
        <SummaryItem label="Start Time" value={formatDateTime(exam.start_at)} />
        <SummaryItem label="End Time" value={formatDateTime(exam.end_at)} />
        <SummaryItem label="Duration" value={`${exam.duration_minutes} minutes`} />
        <SummaryItem label="Allowed Attempts" value={String(exam.attempt_limit)} />
        <SummaryItem label="Question Count" value={String(exam.question_count)} />
        <SummaryItem label="Result Visibility" value={formatVisibility(exam.result_visibility)} />
        <SummaryItem label="Access Code" value={exam.access_code || "Auto-generated if blank"} />
        <SummaryItem label="Last Updated" value={formatDateTime(exam.updated_at)} />
      </div>
    </div>
  );
}
