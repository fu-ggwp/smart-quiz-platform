"use client";

import React, { useEffect, useState } from "react";
import { X, CheckCircle, AlertTriangle, Info } from "lucide-react";

export default function ToastNotification({ message, type = "success", duration = 5000, onClose }) {
  const [slideIn, setSlideIn] = useState(false);
  const [progress, setProgress] = useState(100);

  const handleDismiss = React.useCallback(() => {
    setSlideIn(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 400);
  }, [onClose]);

  useEffect(() => {
    if (!message) return;

    const animTimer = setTimeout(() => {
      setSlideIn(true);
      setProgress(100);
    }, 0);

    // Auto close timer
    const closeTimer = setTimeout(() => {
      handleDismiss();
    }, duration);

    // Progress bar countdown
    const intervalTime = 50;
    const steps = duration / intervalTime;
    const decrement = 100 / steps;
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(progressInterval);
          return 0;
        }
        return prev - decrement;
      });
    }, intervalTime);

    return () => {
      clearTimeout(animTimer);
      clearTimeout(closeTimer);
      clearInterval(progressInterval);
    };
  }, [message, duration, handleDismiss]);

  if (!message) return null;

  const bgClass =
    type === "success"
      ? "bg-emerald-50 border-emerald-200 text-emerald-950 shadow-emerald-100/50"
      : type === "error"
      ? "bg-rose-50 border-rose-200 text-rose-950 shadow-rose-100/50"
      : "bg-amber-50 border-amber-200 text-amber-950 shadow-amber-100/50";

  const progressBgClass =
    type === "success" ? "bg-emerald-500" : type === "error" ? "bg-rose-500" : "bg-amber-500";

  const Icon =
    type === "success"
      ? CheckCircle
      : type === "error"
      ? AlertTriangle
      : Info;

  const iconColorClass =
    type === "success" ? "text-emerald-600" : type === "error" ? "text-rose-600" : "text-amber-600";

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex max-w-sm w-full overflow-hidden rounded-xl border p-4 shadow-lg ${bgClass}`}
      style={{
        transform: slideIn ? "translateX(0)" : "translateX(120%)",
        transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease",
        opacity: slideIn ? 1 : 0,
      }}
    >
      <div className="flex gap-3 items-start w-full">
        <Icon className={`size-5 shrink-0 mt-0.5 ${iconColorClass}`} />
        <div className="flex-1 space-y-1">
          <p className="text-sm font-semibold leading-none capitalize">{type}</p>
          <p className="text-xs opacity-90 break-words leading-relaxed">
            {message}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground shrink-0 rounded-lg p-0.5 hover:bg-black/5"
        >
          <X className="size-4" />
        </button>
      </div>
      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5">
        <div
          className={`h-full ${progressBgClass}`}
          style={{
            width: `${progress}%`,
            transition: "width 50ms linear",
          }}
        />
      </div>
    </div>
  );
}
