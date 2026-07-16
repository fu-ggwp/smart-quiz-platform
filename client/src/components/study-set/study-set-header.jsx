import { ArrowLeft, Layers, User, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StudySetHeader({ studySet, onBack, backLabel = "Back", hasAssigned = false }) {
  const creatorName = studySet.teacher?.full_name || "Teacher";
  const formattedDate = new Date(studySet.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-4">
      <Button 
        onClick={onBack} 
        variant="ghost" 
        className="text-muted-foreground hover:text-foreground hover:bg-muted gap-2 pl-2"
      >
        <ArrowLeft className="size-4" />
        <span>{backLabel}</span>
      </Button>

      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full capitalize">
              {studySet.visibility?.replace("_", " ")}
            </span>
            {studySet.subject && (
              <span className="text-xs font-bold bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-border">
                <Layers size={10} />
                {studySet.subject}
              </span>
            )}
            {hasAssigned && (
              <span className="text-xs font-bold bg-warning/10 text-warning border border-warning/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <GraduationCap size={10} />
                Assigned
              </span>
            )}
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl truncate max-w-[300px] sm:max-w-[450px] md:max-w-[600px]" title={studySet.title}>
            {studySet.title}
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl">
            {studySet.description || "No description provided."}
          </p>
        </div>

        {/* Creator details */}
        <div className="flex items-center gap-3 bg-card border border-border p-3 rounded-2xl shrink-0 shadow-sm">
          <div className="size-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold">
            <User size={18} />
          </div>
          <div className="text-xs max-w-[120px] md:max-w-[180px]">
            <p className="text-muted-foreground">Created by</p>
            <p className="font-bold text-foreground truncate" title={creatorName}>{creatorName}</p>
            <p className="text-[10px] text-muted-foreground">{formattedDate}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
