import { redirect } from "next/navigation";

export default async function AddQuestionPage({ params }) {
  const { id } = await params;
  redirect(`/teacher/question-banks/${id}/edit`);
}
