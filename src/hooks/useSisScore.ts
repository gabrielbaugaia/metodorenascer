import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, subDays } from "date-fns";
import type { SisAlert, SisClassification, SisScoreRow } from "@/lib/sisScoreCalc";

export interface SisScoreData {
  // Today
  score: number;
  classification: SisClassification;
  label: string;
  mechanical: number | null;
  recovery: number | null;
  structural: number | null;
  bodyComp: number | null;
  cognitive: number | null;
  consistency: number | null;
  alerts: SisAlert[];
  // Trends
  scores30d: { date: string; score: number }[];
  scores30dFull: SisScoreRow[];
  avg7: number;
  avg14: number;
  avg30: number;
  delta7vs30: number;
  // Streak
  currentStreak: number;
  bestStreak: number;
  // State
  hasTodayScore: boolean;
  isLoading: boolean;
}

export function useSisScore(): SisScoreData {
  const { user } = useAuth();
  const today = format(new Date(), "yyyy-MM-dd");
  const d30ago = format(subDays(new Date(), 30), "yyyy-MM-dd");

  const { data: scores, isLoading: scoresLoading } = useQuery({
    queryKey: ["sis-scores-30d", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("sis_scores_daily")
        .select("date, shape_intelligence_score, mechanical_score, recovery_score, structural_score, body_comp_score, cognitive_score, consistency_score, classification, alerts")
        .eq("user_id", user!.id)
        .gte("date", d30ago)
        .lte("date", today)
        .order("date", { ascending: true });
      return data ?? [];
    },
  });

  const { data: streak, isLoading: streakLoading } = useQuery({
    queryKey: ["sis-streak", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("sis_streaks")
        .select("current_streak, best_streak")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
  });

  const scoresList = scores ?? [];
  const todayRow = scoresList.find(s => s.date === today);
  const hasTodayScore = !!todayRow;

  const score = todayRow?.shape_intelligence_score ? Number(todayRow.shape_intelligence_score) : 0;

  let classification: SisClassification = "RISCO";
  let label = "Risco";
  if (todayRow?.classification) {
    const c = todayRow.classification;
    if (c === "Elite") { classification = "ELITE"; label = "Elite"; }
    else if (c === "Alta Performance") { classification = "ALTA_PERFORMANCE"; label = "Alta Performance"; }
    else if (c === "Moderado") { classification = "MODERADO"; label = "Moderado"; }
    else { classification = "RISCO"; label = "Risco"; }
  }

  const scores30d = scoresList
    .filter(s => s.shape_intelligence_score != null)
    .map(s => ({ date: s.date, score: Number(s.shape_intelligence_score) }));

  const scores30dFull = scoresList
    .filter(s => s.shape_intelligence_score != null)
    .map(s => ({
      date: s.date,
      mechanical_score: s.mechanical_score ? Number(s.mechanical_score) : null,
      recovery_score: s.recovery_score ? Number(s.recovery_score) : null,
      structural_score: s.structural_score ? Number(s.structural_score) : null,
      body_comp_score: s.body_comp_score ? Number(s.body_comp_score) : null,
      cognitive_score: s.cognitive_score ? Number(s.cognitive_score) : null,
      consistency_score: s.consistency_score ? Number(s.consistency_score) : null,
      shape_intelligence_score: Number(s.shape_intelligence_score),
      classification: s.classification ?? null,
      alerts: (s.alerts as unknown as SisAlert[] | undefined) ?? [],
    }));

  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  const last7 = scores30d.slice(-7).map(s => s.score);
  const last14 = scores30d.slice(-14).map(s => s.score);
  const all30 = scores30d.map(s => s.score);

  const avg7 = avg(last7);
  const avg14 = avg(last14);
  const avg30 = avg(all30);
  const delta7vs30 = avg7 - avg30;

  return {
    score,
    classification,
    label,
    mechanical: todayRow?.mechanical_score ? Number(todayRow.mechanical_score) : null,
    recovery: todayRow?.recovery_score ? Number(todayRow.recovery_score) : null,
    structural: todayRow?.structural_score ? Number(todayRow.structural_score) : null,
    bodyComp: todayRow?.body_comp_score ? Number(todayRow.body_comp_score) : null,
    cognitive: todayRow?.cognitive_score ? Number(todayRow.cognitive_score) : null,
    consistency: todayRow?.consistency_score ? Number(todayRow.consistency_score) : null,
    alerts: (todayRow?.alerts as unknown as SisAlert[] | undefined) ?? [],
    scores30d,
    scores30dFull,
    avg7: Math.round(avg7 * 10) / 10,
    avg14: Math.round(avg14 * 10) / 10,
    avg30: Math.round(avg30 * 10) / 10,
    delta7vs30: Math.round(delta7vs30 * 10) / 10,
    currentStreak: streak?.current_streak ?? 0,
    bestStreak: streak?.best_streak ?? 0,
    hasTodayScore,
    isLoading: scoresLoading || streakLoading,
  };
}
