import { ChevronRight, Lock } from "lucide-react";

export function StudyModeCard({
  title,
  description,
  icon: Icon,
  onClick,
  isLocked = false,
  lockLabel = "Login Required",
  hoverBorderClass = "hover:border-primary/50",
  bgCircleClass = "bg-primary/5 group-hover:bg-primary/10"
}) {
  return (
    <div 
      onClick={onClick}
      className={`group relative overflow-hidden rounded-3xl border border-border bg-card p-6 ${hoverBorderClass} transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md`}
    >
      <div className={`absolute top-0 right-0 size-28 ${bgCircleClass} rounded-full blur-2xl transition-all duration-300`}></div>
      
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div className="size-12 rounded-2xl bg-muted/50 text-foreground/80 flex items-center justify-center border border-border">
            <Icon className="size-6" />
          </div>
          {isLocked && (
            <span className="text-[10px] font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-full flex items-center gap-1 border border-border shadow-sm">
              <Lock size={10} />
              <span>{lockLabel}</span>
            </span>
          )}
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1">
            <span>{title}</span>
            <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed mt-1">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
