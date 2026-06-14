import { CalendarClock } from "lucide-react";

export function CreateExamSummary({ availableQuestions, selectedBank }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <CalendarClock className="size-5" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">Available Questions</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{availableQuestions}</p>
          <p className="mt-1 text-xs text-muted-foreground">Selected source: {selectedBank?.title || "None"}</p>
        </div>
      </div>
    </div>
  );
}
