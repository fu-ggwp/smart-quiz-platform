"use client";

import React, { useState, useEffect } from "react";
import { Star, CheckCircle } from "lucide-react";

export default function Flashcard({ 
  question, 
  isFlipped, 
  onFlip,
  isDifficult,
  isMastered,
  onToggleDifficult,
  onMarkMastered
}) {
  const [rotation, setRotation] = useState(0);
  const [transitionEnabled, setTransitionEnabled] = useState(true);

  // Track isFlipped changes to accumulate rotation in one direction (-180deg increments)
  useEffect(() => {
    setRotation((prev) => {
      const currentIsOdd = Math.abs(prev / 180) % 2 === 1;
      if (isFlipped === currentIsOdd) {
        return prev;
      }
      return prev - 180;
    });
  }, [isFlipped]);

  // Reset rotation to 0 instantly when question changes without the rapid spin transition
  useEffect(() => {
    setTransitionEnabled(false);
    setRotation(0);
    const timer = setTimeout(() => {
      setTransitionEnabled(true);
    }, 50);
    return () => clearTimeout(timer);
  }, [question?.question_id]);

  const options = question.answer_options || question.options || [];

  return (
    <div 
      onClick={onFlip}
      className="relative w-full aspect-[1.6] max-w-2xl cursor-pointer group [perspective:1000px]"
      title="Click card to flip"
    >
      <div 
        className={`w-full h-full rounded-3xl border border-border bg-card relative [transform-style:preserve-3d] ${
          transitionEnabled ? "transition-transform duration-500" : ""
        }`}
        style={{ transform: `rotateX(${rotation}deg)` }}
      >
        
        {/* MẶT TRƯỚC (CÂU HỎI) */}
        <div className="absolute inset-0 w-full h-full p-8 flex flex-col justify-between rounded-3xl [backface-visibility:hidden] bg-card">
          {/* Top Row: Star & Check icons */}
          <div className="flex justify-end items-center">
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={() => onToggleDifficult(question.question_id)}
                className={`p-2 hover:bg-muted rounded-full transition-colors`}
                title={isDifficult ? "Marked as Difficult" : "Mark as Difficult"}
              >
                <Star className={`size-5 ${isDifficult ? "fill-amber-400 text-amber-500" : "text-neutral-300"}`} />
              </button>
              <button 
                onClick={() => onMarkMastered(question.question_id)}
                className={`p-2 hover:bg-muted rounded-full transition-colors`}
                title={isMastered ? "Marked as Mastered" : "Mark as Mastered"}
              >
                <CheckCircle className={`size-5 ${isMastered ? "fill-emerald-500 text-emerald-600" : "text-neutral-300"}`} />
              </button>
            </div>
          </div>

          {/* Question Text */}
          <div className="flex-1 flex items-center justify-center text-center">
            <p className="text-2xl md:text-3xl font-extrabold leading-relaxed max-h-[85%] overflow-y-auto pr-1 text-foreground">
              {question?.question_text}
            </p>
          </div>
          
          {/* Empty bottom to match user instructions */}
          <div className="h-6"></div>
        </div>

        {/* MẶT SAU (ĐÁP ÁN & GIẢI THÍCH) */}
        <div className="absolute inset-0 w-full h-full p-8 flex flex-col justify-between rounded-3xl [backface-visibility:hidden] bg-card [transform:rotateX(-180deg)]">
          {/* Top Row: Star & Check icons */}
          <div className="flex justify-end items-center">
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={() => onToggleDifficult(question.question_id)}
                className={`p-2 hover:bg-muted rounded-full transition-colors`}
                title={isDifficult ? "Marked as Difficult" : "Mark as Difficult"}
              >
                <Star className={`size-5 ${isDifficult ? "fill-amber-400 text-amber-500" : "text-neutral-300"}`} />
              </button>
              <button 
                onClick={() => onMarkMastered(question.question_id)}
                className={`p-2 hover:bg-muted rounded-full transition-colors`}
                title={isMastered ? "Marked as Mastered" : "Mark as Mastered"}
              >
                <CheckCircle className={`size-5 ${isMastered ? "fill-emerald-500 text-emerald-600" : "text-neutral-300"}`} />
              </button>
            </div>
          </div>

          {/* Answers & Explanation */}
          <div className="flex-1 flex flex-col justify-center space-y-4 max-h-[85%] overflow-y-auto pr-1">
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Correct Answer(s):</span>
              <div className="space-y-1">
                {options.filter(opt => opt.is_correct).map((opt, i) => (
                  <p key={i} className="text-lg md:text-xl font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-xl">
                    ✓ {opt.option_text}
                  </p>
                ))}
              </div>
            </div>

            {question.explanation && (
              <div className="space-y-1 border-t border-border pt-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Explanation:</span>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed italic">
                  {question.explanation}
                </p>
              </div>
            )}
          </div>
          
          {/* Empty bottom */}
          <div className="h-6"></div>
        </div>

      </div>
    </div>
  );
}
