"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { studySetsService } from "@/services/study-sets.service";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

import ResultDashboard from "@/app/learner/study-sets/[id]/quiz/result/_components/result-dashboard";
import AnswersReviewList from "@/app/learner/study-sets/[id]/quiz/result/_components/answers-review-list";

export default function PublicQuizResultPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const studySetId = params.id;
  const sessionId = searchParams.get("sessionId");

  const { role } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);

  useEffect(() => {
    if (!sessionId || !studySetId) return;

    async function loadResults() {
      setLoading(true);
      try {
        const resultsRes = await studySetsService.getSessionResults(sessionId);
        const resultInfo = resultsRes.data || resultsRes;

        const studySetRes = await studySetsService.getOne(studySetId);
        const setInfo = studySetRes.data || studySetRes;

        setSessionData(resultInfo.session || resultInfo);
        setAnswers(resultInfo.answers || []);
        setQuestions(setInfo.questions || []);

        setError(null);
      } catch (err) {
        console.error("Failed to load quiz results:", err);
        setError("Failed to load practice results. Please verify your access.");
      } finally {
        setLoading(false);
      }
    }

    loadResults();
  }, [sessionId, studySetId]);

  const handleRetakeQuiz = async () => {
    try {
      router.push(`/study-sets/${studySetId}/quiz`);
    } catch (err) {
      console.error("Failed to restart quiz:", err);
    }
  };

  const exitUrl = role === "learner" ? `/learner/study-sets/${studySetId}` : `/study-sets/${studySetId}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-muted-foreground">Loading your results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h2 className="text-xl font-bold text-destructive">Error Loading Results</h2>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button 
          onClick={() => router.push(exitUrl)}
          className="font-semibold rounded-xl px-5 py-2.5"
        >
          Back to Study Set
        </Button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <ResultDashboard 
          session={sessionData}
          totalQuestions={questions.length}
          onRetake={handleRetakeQuiz}
          onBack={() => router.push(exitUrl)}
        />

        <AnswersReviewList 
          sessionId={sessionId}
          questions={questions}
          answers={answers}
        />
        
      </div>
    </main>
  );
}
