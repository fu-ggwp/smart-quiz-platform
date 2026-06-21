"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Info, CheckCircle, HelpCircle, X } from "lucide-react";

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  variant = "info", // "info" | "warning" | "danger" | "success"
  isDangerous = false, // backward compatibility
}) {
  if (!isOpen) return null;

  // Resolve variant if isDangerous is passed
  const resolvedVariant = isDangerous ? "danger" : variant;

  // Icon selection based on variant
  const Icon = {
    danger: AlertTriangle,
    warning: AlertTriangle,
    success: CheckCircle,
    info: Info,
  }[resolvedVariant] || HelpCircle;

  // Variant themes
  const themes = {
    danger: {
      text: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-50 dark:bg-rose-950/30",
      border: "border-rose-100 dark:border-rose-900/50",
      button: "bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500",
    },
    warning: {
      text: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/30",
      border: "border-amber-100 dark:border-amber-900/50",
      button: "bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500",
    },
    success: {
      text: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      border: "border-emerald-100 dark:border-emerald-900/50",
      button: "bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500",
    },
    info: {
      text: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/30",
      border: "border-blue-100 dark:border-blue-900/50",
      button: "bg-primary hover:bg-primary/90 text-primary-foreground focus:ring-ring",
    },
  };

  const currentTheme = themes[resolvedVariant] || themes.info;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-xl rounded-2xl bg-card border border-border p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200 space-y-6">
        {/* Close Button */}
        <button
          onClick={onCancel}
          type="button"
          className="absolute top-5 right-5 text-muted-foreground hover:text-foreground rounded-lg p-1 hover:bg-muted transition-colors"
        >
          <X className="size-5" />
        </button>

        {/* Content Section */}
        <div className="flex gap-5 items-start pr-6">
          <div className={`shrink-0 ${currentTheme.text}`}>
            <Icon className="size-8 mt-0.5" />
          </div>
          <div className="space-y-2 flex-1">
            <h3 className="text-xl font-extrabold text-foreground">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            onClick={onCancel}
            variant="outline"
            type="button"
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={onConfirm}
            type="button"
            className={currentTheme.button}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
