import { ExamDetailClient } from "./_components/exam-detail-client";

export default async function TeacherExamDetailPage({ params }) {
  const { id } = await params;

  return <ExamDetailClient examId={id} />;
}
