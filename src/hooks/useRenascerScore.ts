import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, subDays } from "date-fns";

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

function calcScore(log: DayLog, yesterdayLog: DayLog | null): number {
  let s = 100;
  const sleep = log.sleep_hours ?? 7;
  if (sleep < 5) s -= 35;
  else if (sleep < 6) s -= 20;
  else if (sleep < 7) s -= 10;

  const stress = log.stress_level ?? 30;
  if (stress > 80) s -= 20;
  else if (stress > 60) s -= 10;

  const energy = log.energy_focus ?? 3;
  if (energy === 1) s -= 25;
  else if (energy === 2) s -= 15;
  else if (energy === 3) s -= 5;
  else if (energy === 5) s += 5;

  if (yesterdayLog?.trained_today) {
    const rpe = yesterdayLog.rpe ?? 5;
    if (rpe >= 8) s -= 15;
    else if (rpe >= 5) s -= 10;
    else s -= 5;
  }

  return Math.max(0, Math.min(100, s));
}

function classify(score: number) {
  if (score >= 85) return { classification: "ELITE" as const, statusText: "PRONTO PARA EVOLUIR" };
  if (score >= 65) return { classification: "ALTO" as const, statusText: "TREINAR COM CONTROLE" };
  if (score >= 40) return { classification: "MODERADO" as const, statusText: "RECUPERAR" };
  return { classification: "RISCO" as const, statusText: "REDUZIR CARGA" };
}

function getRecommendation(classification: string): string[] {
  switch (classification) {
    case "ELITE":
      return ["Treino intenso", "Volume: 100% do programado", "RPE até 9 — pode buscar falha"];
    case "ALTO":
      return ["Treino moderado", "Volume: 80% do programado", "RPE até 7 — evitar falha"];
    case "MODERADO":
      return ["Treino leve + técnica", "Volume: 50-60%", "RPE até 5 — foco em execução"];
    default:
      return ["Recuperação ativa", "Mobilidade + caminhada leve", "Sem carga — priorize descanso"];
  }
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
