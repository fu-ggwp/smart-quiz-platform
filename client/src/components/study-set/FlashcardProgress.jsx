"use client";

import React from "react";

export default function FlashcardProgress({ progressPercent, savingProgress }) {
  return (
    <div className="space-y-1.5">
      {/* Khung thanh Progress */}
      <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden border border-border">
        <div 
          className="bg-primary h-full transition-all duration-300 rounded-full"
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>
      
      {/* Thông tin Text bên dưới */}
      <div className="flex justify-between text-[10px] text-muted-foreground font-semibold px-0.5">
        <span>Progress: {progressPercent}%</span>
        {savingProgress && (
          <span className="animate-pulse text-primary font-bold">
            Autosaving progress...
          </span>
        )}
      </div>
    </div>
  );
}
