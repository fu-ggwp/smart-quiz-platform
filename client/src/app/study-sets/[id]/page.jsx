"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { StudySetDetailView } from "@/components/study-set/StudySetDetailView";

export default function PublicStudySetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const { isAuthenticated, loading: authLoading, role } = useAuth();

  // Redirect authenticated learners to their layout page
  useEffect(() => {
    if (!authLoading && isAuthenticated && role === "learner") {
      router.replace(`/learner/study-sets/${id}`);
    }
  }, [authLoading, isAuthenticated, role, id, router]);

  if (authLoading || (isAuthenticated && role === "learner")) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-3 text-foreground">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-muted-foreground font-medium">Verifying session...</p>
      </div>
    );
  }

  return (
    <StudySetDetailView 
      studySetId={id}
      isGuest={true}
      backHref="/"
      backLabel="Back to Homepage"
      flashcardHref={`/study-sets/${id}/flashcards`}
      quizHref=""
      showNavbar={true}
    />
  );
}
