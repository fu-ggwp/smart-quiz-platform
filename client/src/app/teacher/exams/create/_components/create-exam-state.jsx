import { Loader2 } from "lucide-react";

export function CreateExamLoadingState() {
  return (
    <StatePanel
      icon={<Loader2 className="size-5 animate-spin" />}
      title="Loading exam form"
      description="Fetching your classes and question banks."
    />
  );
}

function StatePanel({ description, icon, title }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
      <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon}
      </div>
      <h2 className="text-base font-bold text-foreground">{title}</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
