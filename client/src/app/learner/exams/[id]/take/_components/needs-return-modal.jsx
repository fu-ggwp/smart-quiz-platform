import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NeedsReturnModal({ open, onReturn }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/55 p-6">
      <section className="w-full max-w-md border border-amber-300 bg-white p-5 text-center shadow-xl">
        <AlertTriangle className="mx-auto size-8 text-amber-600" />
        <h2 className="mt-3 text-lg font-bold text-slate-800">Return to exam screen</h2>
        <p className="mt-2 text-sm text-slate-600">
          The exam must stay fullscreen and active. Click below to continue.
        </p>
        <Button className="mt-5 rounded-sm" onClick={onReturn}>
          Return to exam
        </Button>
      </section>
    </div>
  );
}
