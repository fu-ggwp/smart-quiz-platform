import { RotateCcw, ArrowLeft, Award } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ResultDashboard({ session, totalQuestions, onRetake, onBack }) {
  const score = parseFloat(session?.total_score) || 0;
  const maxScore = parseFloat(session?.max_score) || totalQuestions || 1;
  const accuracy = Math.round((score / maxScore) * 100) || 0;

  // Tính chu vi hình tròn SVG (2 * PI * r) với r = 50 -> chu vi ~ 314.16
  const strokeDashoffset = 314.16 - (314.16 * accuracy) / 100;

  return (
    <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 size-40 bg-primary/5 rounded-full blur-3xl -z-10"></div>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Biểu đồ tròn SVG */}
        <div className="relative size-32 shrink-0 flex items-center justify-center">
          <svg className="size-full transform -rotate-90">
            <circle 
              cx="64" 
              cy="64" 
              r="50" 
              stroke="var(--color-muted)" 
              strokeWidth="10" 
              fill="transparent" 
            />
            <circle 
              cx="64" 
              cy="64" 
              r="50" 
              stroke={accuracy >= 50 ? "#10B981" : "#EF4444"} 
              strokeWidth="10" 
              fill="transparent" 
              strokeDasharray="314.16"
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-extrabold text-foreground">{accuracy}%</span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Accuracy</span>
          </div>
        </div>

        {/* Thông tin kết quả bằng chữ */}
        <div className="space-y-2 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-primary">
            <Award size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">Practice Finished</span>
          </div>
          <h2 className="text-2xl font-extrabold text-foreground">
            {accuracy >= 80 ? "Excellent Work!" : accuracy >= 50 ? "Good Job!" : "Keep Practicing!"}
          </h2>
          <p className="text-sm text-muted-foreground">
            You scored <strong className="text-foreground">{score}</strong> out of <strong className="text-foreground">{maxScore}</strong> points.
          </p>
        </div>
      </div>

      {/* Nút hành động */}
      <div className="flex flex-row md:flex-col gap-3 w-full md:w-auto shrink-0">
        <Button 
          onClick={onRetake}
          className="flex-1 md:w-44 font-bold rounded-xl py-3 gap-2 transition-all shadow-sm"
        >
          <RotateCcw size={16} />
          <span>Retake Quiz</span>
        </Button>
        <Button 
          variant="outline"
          onClick={onBack}
          className="flex-1 md:w-44 font-semibold rounded-xl py-3 gap-2 transition-all"
        >
          <ArrowLeft size={16} />
          <span>Back to Study Set</span>
        </Button>
      </div>
    </div>
  );
}