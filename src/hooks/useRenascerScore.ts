import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, subDays } from "date-fns";
import { calcScore, classify, getRecommendation } from "@/lib/renascerScoreCalc";

interface DayLog {
  date: string;
  sleep_hours: number | null;
  stress_level: number | null;
  energy_focus: number | null;
  trained_today: boolean | null;
  rpe: number | null;
}

export interface RenascerScore {
  score: number;
  classification: "ELITE" | "ALTO" | "MODERADO" | "RISCO";
  statusText: string;
  trend: "up" | "down" | "stable";
  trendText: string;
  recommendation: string[];
  todayLog: DayLog | null;
  scores7d: { date: string; score: number }[];
  isLoading: boolean;
}

export function useRenascerScore(): RenascerScore {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["renascer-score", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const sevenDaysAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");

      const { data: logs } = await supabase
        .from("manual_day_logs")
        .select("date, sleep_hours, stress_level, energy_focus, trained_today, rpe")
        .eq("user_id", user!.id)
        .gte("date", sevenDaysAgo)
        .lte("date", today)
        .order("date", { ascending: true });

      return (logs ?? []) as DayLog[];
    },
  });

  const logs = data ?? [];
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const yesterdayStr = format(subDays(new Date(), 1), "yyyy-MM-dd");

  const todayLog = logs.find((l) => l.date === todayStr) ?? null;
  const yesterdayLog = logs.find((l) => l.date === yesterdayStr) ?? null;

  // Compute per-day scores for sparkline
  const scores7d = logs.map((log, i) => {
    const prev = i > 0 ? logs[i - 1] : null;
    return { date: log.date, score: calcScore(log, prev) };
  });

  const score = todayLog ? calcScore(todayLog, yesterdayLog) : 0;
  const { classification, statusText } = classify(score);

  // Trend: compare last 3 vs previous 3
  let trend: "up" | "down" | "stable" = "stable";
  let trendText = "Seu corpo está estável";
  if (scores7d.length >= 4) {
    const recent = scores7d.slice(-3);
    const older = scores7d.slice(-6, -3);
    if (older.length > 0) {
      const avgRecent = recent.reduce((a, b) => a + b.score, 0) / recent.length;
      const avgOlder = older.reduce((a, b) => a + b.score, 0) / older.length;
      if (avgRecent - avgOlder >= 5) {
        trend = "up";
        trendText = "Seu corpo está melhorando";
      } else if (avgOlder - avgRecent >= 5) {
        trend = "down";
        trendText = "Seu corpo está pedindo recuperação";
      }
    }
  }

  return {
    score,
    classification,
    statusText,
    trend,
    trendText,
    recommendation: getRecommendation(classification),
    todayLog,
    scores7d,
    isLoading,
  };
}
