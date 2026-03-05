interface CalorieGaugeProps {
  consumed: number;
  target: number;
  remaining: number;
}

export function CalorieGauge({ consumed, target, remaining }: CalorieGaugeProps) {
  const pct = target > 0 ? Math.min((consumed / target) * 100, 100) : 0;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  const color = pct > 100 ? "text-red-400" : pct > 85 ? "text-yellow-500" : "text-primary";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={`transition-all duration-700 ${color}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-foreground">{Math.round(consumed)}</span>
          <span className="text-[10px] text-muted-foreground">/ {Math.round(target)} kcal</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 text-center w-full">
        <div>
          <p className="text-lg font-bold text-foreground">{Math.round(consumed)}</p>
          <p className="text-[10px] text-muted-foreground">Consumido</p>
        </div>
        <div>
          <p className="text-lg font-bold text-foreground">{Math.round(target)}</p>
          <p className="text-[10px] text-muted-foreground">Meta</p>
        </div>
        <div>
          <p className="text-lg font-bold text-primary">{Math.round(remaining)}</p>
          <p className="text-[10px] text-muted-foreground">Restante</p>
        </div>
      </div>
    </div>
  );
}
