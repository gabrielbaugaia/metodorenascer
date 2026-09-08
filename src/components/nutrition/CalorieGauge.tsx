interface CalorieGaugeProps {
  consumed: number;
  target: number;
  remaining: number;
}

export function CalorieGauge({ consumed, target, remaining }: CalorieGaugeProps) {
  const pct = target > 0 ? Math.min((consumed / target) * 100, 100) : 0;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {[
          ["Consumido", consumed],
          ["Meta", target],
          ["Restante", remaining],
        ].map(([label, value]) => (
          <div key={String(label)} className="min-w-0">
            <p className="text-xl font-bold text-foreground tabular-nums sm:text-2xl">{Math.round(Number(value))}</p>
            <p className="mt-1 text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-muted-foreground">{Math.round(pct)}% da meta diária de calorias</p>
    </div>
  );
}
