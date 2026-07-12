import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ConfirmExitModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center space-y-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <div className="size-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
          <AlertTriangle size={32} />
        </div>
        <div className="space-y-2">
          <h4 className="text-lg font-bold text-foreground">Exit Practice Quiz?</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Are you sure you want to exit? If you exit now, this attempt will be marked as incomplete. You will need to start a new attempt from the beginning to retake it.
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1 rounded-xl" 
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive"
            className="flex-1 rounded-xl bg-destructive text-white hover:bg-destructive/90" 
            onClick={onConfirm}
          >
            Yes, Exit
          </Button>
        </div>
      </div>
    </div>
  );
}
