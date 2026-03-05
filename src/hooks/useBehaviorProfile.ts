import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

export interface BehaviorProfile {
  profile_type: "explorer" | "executor" | "resistant" | "consistent";
  confidence_score: number;
  metrics_snapshot: Record<string, number>;
  computed_at: string;
}

export interface AdaptiveChallenge {
  id: string;
  challenge_type: string;
  unlocked_at: string;
  completed_at: string | null;
  status: string;
}

export interface MicroWin {
  type: string;
  label: string;
  done: boolean;
}

const CHALLENGE_LABELS: Record<string, { label: string; target: number }> = {
  streak_10: { label: "Desafio 10 Dias", target: 10 },
  streak_21: { label: "Desafio 21 Dias", target: 21 },
  streak_30: { label: "Desafio Performance", target: 30 },
};

export function useBehaviorProfile() {
  const { user } = useAuth();
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["behavior-profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("behavior_profiles")
        .select("profile_type, confidence_score, metrics_snapshot, computed_at")
        .eq("user_id", user!.id)
        .single();
      return data as BehaviorProfile | null;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: challenges, isLoading: challengesLoading } = useQuery({
    queryKey: ["adaptive-challenges", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("adaptive_challenges")
        .select("*")
        .eq("user_id", user!.id)
        .order("unlocked_at", { ascending: false });
      return (data ?? []) as AdaptiveChallenge[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: microWins } = useQuery({
    queryKey: ["micro-wins-today", user?.id, today],
    enabled: !!user?.id,
    queryFn: async () => {
      const startOfDay = today + "T00:00:00Z";
      const endOfDay = today + "T23:59:59Z";

      const [workoutRes, dayLogRes, cogRes, foodRes] = await Promise.all([
        supabase.from("workout_completions")
          .select("id")
          .eq("user_id", user!.id)
          .eq("workout_date", today)
          .limit(1),
        supabase.from("manual_day_logs")
          .select("sleep_hours")
          .eq("user_id", user!.id)
          .eq("date", today)
          .limit(1),
        supabase.from("sis_cognitive_checkins")
          .select("id")
          .eq("user_id", user!.id)
          .eq("date", today)
          .limit(1),
        supabase.from("food_logs")
          .select("id")
          .eq("user_id", user!.id)
          .eq("date", today)
          .limit(1),
      ]);

      const wins: MicroWin[] = [
        { type: "workout", label: "Treino", done: (workoutRes.data?.length ?? 0) > 0 },
        { type: "sleep", label: "Registro de sono", done: (dayLogRes.data?.length ?? 0) > 0 && dayLogRes.data![0].sleep_hours != null },
        { type: "mental", label: "Check-in mental", done: (cogRes.data?.length ?? 0) > 0 },
        { type: "nutrition", label: "Nutrição", done: (foodRes.data?.length ?? 0) > 0 },
      ];
      return wins;
    },
    staleTime: 2 * 60 * 1000,
  });

  const activeChallenge = challenges?.find(c => c.status === "active") ?? null;
  const activeChallengeInfo = activeChallenge
    ? CHALLENGE_LABELS[activeChallenge.challenge_type] ?? { label: activeChallenge.challenge_type, target: 0 }
    : null;

  return {
    profile,
    challenges: challenges ?? [],
    activeChallenge,
    activeChallengeInfo,
    microWins: microWins ?? [],
    isLoading: profileLoading || challengesLoading,
  };
}
