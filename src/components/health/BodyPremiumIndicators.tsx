import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { computeBodyIndicators, DayLog } from "@/lib/bodyIndicators";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, TrendingUp, Zap, ArrowUp, ArrowDown, Minus, Activity } from "lucide-react";

interface Props {
  userId: string;
}

const arrowIcons: Record<string, React.ElementType> = {
  "arrow-up": ArrowUp,
  "arrow-down": ArrowDown,
  minus: Minus,
  activity: Activity,
};

export function BodyPremiumIndicators({ userId }: Props) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const since = sevenDaysAgo.toISOString().split("T")[0];

  const { data: indicators, isLoading } = useQuery({
    queryKey: ["body-indicators", userId],
    queryFn: async () => {
      const [healthRes, manualRes] = await Promise.all([
        supabase
          .from("health_daily")
          .select("date, sleep_minutes, steps, active_calories, resting_hr, hrv_ms")
          .eq("user_id", userId)
          .gte("date", since)
          .order("date"),
        supabase
          .from("manual_day_logs")
          .select("date, sleep_hours, stress_level, energy_focus, trained_today")
          .eq("user_id", userId)
          .gte("date", since)
          .order("date"),
      ]);

      // Build map by date
      const map = new Map<string, DayLog>();

      // Fill 7 day slots
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        map.set(d.toISOString().split("T")[0], {});
      }

      // Manual first (lower priority)
      for (const row of manualRes.data ?? []) {
        const existing = map.get(row.date) ?? {};
        map.set(row.date, {
          ...existing,
          sleep_hours: row.sleep_hours,
          stress_level: row.stress_level,
          energy_focus: row.energy_focus,
          trained_today: row.trained_today,
        });
      }

      // Automatic overrides (higher priority)
      for (const row of healthRes.data ?? []) {
        const existing = map.get(row.date) ?? {};
        const sleepHours = row.sleep_minutes ? row.sleep_minutes / 60 : existing.sleep_hours;
        map.set(row.date, {
          ...existing,
          sleep_hours: sleepHours ?? existing.sleep_hours,
          steps: row.steps ?? existing.steps,
          active_calories: row.active_calories ?? existing.active_calories,
          resting_hr: row.resting_hr ?? existing.resting_hr,
          hrv_ms: row.hrv_ms ?? existing.hrv_ms,
        });
      }

      // Convert to ordered array (oldest first)
      const sorted = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
      return computeBodyIndicators(sorted.map(([, v]) => v));
    },
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[72px] rounded-xl" />
        ))}
      </div>
    );
  }

  if (!indicators) return null;

  const chips = [
    {
      icon: CheckCircle,
      title: "Consistência",
      value: indicators.consistencyPercent != null ? `${indicators.consistencyPercent}%` : "—",
      legend: indicators.hasEnoughData ? "últimos 7 dias" : "complete 3 dias para ativar",
      hasData: indicators.consistencyPercent != null,
    },
    {
      icon: TrendingUp,
      title: "Recuperação",
      value: indicators.recoveryTrendLabel ?? "—",
      legend: indicators.hasEnoughData ? "tendência" : "complete 3 dias para ativar",
      hasData: indicators.recoveryTrendLabel != null,
      arrowKey: indicators.recoveryTrendArrow,
    },
    {
      icon: Zap,
      title: "Capacidade atual",
      value: indicators.capacityLabel ?? "—",
      legend: indicators.hasEnoughData ? "últimos 3 dias" : "complete 3 dias para ativar",
      hasData: indicators.capacityLabel != null,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {chips.map((chip) => {
        const ArrowIcon = chip.arrowKey ? arrowIcons[chip.arrowKey] : null;
        return (
          <div
            key={chip.title}
            className="bg-card border border-border/50 rounded-xl px-4 py-3 flex items-start gap-3"
          >
            <chip.icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground leading-none mb-1">{chip.title}</p>
              <p className={`text-base font-semibold leading-tight flex items-center gap-1 ${chip.hasData ? "text-primary" : "text-muted-foreground"}`}>
                {chip.value}
                {ArrowIcon && chip.hasData && (
                  <ArrowIcon className="h-3.5 w-3.5" strokeWidth={2} />
                )}
              </p>
              <p className="text-[10px] text-muted-foreground/70 mt-0.5 leading-none">{chip.legend}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
