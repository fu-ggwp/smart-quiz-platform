"use client";

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
      text: "text-error dark:text-error",
      bg: "bg-error/10 dark:bg-error/10",
      border: "border-error/20 dark:border-error/30",
      button: "bg-error hover:bg-error/90 text-primary-foreground focus:ring-error",
    },
    warning: {
      text: "text-warning dark:text-warning",
      bg: "bg-warning/10 dark:bg-warning/10",
      border: "border-warning/20 dark:border-warning/30",
      button: "bg-warning hover:bg-warning/90 text-primary-foreground focus:ring-warning",
    },
    success: {
      text: "text-success dark:text-success",
      bg: "bg-success/10 dark:bg-success/10",
      border: "border-success/20 dark:border-success/30",
      button: "bg-success hover:bg-success/90 text-primary-foreground focus:ring-success",
    },
    info: {
      text: "text-info dark:text-info",
      bg: "bg-info/10 dark:bg-info/10",
      border: "border-info/20 dark:border-info/30",
      button: "bg-primary hover:bg-primary/90 text-primary-foreground focus:ring-ring",
    },
  };

  const currentTheme = themes[resolvedVariant] || themes.info;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral/60 backdrop-blur-sm px-4">
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
