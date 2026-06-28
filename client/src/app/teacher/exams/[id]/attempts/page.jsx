import { ExamAttemptsClient } from "./_components/exam-attempts-client";

export default async function TeacherExamAttemptsPage({ params }) {
  const { id } = await params;

  return <ExamAttemptsClient examId={id} />;
}
