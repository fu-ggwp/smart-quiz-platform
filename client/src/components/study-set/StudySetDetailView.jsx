"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  BookOpen, 
  HelpCircle,
  FileQuestion,
} from "lucide-react";
import { studySetsService } from "@/services/study-sets.service";
import { Button } from "@/components/ui/button";
import ConfirmModal from "@/components/common/ConfirmModal";
import { Navbar } from "@/components/layout/navbar";
import { StudySetHeader } from "./StudySetHeader";
import { StudyModeCard } from "./StudyModeCard";
import { QuestionCard } from "./QuestionCard";

export function StudySetDetailView({
  studySetId,
  isGuest = false,
  backHref,
  backLabel = "Back",
  flashcardHref,
  quizHref,
  showNavbar = false
}) {
  const router = useRouter();

  const [studySet, setStudySet] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [difficultQuestionIds, setDifficultQuestionIds] = useState(new Set());
  const [masteredQuestionIds, setMasteredQuestionIds] = useState(new Set());
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all"); // "all" | "starred"
  
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    if (!studySetId) return;

    async function loadDetails() {
      setLoading(true);
      try {
        const res = await studySetsService.getOne(studySetId);
        const originalQuestions = res.data?.questions || [];
        setStudySet(res.data || null);

        if (!isGuest) {
          // Fetch my sessions to determine status of questions
          try {
            const sessionsRes = await studySetsService.listMySessions();
            const sessionsList = Array.isArray(sessionsRes) 
              ? sessionsRes 
              : (Array.isArray(sessionsRes?.data) ? sessionsRes.data : []);
              
            const mySessions = sessionsList.filter(s => s.study_set_id === studySetId && s.mode === "flashcard");
            
            if (mySessions.length > 0) {
              // Sort by started_at descending to find the latest session
              mySessions.sort((a, b) => new Date(b.started_at) - new Date(a.started_at));
              const latestSession = mySessions[0];
              setSessionId(latestSession.practice_attempt_id);
              
              const resultsRes = await studySetsService.getSessionResults(latestSession.practice_attempt_id);
              const answers = Array.isArray(resultsRes)
                ? resultsRes
                : (Array.isArray(resultsRes?.data?.answers)
                  ? resultsRes.data.answers
                  : Array.isArray(resultsRes?.data)
                    ? resultsRes.data
                    : Array.isArray(resultsRes?.answers)
                      ? resultsRes.answers
                      : []);

              const diffIds = new Set();
              const mastIds = new Set();
              answers.forEach(ans => {
                if (ans.review_status === "marked_for_retry") {
                  diffIds.add(ans.question_id);
                } else if (ans.review_status === "mastered") {
                  mastIds.add(ans.question_id);
                }
              });
              
              setDifficultQuestionIds(diffIds);
              setMasteredQuestionIds(mastIds);
              setQuestions(originalQuestions);
            } else {
              setQuestions(originalQuestions);
            }
          } catch (sessionErr) {
            console.error("Failed to load session progress:", sessionErr);
            setQuestions(originalQuestions);
          }
        } else {
          setQuestions(originalQuestions);
        }
        setError(null);
      } catch (err) {
        console.error("Failed to load study set details:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    loadDetails();
  }, [studySetId, isGuest]);

  useEffect(() => {
    if (difficultQuestionIds.size === 0 && activeTab === "starred") {
      setActiveTab("all");
    }
  }, [difficultQuestionIds, activeTab]);

  // --- Click Star to Toggle Difficulty Directly ---
  const toggleDifficult = async (qId) => {
    if (isGuest) {
      setShowLoginModal(true);
      return;
    }

    try {
      let currentSessionId = sessionId;
      
      // Start session if none exists
      if (!currentSessionId) {
        const sessionRes = await studySetsService.startSession(studySetId, "flashcard");
        const newSessionId = sessionRes?.data?.practice_attempt_id || sessionRes?.practice_attempt_id;
        if (newSessionId) {
          currentSessionId = newSessionId;
          setSessionId(currentSessionId);
        } else {
          console.error("Failed to start session for toggling difficulty");
          return;
        }
      }

      const newDifficult = new Set(difficultQuestionIds);
      const newMastered = new Set(masteredQuestionIds);
      const isDiff = newDifficult.has(qId);
      const status = isDiff ? "unreviewed" : "marked_for_retry";

      if (isDiff) {
        newDifficult.delete(qId);
      } else {
        newDifficult.add(qId);
        newMastered.delete(qId); // If marked difficult, remove from mastered
      }
      
      setDifficultQuestionIds(newDifficult);
      setMasteredQuestionIds(newMastered);

      // Save progress to database
      await studySetsService.submitAnswer(currentSessionId, {
        question_id: qId,
        selected_answer_option_ids: [],
        is_correct: false,
        review_status: status
      });

    } catch (err) {
      console.error("Failed to toggle difficulty:", err);
    }
  };

  const toggleMastered = async (qId) => {
    if (isGuest) {
      setShowLoginModal(true);
      return;
    }

    try {
      let currentSessionId = sessionId;
      
      // Start session if none exists
      if (!currentSessionId) {
        const sessionRes = await studySetsService.startSession(studySetId, "flashcard");
        const newSessionId = sessionRes?.data?.practice_attempt_id || sessionRes?.practice_attempt_id;
        if (newSessionId) {
          currentSessionId = newSessionId;
          setSessionId(currentSessionId);
        } else {
          console.error("Failed to start session for toggling mastered");
          return;
        }
      }

      const newDifficult = new Set(difficultQuestionIds);
      const newMastered = new Set(masteredQuestionIds);
      const isMast = newMastered.has(qId);
      const status = isMast ? "unreviewed" : "mastered";

      if (isMast) {
        newMastered.delete(qId);
      } else {
        newMastered.add(qId);
        newDifficult.delete(qId); // If marked mastered, remove from difficult
      }
      
      setDifficultQuestionIds(newDifficult);
      setMasteredQuestionIds(newMastered);

      // Save progress to database
      await studySetsService.submitAnswer(currentSessionId, {
        question_id: currentSessionId,
        question_id: qId,
        selected_answer_option_ids: [],
        is_correct: !isMast,
        review_status: status
      });

    } catch (err) {
      console.error("Failed to toggle mastered:", err);
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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-3 text-foreground">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-muted-foreground font-medium">Loading study set...</p>
      </div>
    );
  }

  if (error || !studySet) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-4 text-foreground">
        <HelpCircle className="size-12 text-destructive" />
        <h2 className="text-xl font-bold">Study Set Not Found</h2>
        <p className="text-sm text-muted-foreground max-w-sm">We couldn't retrieve this study set. It may have been deleted, set to private, or you don't have access.</p>
        <Button onClick={() => router.push(isGuest ? "/" : "/learner/study-sets")}>
          {isGuest ? "Back to Homepage" : "Back to My Study Sets"}
        </Button>
      </div>
    );
  }

  const hasAssigned = !isGuest && studySet.study_set_assignments && studySet.study_set_assignments.length > 0;

  // Filter questions based on tabs and category
  const stillLearningQuestions = questions.filter(
    (q) => !masteredQuestionIds.has(q.question_id) && 
    (activeTab !== "starred" || difficultQuestionIds.has(q.question_id))
  );

  const masteredQuestions = questions.filter(
    (q) => masteredQuestionIds.has(q.question_id) && 
    (activeTab !== "starred" || difficultQuestionIds.has(q.question_id))
  );

  const renderContent = () => (
    <main className="min-h-full bg-background text-foreground px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        
        <StudySetHeader 
          studySet={studySet}
          onBack={() => router.push(backHref)}
          backLabel={backLabel}
          hasAssigned={hasAssigned}
        />

        {/* STUDY MODE SELECTORS */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-1.5">
            <span>Select Study Mode</span>
          </h2>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <StudyModeCard 
              title="Flashcards"
              description="Rotate cards to check terms, mark difficult cards, and review key definitions at your own pace."
              icon={BookOpen}
              onClick={() => router.push(flashcardHref)}
            />

            <StudyModeCard 
              title="Practice Quiz"
              description="Challenge yourself with multiple-choice questions under test conditions and calculate your mastery score."
              icon={FileQuestion}
              onClick={handleQuizClick}
              isLocked={isGuest}
              lockLabel="Login Required"
              hoverBorderClass="hover:border-emerald-500/50"
              bgCircleClass="bg-emerald-50/40 group-hover:bg-emerald-100/10"
            />
          </div>
        </div>

        {/* QUESTION PREVIEW LIST */}
        <div className="space-y-6 pt-6 border-t border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-foreground">
              Study Set Cards ({questions.length})
            </h2>

            {/* Segment control tabs (All / Starred) - Only for logged-in learner with difficult questions */}
            {!isGuest && difficultQuestionIds.size > 0 && (
              <div className="flex bg-neutral-100 p-1 rounded-2xl w-fit border border-neutral-200">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-6 py-1.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                    activeTab === "all"
                      ? "bg-white text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setActiveTab("starred")}
                  className={`px-6 py-1.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                    activeTab === "starred"
                      ? "bg-white text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Starred
                </button>
              </div>
            )}
          </div>

          <div className="space-y-8">
            {isGuest ? (
              // Simple order rendering for Guest users
              <div className="space-y-3">
                {questions.length > 0 ? (
                  <div className="space-y-3">
                    {questions.map((q, idx) => (
                      <QuestionCard 
                        key={q.question_id}
                        question={q}
                        index={idx}
                        isDifficult={false}
                        isMastered={false}
                        onToggleDifficult={() => setShowLoginModal(true)}
                        onToggleMastered={() => setShowLoginModal(true)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic pl-1">No cards in this section.</p>
                )}
              </div>
            ) : (
              // Structured category rendering for Learner progress
              <>
                {/* Still learning list */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                    Still learning ({stillLearningQuestions.length})
                  </h3>
                  {stillLearningQuestions.length > 0 ? (
                    <div className="space-y-3">
                      {stillLearningQuestions.map((q) => {
                        const originalIdx = questions.findIndex(item => item.question_id === q.question_id);
                        return (
                          <QuestionCard 
                            key={q.question_id}
                            question={q}
                            index={originalIdx}
                            isDifficult={difficultQuestionIds.has(q.question_id)}
                            isMastered={false}
                            onToggleDifficult={() => toggleDifficult(q.question_id)}
                            onToggleMastered={() => toggleMastered(q.question_id)}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic pl-1">No cards in this section.</p>
                  )}
                </div>

                {/* Mastered list */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                    Mastered ({masteredQuestions.length})
                  </h3>
                  {masteredQuestions.length > 0 ? (
                    <div className="space-y-3">
                      {masteredQuestions.map((q) => {
                        const originalIdx = questions.findIndex(item => item.question_id === q.question_id);
                        return (
                          <QuestionCard 
                            key={q.question_id}
                            question={q}
                            index={originalIdx}
                            isDifficult={difficultQuestionIds.has(q.question_id)}
                            isMastered={true}
                            onToggleDifficult={() => toggleDifficult(q.question_id)}
                            onToggleMastered={() => toggleMastered(q.question_id)}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic pl-1">No cards in this section.</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </main>
  );

  return (
    <>
      {showNavbar ? (
        <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
          <Navbar />
          <div className="min-h-0 flex-1 overflow-y-auto">
            {renderContent()}
          </div>
        </div>
      ) : (
        renderContent()
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
export default StudySetDetailView;
