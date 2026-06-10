import { ExamSessionsHeader } from "./_components/exam-sessions-header";
import { TeacherExamSessionsClient } from "./_components/teacher-exam-sessions-client";

export default function TeacherExamsPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-5 font-sans text-foreground [font-family:var(--font-geist-sans),Arial,sans-serif] sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl space-y-6">
        <ExamSessionsHeader />
        <TeacherExamSessionsClient />
      </section>
    </main>
  );
}
