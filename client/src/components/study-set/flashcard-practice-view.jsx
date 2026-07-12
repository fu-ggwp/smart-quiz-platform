"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, BookOpen, PartyPopper } from "lucide-react";
import { studySetsService } from "@/services/study-sets.service";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import ConfirmModal from "@/components/common/confirm-modal";
import Flashcard from "./flashcard";
import FlashcardProgress from "./flashcard-progress";

export function FlashcardPracticeView({ 
  studySetId, 
  isGuest = false,
  exitHref,
  quizHref,
  showNavbar = false 
}) {
  const router = useRouter();
  
  // --- Core States ---
  const [studySet, setStudySet] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // States for tracking session progress
  const [sessionId, setSessionId] = useState(null);
  const [difficultQuestionIds, setDifficultQuestionIds] = useState(new Set());
  const [masteredQuestionIds, setMasteredQuestionIds] = useState(new Set());
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [savingProgress, setSavingProgress] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // --- Initialize data on mount ---
  useEffect(() => {
    if (!studySetId) return;

    async function initSession() {
      setLoading(true);
      try {
        // 1. Fetch study set details
        const setRes = await studySetsService.getOne(studySetId);
        setStudySet(setRes.data);
        const qList = setRes.data?.questions || [];
        setQuestions(qList);

        // 2. Recover card index from localStorage (only for logged in / learner)
        if (!isGuest) {
          const savedIndex = localStorage.getItem(`flashcard_index_${studySetId}`);
          if (savedIndex) {
            const idx = Number(savedIndex);
            if (idx >= 0 && idx < qList.length) {
              setCurrentIndex(idx);
            }
          }
        }

        // 3. For logged-in users, retrieve or initialize the practice session
        if (!isGuest) {
          let activeSessionId = null;
          try {
            const sessionsRes = await studySetsService.listMySessions();
            const sessionsList = Array.isArray(sessionsRes)
              ? sessionsRes
              : (Array.isArray(sessionsRes?.data) ? sessionsRes.data : []);
            
            const flashcardSessions = sessionsList.filter(
              (s) => s.study_set_id === studySetId && s.mode === "flashcard"
            );

            if (flashcardSessions.length > 0) {
              flashcardSessions.sort((a, b) => new Date(b.started_at) - new Date(a.started_at));
              const latest = flashcardSessions[0];
              
              if (latest.status === "in_progress") {
                activeSessionId = latest.practice_attempt_id;
                setSessionId(activeSessionId);
              }

              const resultsRes = await studySetsService.getSessionResults(latest.practice_attempt_id);
              const answers = Array.isArray(resultsRes)
                ? resultsRes
                : (Array.isArray(resultsRes?.data?.answers)
                    ? resultsRes.data.answers
                    : (Array.isArray(resultsRes?.data)
                        ? resultsRes.data
                        : (Array.isArray(resultsRes?.answers)
                            ? resultsRes.answers
                            : [])));

              const diffIds = new Set();
              const mastIds = new Set();
              answers.forEach((ans) => {
                if (ans.review_status === "marked_for_retry") {
                  diffIds.add(ans.question_id);
                } else if (ans.review_status === "mastered") {
                  mastIds.add(ans.question_id);
                }
              });
              setDifficultQuestionIds(diffIds);
              setMasteredQuestionIds(mastIds);
            }
          } catch (err) {
            console.error("Failed to recover previous session progress:", err);
          }

          if (!activeSessionId) {
            const sessionRes = await studySetsService.startSession(studySetId, "flashcard");
            const newSessionId = sessionRes?.data?.practice_attempt_id || sessionRes?.practice_attempt_id;
            if (newSessionId) {
              setSessionId(newSessionId);
            }
          }
        }
      } catch (err) {
        console.error("Failed to initialize flashcard study session:", err);
      } finally {
        setLoading(false);
      }
    }

    initSession();
  }, [studySetId, isGuest]);

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length) {
      setIsFlipped(false);
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, questions.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  // --- Auto-save card index to localStorage ---
  useEffect(() => {
    if (questions.length > 0 && !isGuest) {
      localStorage.setItem(`flashcard_index_${studySetId}`, currentIndex.toString());
    }
  }, [currentIndex, questions, studySetId, isGuest]);

  // --- Listen to Keyboard Events ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA") {
        return;
      }
      if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handlePrev, handleNext]);

  // --- Save learning progress via API ---
  const saveProgress = async (qId, status) => {
    if (isGuest || !sessionId) return;
    try {
      setSavingProgress(true);
      await studySetsService.submitAnswer(sessionId, {
        question_id: qId,
        selected_answer_option_ids: [],
        is_correct: status === "mastered",
        review_status: status
      });
    } catch (err) {
      const serverError = err.response?.data?.error || err.message;
      console.error("Failed to save progress:", serverError, err);
    } finally {
      setSavingProgress(false);
    }
  };

  // --- Toggle Difficult state ---
  const toggleDifficult = (qId) => {
    if (isGuest) {
      setShowLoginModal(true);
      return;
    }
    const newDifficult = new Set(difficultQuestionIds);
    const newMastered = new Set(masteredQuestionIds);
    const isDiff = newDifficult.has(qId);
    
    if (isDiff) {
      newDifficult.delete(qId);
      saveProgress(qId, "unreviewed");
    } else {
      newDifficult.add(qId);
      newMastered.delete(qId);
      saveProgress(qId, "marked_for_retry");
    }
    setDifficultQuestionIds(newDifficult);
    setMasteredQuestionIds(newMastered);
  };

  // --- Toggle Mastered state ---
  const markMastered = (qId) => {
    if (isGuest) {
      setShowLoginModal(true);
      return;
    }
    const newDifficult = new Set(difficultQuestionIds);
    const newMastered = new Set(masteredQuestionIds);
    const isMast = newMastered.has(qId);

    if (isMast) {
      newMastered.delete(qId);
      saveProgress(qId, "unreviewed");
    } else {
      newMastered.add(qId);
      newDifficult.delete(qId);
      saveProgress(qId, "mastered");
      
      if (currentIndex < questions.length - 1) {
        setTimeout(() => handleNext(), 300);
      }
    }
    setMasteredQuestionIds(newMastered);
    setDifficultQuestionIds(newDifficult);
  };



  const handleExit = async () => {
    try {
      if (!isGuest && sessionId && currentIndex === questions.length) {
        const score = Math.round((masteredQuestionIds.size / questions.length) * 100);
        await studySetsService.completeSession(sessionId, score);
      }
    } catch (err) {
      console.error("Failed to complete session on exit:", err);
    } finally {
      router.push(exitHref);
    }
  };

  const handleRestart = async () => {
    try {
      setSavingProgress(true);
      if (!isGuest && sessionId) {
        const resetPromises = questions.map(q => 
          studySetsService.submitAnswer(sessionId, {
            question_id: q.question_id,
            selected_answer_option_ids: [],
            is_correct: false,
            review_status: "unreviewed"
          })
        );
        await Promise.all(resetPromises);
      }
      
      setMasteredQuestionIds(new Set());
      setDifficultQuestionIds(new Set());
      setCurrentIndex(0);
      setIsFlipped(false);
    } catch (err) {
      console.error("Failed to restart flashcard progress:", err);
    } finally {
      setSavingProgress(false);
    }
  };

  const handleQuizClick = () => {
    if (isGuest) {
      setShowLoginModal(true);
    } else {
      router.push(quizHref);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-muted-foreground font-medium">Preparing cards...</p>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h2 className="text-xl font-bold text-foreground">No cards available</h2>
        <p className="text-sm text-muted-foreground max-w-xs">This study set does not contain any questions.</p>
        <Button onClick={() => router.back()}>Back</Button>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progressPercent = Math.min(100, Math.round(((currentIndex + 1) / questions.length) * 100));

  const renderCongratsScreen = () => (
    <main className="h-[calc(100vh-80px)] max-h-[calc(100vh-80px)] overflow-hidden bg-background text-foreground flex flex-col justify-between py-4 px-4 md:px-8">
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between">
        <Button onClick={handleExit} variant="ghost" className="text-muted-foreground hover:text-foreground gap-2 hover:bg-muted">
          <ArrowLeft className="size-4" />
          <span>Exit</span>
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground truncate max-w-[150px] md:max-w-[250px]">{studySet?.title}</span>
        </div>
        <div className="text-xs font-bold text-primary px-3 py-1 bg-primary/10 rounded-full flex items-center">
          <span>Finished</span>
        </div>
      </header>

      <section className="flex-1 max-w-md w-full mx-auto flex flex-col justify-center items-center text-center space-y-6 px-4">
        <div className="size-16 rounded-full bg-success/10 text-success flex items-center justify-center border border-success/20">
          <PartyPopper className="size-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-foreground">Congratulations!</h2>
          <p className="text-sm text-muted-foreground">
            You&apos;ve completed all {questions.length} flashcards in this study set.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Button onClick={handleRestart} disabled={savingProgress} className="flex-1 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-semibold py-2.5">
            {savingProgress ? "Resetting..." : "Restart Flashcards"}
          </Button>
          <Button onClick={handleQuizClick} variant="outline" className="flex-1 rounded-xl font-semibold py-2.5">
            Practice Quiz
          </Button>
        </div>
      </section>

      <footer className="h-10"></footer>
    </main>
  );

  const renderPracticeScreen = () => (
    <main className="h-[calc(100vh-80px)] max-h-[calc(100vh-80px)] overflow-hidden bg-background text-foreground flex flex-col justify-between py-4 px-4 md:px-8">
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between">
        <Button onClick={handleExit} variant="ghost" className="text-muted-foreground hover:text-foreground gap-2 hover:bg-muted">
          <ArrowLeft className="size-4" />
          <span>Exit</span>
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground truncate max-w-[150px] md:max-w-[250px]">{studySet?.title}</span>
        </div>
        <div className="w-20" />
      </header>

      <section className="flex-1 max-w-2xl w-full mx-auto flex flex-col justify-center items-center py-2">
        <p className="text-xs text-muted-foreground font-medium mb-3">Click the card to flip</p>
        
        <Flashcard 
          question={currentQuestion}
          isFlipped={isFlipped}
          onFlip={() => setIsFlipped(!isFlipped)}
          isDifficult={difficultQuestionIds.has(currentQuestion.question_id)}
          isMastered={masteredQuestionIds.has(currentQuestion.question_id)}
          onToggleDifficult={toggleDifficult}
          onMarkMastered={markMastered}
        />
      </section>

      <footer className="max-w-2xl w-full mx-auto space-y-4 mt-auto pb-2">
        <div className="flex items-center justify-center gap-6">
          <button 
            onClick={handlePrev} 
            disabled={currentIndex === 0} 
            className="w-16 h-11 bg-card border border-border text-foreground rounded-full flex items-center justify-center hover:bg-background active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none shadow-md"
            title="Back"
          >
            <ChevronLeft className="size-6 stroke-[2.5]" />
          </button>
          
          <span className="text-lg font-bold text-foreground tracking-wider min-w-[80px] text-center select-none">
            {currentIndex + 1} / {questions.length}
          </span>
          
          <button 
            onClick={handleNext} 
            disabled={currentIndex === questions.length} 
            className="w-16 h-11 bg-card border border-border text-foreground rounded-full flex items-center justify-center hover:bg-background active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none shadow-md"
            title={currentIndex === questions.length - 1 ? "Finish" : "Next"}
          >
            <ChevronRight className="size-6 stroke-[2.5]" />
          </button>
        </div>

        <FlashcardProgress 
          progressPercent={progressPercent}
          savingProgress={savingProgress}
        />
      </footer>
    </main>
  );

  const viewContent = currentIndex === questions.length ? renderCongratsScreen() : renderPracticeScreen();

  return (
    <>
      {showNavbar ? (
        <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
          <Navbar />
          {viewContent}
        </div>
      ) : (
        viewContent
      )}

      {/* Login Requirement Confirmation Modal */}
      <ConfirmModal
        isOpen={showLoginModal}
        title="Authentication Required"
        message="You must log in to access this feature. Please log in or register to track your learning progress."
        confirmLabel="Log In"
        cancelLabel="Cancel"
        onConfirm={() => {
          setShowLoginModal(false);
          const nextUrl = encodeURIComponent(`/study-sets/${studySetId}`);
          router.push(`/login?next=${nextUrl}`);
        }}
        onCancel={() => setShowLoginModal(false)}
        variant="info"
      />
    </>
  );
}
