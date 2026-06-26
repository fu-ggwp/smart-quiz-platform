"use client";

import { useParams } from "next/navigation";
import { FlashcardPracticeView } from "@/components/study-set/FlashcardPracticeView";

export default function LearnerFlashcardsPage() {
  const params = useParams();
  const id = params.id;

  return (
    <FlashcardPracticeView 
      studySetId={id}
      isGuest={false}
      exitHref={`/learner/study-sets/${id}`}
      quizHref={`/learner/study-sets/${id}/quiz`}
      showNavbar={false}
    />
  );
}
