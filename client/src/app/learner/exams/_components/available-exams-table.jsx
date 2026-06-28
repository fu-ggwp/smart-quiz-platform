import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "./exam-helpers";

export function AvailableExamsTable({ exams = [], onOpenExam }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] table-fixed border-collapse text-left text-sm">
        <thead className="bg-muted text-xs font-bold uppercase text-muted-foreground">
          <tr>
            <th className="w-[35%] px-4 py-3">Exam</th>
            <th className="w-[18%] px-4 py-3">Class</th>
            <th className="w-[14%] px-4 py-3">Duration</th>
            <th className="w-[18%] px-4 py-3">Start time</th>
            <th className="w-[15%] px-4 py-3 text-center">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {exams.map((exam, index) => (
            <tr
              key={`available-${index}`}
              className="align-middle transition hover:bg-muted/40"
            >
              <td className="px-4 py-4 font-bold text-foreground truncate">
                {exam.title}
              </td>
              <td className="px-4 py-4 font-medium text-muted-foreground truncate">
                {exam.classes?.class_name ?? "Class"}
              </td>
              <td className="px-4 py-4 font-medium text-muted-foreground truncate">
                {exam.duration_minutes} minutes
              </td>
              <td className="px-4 py-4 font-medium text-muted-foreground">
                {formatDateTime(exam.start_at)}
              </td>
              <td className="px-4 py-4 text-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenExam(exam.exam_session_id)}
                >
                  <LockKeyhole className="size-4" />
                  Enter Code
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
