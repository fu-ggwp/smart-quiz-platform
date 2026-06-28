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
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm">
      <div className="flex items-center gap-4 text-slate-600">
        <Menu className="size-5" />
        <span className="text-sm font-semibold">Smart Quiz Platform</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span>{timeString}</span>
        <button
          className="grid size-8 place-items-center border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          onClick={() => onChangeFontScale(-0.1)}
          title="Decrease font size"
          type="button"
        >
          <Minus className="size-4" />
        </button>
        <button
          className="grid size-8 place-items-center border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
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
