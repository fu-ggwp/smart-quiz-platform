import { Menu, Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";

export function TakeHeader({ onChangeFontScale }) {
  const [timeString, setTimeString] = useState("");

  useEffect(() => {
    setTimeString(new Date().toLocaleTimeString());
    const interval = setInterval(() => {
      setTimeString(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4 shadow-sm">
      <div className="flex items-center gap-4 text-muted-foreground">
        <Menu className="size-5" />
        <span className="text-sm font-semibold">Smart Quiz Platform</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{timeString}</span>
        <button
          className="grid size-8 place-items-center border border-border bg-card text-foreground hover:bg-background"
          onClick={() => onChangeFontScale(-0.1)}
          title="Decrease font size"
          type="button"
        >
          <Minus className="size-4" />
        </button>
        <button
          className="grid size-8 place-items-center border border-border bg-card text-foreground hover:bg-background"
          onClick={() => onChangeFontScale(0.1)}
          title="Increase font size"
          type="button"
        >
          <Plus className="size-4" />
        </button>
      </div>
    </header>
  );
}
