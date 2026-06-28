import { Button } from "@/components/ui/button";
import { formatSubmittedDate, formatDuration } from "./exam-helpers";

export function CompletedExamsTable({ exams = [], onViewDetail }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] table-fixed border-collapse text-left text-sm">
        <thead className="bg-muted text-xs font-bold uppercase text-muted-foreground">
          <tr>
            <th className="w-[25%] px-4 py-3">Exam</th>
            <th className="w-[13%] px-4 py-3">Class</th>
            <th className="w-[8%] px-4 py-3">Score</th>
            <th className="w-[12%] px-4 py-3">Attempt used</th>
            <th className="w-[16%] px-4 py-3">Submitted</th>
            <th className="w-[11%] px-4 py-3">Time spent</th>
            <th className="w-[15%] px-4 py-3 text-center">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {exams.map((attempt, index) => {
            const exam = attempt.exam_sessions ?? {};
            return (
              <tr
                key={`completed-${index}`}
                className="align-middle transition hover:bg-muted/40"
              >
                <td className="px-4 py-4 font-bold text-foreground truncate">
                  {exam.title}
                </td>
                <td className="px-4 py-4 font-medium text-muted-foreground truncate">
                  {exam.classes?.class_name ?? "Class"}
                </td>
                <td className="px-4 py-4 font-bold text-foreground">
                  {attempt.total_score}/{attempt.max_score ?? 10}
                </td>
                <td className="px-4 py-4 font-medium text-muted-foreground">
                  Attempt #{attempt.attempt_number}
                </td>
                <td className="px-4 py-4 font-medium text-muted-foreground">
                  {formatSubmittedDate(attempt.submitted_at)}
                </td>
                <td className="px-4 py-4 font-medium text-muted-foreground">
                  {formatDuration(attempt.duration_seconds)}
                </td>
                <td className="px-4 py-4 text-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onViewDetail(exam.exam_session_id, attempt.exam_attempt_id)}
                  >
                    View detail
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
