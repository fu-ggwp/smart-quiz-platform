"use client";

import { useParams } from "next/navigation";
import { StudySetDetailView } from "@/components/study-set/study-set-detail-view";

export default function LearnerStudySetDetailPage() {
  const params = useParams();
  const id = params.id;

  return (
    <StudySetDetailView 
      studySetId={id}
      isGuest={false}
      backHref="/learner/study-sets"
      backLabel="My Study Sets"
      flashcardHref={`/learner/study-sets/${id}/flashcards`}
      quizHref={`/learner/study-sets/${id}/quiz`}
      showNavbar={false}
    />
  );
}
