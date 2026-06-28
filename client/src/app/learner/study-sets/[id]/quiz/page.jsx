"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, AlertCircle, HelpCircle } from "lucide-react";
import { studySetsService } from "@/services/study-sets.service";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

import QuizCard from "./_components/QuizCard";
import QuestionMap from "./_components/QuestionMap";
import ConfirmExitModal from "./_components/ConfirmExitModal";

function shuffleArray(array) {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

export default function LearnerQuizPage() {
  const params = useParams();
  const router = useRouter();
  const studySetId = params.id;

  const { isAuthenticated, loading: authLoading } = useAuth();

  const [studySet, setStudySet] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [sessionId, setSessionId] = useState(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [checkedQuestions, setCheckedQuestions] = useState({});
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showConfirmExit, setShowConfirmExit] = useState(false);

  const handleSubmitQuiz = useCallback(async () => {
    setSubmitting(true);
    try {
      await studySetsService.completeSession(sessionId);
      router.push(`/learner/study-sets/${studySetId}/quiz/result?sessionId=${sessionId}`);
    } catch (err) {
      console.error("Failed to submit quiz:", err);
      alert("Failed to submit quiz. Please try again.");
      setSubmitting(false);
    }
  }, [sessionId, studySetId, router]);

  const handleSelectOption = async (questionId, optionId) => {
    if (isAnswerChecked) return;
    const question = questions.find(q => q.question_id === questionId);
    const correctCount = (question?.answer_options || []).filter(opt => opt.is_correct).length;
    const isMultiSelect = correctCount > 1;

    let newSelections = [];
    if (isMultiSelect) {
      const currentSelections = Array.isArray(selectedAnswers[questionId])
        ? selectedAnswers[questionId]
        : selectedAnswers[questionId]
          ? [selectedAnswers[questionId]]
          : [];

      if (currentSelections.includes(optionId)) {
        newSelections = currentSelections.filter(id => id !== optionId);
      } else {
        newSelections = [...currentSelections, optionId];
      }
    } else {
      newSelections = [optionId];
    }

    setSelectedAnswers(prev => ({ ...prev, [questionId]: newSelections }));
    try {
      await studySetsService.submitAnswer(sessionId, {
        question_id: questionId,
        selected_answer_option_ids: newSelections
      });
    } catch (err) {
      console.error("Failed to save answer:", err);
    }
  };

  const handleConfirmExit = () => {
    setShowConfirmExit(false);
    router.push(`/learner/study-sets/${studySetId}`);
  };

  useEffect(() => {
    if (!studySetId || authLoading) return;

    if (!isAuthenticated) {
      router.replace(`/study-sets/${studySetId}`);
      return;
    }

    async function initializeQuiz() {
      setLoading(true);
      try {
        const res = await studySetsService.getOne(studySetId);
        const setInfo = res.data || res;
        const originalQuestions = setInfo.questions || [];

        if (originalQuestions.length === 0) {
          setError({ status: 400, message: "No questions available for quiz mode." });
          setLoading(false);
          return;
        }

        setStudySet(setInfo);
        setQuestions(shuffleArray(originalQuestions));

        const sessionRes = await studySetsService.startSession(studySetId, "quiz");
        const newSessionId = sessionRes?.data?.practice_attempt_id || sessionRes?.practice_attempt_id;
        
        if (newSessionId) {
          setSessionId(newSessionId);
        } else {
          throw new Error("Failed to initialize quiz session.");
        }
        setError(null);
      } catch (err) {
        console.error("Failed to initialize quiz:", err);
        const status = err.response?.status || err.status || 500;
        const message = err.response?.data?.error || err.message;
        setError({ status, message });
      } finally {
        setLoading(false);
      }
    }
    initializeQuiz();
  }, [studySetId, authLoading, isAuthenticated, router]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (sessionId && !submitting) {
        e.preventDefault();
        e.returnValue = "Your quiz is in progress. Exiting will leave it incomplete.";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [sessionId, submitting]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA") {
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const currentQ = questions[currentIndex];
        const hasSelection = (selectedAnswers[currentQ?.question_id] || []).length > 0;

        if (!isAnswerChecked) {
          if (hasSelection) {
            setIsAnswerChecked(true);
            if (currentQ) {
              setCheckedQuestions(prev => ({ ...prev, [currentQ.question_id]: true }));
            }
          }
        } else {
          if (currentIndex < questions.length - 1) {
            setIsAnswerChecked(false);
            setCurrentIndex(prev => prev + 1);
          } else {
            handleSubmitQuiz();
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAnswerChecked, selectedAnswers, currentIndex, questions, handleSubmitQuiz, setCheckedQuestions]);



  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50/50 flex flex-col items-center justify-center space-y-4">
        <div className="size-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-neutral-500">Generating your quiz...</p>
      </div>
    );
  }

  if (error) {
    const isNoPermission = error.status === 403 && error.message.includes("permission");
    const isNotAvailable = error.status === 403 && error.message.includes("available");
    const isNoQuestions = error.status === 400;

    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white border border-neutral-200 rounded-3xl p-8 shadow-sm space-y-6">
          <div className="size-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-neutral-900">
              {isNoPermission && "Access Denied"}
              {isNotAvailable && "Quiz Unavailable"}
              {isNoQuestions && "No Questions Available"}
              {!isNoPermission && !isNotAvailable && !isNoQuestions && "Error Occurred"}
            </h2>
            <p className="text-sm text-neutral-500 leading-relaxed">
              {error.message || "An unexpected error occurred."}
            </p>
          </div>
          <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2.5 font-semibold" onClick={() => router.push("/learner/study-sets")}>
            Back to Study Sets
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.values(checkedQuestions).filter(Boolean).length;
  const progressPercent = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  return (
    <main className="min-h-screen bg-neutral-50/50 text-neutral-900 px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* KHU VỰC LÀM BÀI */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            {answeredCount < questions.length ? (
              <button 
                onClick={() => setShowConfirmExit(true)} 
                className="flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                <ArrowLeft size={16} />
                <span>Exit Practice</span>
              </button>
            ) : (
              <div />
            )}
            <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full border border-indigo-100/50">
              Quiz Mode
            </span>
          </div>

          {/* Thanh Tiến Độ */}
          <div className="bg-white border border-neutral-100 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-neutral-500">
              <span>PROGRESS</span>
              <span>{answeredCount} of {questions.length} answered</span>
            </div>
            <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600 transition-all duration-300 rounded-full" style={{ width: `${progressPercent}%` }} ></div>
            </div>
          </div>

          <QuizCard 
            question={currentQuestion} 
            questionNumber={currentIndex + 1}
            selectedOptionIds={selectedAnswers[currentQuestion?.question_id] || []}
            onSelectOption={(optId) => handleSelectOption(currentQuestion.question_id, optId)}
            isAnswerChecked={isAnswerChecked}
            onCheckAnswer={() => {
              setIsAnswerChecked(true);
              if (currentQuestion) {
                setCheckedQuestions(prev => ({ ...prev, [currentQuestion.question_id]: true }));
              }
            }}
            onNextQuestion={() => {
              setIsAnswerChecked(false);
              setCurrentIndex(prev => prev + 1);
            }}
            isLast={currentIndex === questions.length - 1}
            onSubmit={handleSubmitQuiz}
          />
        </div>

        {/* BẢNG TIẾN ĐỘ VÀ ĐIỀU HƯỚNG NHANH */}
        <div className="space-y-6">
          <QuestionMap 
            questions={questions}
            currentIndex={currentIndex}
            selectedAnswers={selectedAnswers}
            checkedQuestions={checkedQuestions}
          />
        </div>
      </div>

      {/* CONFIRM EXIT MODAL */}
      <ConfirmExitModal 
        isOpen={showConfirmExit}
        onClose={() => setShowConfirmExit(false)}
        onConfirm={handleConfirmExit}
      />
    </main>
  );
}