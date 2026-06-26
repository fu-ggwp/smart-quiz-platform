"use client";

import { useParams } from "next/navigation";
import { FlashcardPracticeView } from "@/components/study-set/FlashcardPracticeView";

export default function PublicStudySetFlashcardsPage() {
  const params = useParams();
  const id = params.id;

  return (
    <FlashcardPracticeView 
      studySetId={id}
      isGuest={true}
      exitHref={`/study-sets/${id}`}
      quizHref=""
      showNavbar={true}
    />
  );
}
