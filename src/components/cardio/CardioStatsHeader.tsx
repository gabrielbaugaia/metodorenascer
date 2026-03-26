import { Card } from "@/components/ui/card";
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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {kpis.map((kpi) => (
        <Card key={kpi.label} className="p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <kpi.icon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{kpi.label}</p>
            <p className="text-lg font-bold text-foreground">
              {kpi.value}
              {kpi.suffix && <span className="text-xs font-normal text-muted-foreground ml-1">{kpi.suffix}</span>}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
}
