"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { studySetsService } from "@/services/study-sets.service";

import ResultDashboard from "./_components/ResultDashboard";
import AnswersReviewList from "./_components/AnswersReviewList";

export default function LearnerQuizResultPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const studySetId = params.id;
  const sessionId = searchParams.get("sessionId");

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
        // Tải thông tin phiên kiểm tra kèm câu trả lời
        const resultsRes = await studySetsService.getSessionResults(sessionId);
        const resultInfo = resultsRes.data || resultsRes;

        // Tải chi tiết học phần để đối chiếu danh sách câu hỏi & đáp án
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

  // Tải lại bài thi (UC-20 Alternative Flow 9.1)
  const handleRetakeQuiz = async () => {
    try {
      router.push(`/learner/study-sets/${studySetId}/quiz`);
    } catch (err) {
      console.error("Failed to restart quiz:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50/50 flex flex-col items-center justify-center space-y-4">
        <div className="size-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-neutral-500">Loading your results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h2 className="text-xl font-bold text-red-500">Error Loading Results</h2>
        <p className="text-sm text-neutral-500">{error}</p>
        <button 
          onClick={() => router.push(`/learner/study-sets/${studySetId}`)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl px-5 py-2.5"
        >
          Back to Study Set
        </button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50/50 text-neutral-900 px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Thống kê điểm số */}
        <ResultDashboard 
          session={sessionData}
          totalQuestions={questions.length}
          onRetake={handleRetakeQuiz}
          onBack={() => router.push(`/learner/study-sets/${studySetId}`)}
        />

        {/* Danh sách rà soát câu đúng/sai */}
        <AnswersReviewList 
          sessionId={sessionId}
          questions={questions}
          answers={answers}
        />
        
      </div>
    </main>
  );
}
