import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ConfirmExitModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-neutral-100 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center space-y-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <div className="size-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto animate-bounce">
          <AlertTriangle size={32} />
        </div>
        <div className="space-y-2">
          <h4 className="text-lg font-bold text-neutral-900">Exit Practice Quiz?</h4>
          <p className="text-sm text-neutral-500 leading-relaxed">
            Are you sure you want to exit? If you exit now, this attempt will be marked as incomplete. You will need to start a new attempt from the beginning to retake it.
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1 border-neutral-200 hover:bg-neutral-50 rounded-xl" 
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button 
            className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl" 
            onClick={onConfirm}
          >
            Yes, Exit
          </Button>
        </div>
      </div>
    </div>
  );
}
