import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { formatClassLabel, formatDateTime, formatVisibility } from "../../_components/exam-session-options";

function SummaryItem({ className = "", label, value }) {
  return (
    <div className={cn("min-h-[84px] rounded-md bg-muted/60 p-4", className)}>
      <div className="text-xs font-medium uppercase text-muted-foreground">{label}</div>
      <div className="mt-2 text-sm font-medium text-foreground">{value || "Not set"}</div>
    </div>
  );
}

function BooleanItem({ label, enabled }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-muted/60 p-3">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <Badge variant={enabled ? "default" : "secondary"}>{enabled ? "Enabled" : "Disabled"}</Badge>
    </div>
  );
}

export function ExamDetailSummary({ exam }) {
  return (
    <section className="grid gap-5">
      <Card className="border border-border shadow-sm">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-lg font-semibold">Basic Info</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryItem label="Class" value={formatClassLabel(exam.classes)} />
          <SummaryItem label="Question Source" value={exam.question_bank?.title} />
          <SummaryItem label="Question Subject" value={exam.question_bank?.subject || "No subject"} />
          <SummaryItem label="Last Updated" value={formatDateTime(exam.updated_at)} />
        </CardContent>
      </Card>

      <Card className="border border-border shadow-sm">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-lg font-semibold">Timing & Status</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <SummaryItem label="Start Time" value={formatDateTime(exam.start_at)} />
          <SummaryItem label="End Time" value={formatDateTime(exam.end_at)} />
          <SummaryItem label="Duration" value={`${exam.duration_minutes} minutes`} />
        </CardContent>
      </Card>

      <Card className="border border-border shadow-sm">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-lg font-semibold">Rules</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <SummaryItem label="Question Count" value={String(exam.question_count)} />
          <SummaryItem label="Allowed Attempts" value={String(exam.attempt_limit)} />
          <SummaryItem label="Result Visibility" value={formatVisibility(exam.result_visibility)} />
          <SummaryItem label="Access Code" value={exam.access_code || "Auto-generated if blank"} />
          <BooleanItem label="Randomize Questions" enabled={exam.randomize_questions} />
          <BooleanItem label="Randomize Answers" enabled={exam.randomize_answers} />
        </CardContent>
      </Card>
    </section>
  );
}
