import { ExamSettingsClient } from "./_components/exam-settings-client";

export default async function ExamSettingsPage({ params }) {
  const { id } = await params;

  return <ExamSettingsClient examId={id} />;
}
