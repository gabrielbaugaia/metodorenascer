import { Flame, Clock, MapPin, Calendar } from "lucide-react";

interface CardioStats {
  totalSessions: number;
  totalMinutes: number;
  totalKm: number;
  totalCalories: number;
}

export function CardioStatsHeader({ stats }: { stats: CardioStats }) {
  const kpis = [
    { label: "Sessões", value: stats.totalSessions, icon: Calendar, suffix: "" },
    { label: "Minutos", value: stats.totalMinutes, icon: Clock, suffix: "min" },
    { label: "Distância", value: stats.totalKm.toFixed(1), icon: MapPin, suffix: "km" },
    { label: "Calorias", value: stats.totalCalories, icon: Flame, suffix: "kcal" },
  ];

  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[var(--shadow-soft)] md:grid-cols-4">
      {kpis.map((kpi) => (
        <div key={kpi.label} className="flex min-w-0 items-center gap-3 border-b border-r border-border/70 p-4 last:border-r-0 md:p-5">
          <div className="rounded-xl bg-primary/10 p-2.5">
            <kpi.icon className="h-4 w-4 text-primary" strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <p className="metric-label truncate">{kpi.label}</p>
            <p className="mt-1 text-xl font-bold text-foreground tabular-nums">
              {kpi.value}
              {kpi.suffix && <span className="text-xs font-normal text-muted-foreground ml-1">{kpi.suffix}</span>}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
