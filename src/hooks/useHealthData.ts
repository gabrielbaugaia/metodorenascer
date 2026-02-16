import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface HealthDaily {
  id: string;
  user_id: string;
  date: string;
  steps: number;
  active_calories: number;
  sleep_minutes: number;
  resting_hr: number | null;
  hrv_ms: number | null;
  source: string;
  updated_at: string;
}

export interface HealthWorkout {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  type: string;
  calories: number | null;
  source: string;
}

function formatSleep(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h${m.toString().padStart(2, "0")}`;
}

function calculateReadiness(
  data: HealthDaily[],
  hasRecentWorkout: boolean
): { score: number; recommendation: string } {
  if (data.length === 0) return { score: 0, recommendation: "Sem dados suficientes" };

  const today = data[0]; // most recent
  let score = 100;

  // Sleep penalties
  if (today.sleep_minutes < 300) {
    score -= 35;
  } else if (today.sleep_minutes < 360) {
    score -= 20;
  }

  // Baselines (7-day averages excluding nulls)
  const restingHrs = data.map((d) => d.resting_hr).filter((v): v is number => v !== null);
  const hrvs = data.map((d) => d.hrv_ms).filter((v): v is number => v !== null);

  if (today.resting_hr !== null && restingHrs.length > 0) {
    const baselineHr = restingHrs.reduce((a, b) => a + b, 0) / restingHrs.length;
    if (today.resting_hr > baselineHr + 5) score -= 15;
  }

  if (today.hrv_ms !== null && hrvs.length > 0) {
    const baselineHrv = hrvs.reduce((a, b) => a + b, 0) / hrvs.length;
    if (today.hrv_ms < baselineHrv * 0.85) score -= 15;
  }

  if (today.steps < 4000) score -= 5;
  if (hasRecentWorkout) score -= 10;

  score = Math.max(0, Math.min(100, score));

  let recommendation: string;
  if (score >= 80) recommendation = "Treino normal";
  else if (score >= 60) recommendation = "Reduzir volume em 20%";
  else if (score >= 40) recommendation = "Treino leve + técnica";
  else recommendation = "Mobilidade + caminhada leve";

  return { score, recommendation };
}

export function useHealthData() {
  const { user } = useAuth();

  const today = new Date().toISOString().split("T")[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
  const twentyFourHoursAgo = new Date(Date.now() - 86400000).toISOString();

  const dailyQuery = useQuery({
    queryKey: ["health-daily", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("health_daily")
        .select("*")
        .eq("user_id", user!.id)
        .gte("date", sevenDaysAgo)
        .order("date", { ascending: false })
        .limit(7);
      if (error) throw error;
      return (data || []) as HealthDaily[];
    },
    enabled: !!user?.id,
  });

  const workoutsQuery = useQuery({
    queryKey: ["health-workouts-recent", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("health_workouts")
        .select("*")
        .eq("user_id", user!.id)
        .gte("start_time", twentyFourHoursAgo)
        .order("start_time", { ascending: false });
      if (error) throw error;
      return (data || []) as HealthWorkout[];
    },
    enabled: !!user?.id,
  });

  const dailyData = dailyQuery.data || [];
  const todayData = dailyData.find((d) => d.date === today) || null;
  const hasRecentWorkout = (workoutsQuery.data || []).length > 0;
  const readiness = calculateReadiness(dailyData, hasRecentWorkout);

  // Last sync info
  const lastSync = dailyData.length > 0
    ? { date: dailyData[0].updated_at, source: dailyData[0].source }
    : null;

  return {
    dailyData,
    todayData,
    recentWorkouts: workoutsQuery.data || [],
    readiness,
    lastSync,
    isLoading: dailyQuery.isLoading || workoutsQuery.isLoading,
    formatSleep,
    refetch: () => {
      dailyQuery.refetch();
      workoutsQuery.refetch();
    },
  };
}
