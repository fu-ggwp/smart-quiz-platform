import { redirect } from "next/navigation";

export default async function ExamMonitorPage({ params }) {
  const { id } = await params;

  redirect(`/teacher/exams/${id}/attempts`);
}
