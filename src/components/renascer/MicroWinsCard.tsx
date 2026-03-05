import { CheckCircle2, Circle } from "lucide-react";
import type { MicroWin } from "@/hooks/useBehaviorProfile";

interface Props {
  wins: MicroWin[];
}

export function MicroWinsCard({ wins }: Props) {
  const completedCount = wins.filter(w => w.done).length;
  if (wins.length === 0) return null;

  return (
    <div className="rounded-xl border border-border/50 bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Micro Vitórias de Hoje</h3>
        <span className="text-xs text-muted-foreground">{completedCount}/{wins.length}</span>
      </div>
      <div className="flex gap-3">
        {wins.map((win) => (
          <div key={win.type} className="flex items-center gap-1.5">
            {win.done ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground/40" />
            )}
            <span className={`text-xs ${win.done ? "text-foreground" : "text-muted-foreground"}`}>
              {win.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
