import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { differenceInDays } from "date-fns";

interface TransformationJourney {
  user_id: string;
  started_at: string;
  current_day: number;
  current_phase: "installation" | "consolidation" | "identity";
  status: "active" | "completed" | "paused";
  badges_earned: string[];
}

const PHASE_CONFIG = {
  installation: {
    label: "Instalação de Hábitos",
    message: "Foco em micro vitórias e ações simples. A regra dos 2 minutos é sua aliada.",
    range: [1, 30] as const,
  },
  consolidation: {
    label: "Consolidação",
    message: "Seu padrão de disciplina está ficando mais forte.",
    range: [31, 60] as const,
  },
  identity: {
    label: "Identidade",
    message: "A disciplina se tornou seu padrão.",
    range: [61, 90] as const,
  },
};

const BADGE_MILESTONES = [
  { day: 7, badge: "streak_7", label: "7 Dias" },
  { day: 14, badge: "streak_14", label: "14 Dias" },
  { day: 30, badge: "streak_30", label: "30 Dias" },
  { day: 60, badge: "streak_60", label: "60 Dias" },
  { day: 90, badge: "streak_90", label: "90 Dias" },
];

function getPhase(day: number): "installation" | "consolidation" | "identity" {
  if (day <= 30) return "installation";
  if (day <= 60) return "consolidation";
  return "identity";
}

export function useTransformationJourney() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: journey, isLoading } = useQuery({
    queryKey: ["transformation-journey", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transformation_journeys")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) throw error;
      return data as TransformationJourney | null;
    },
    staleTime: 5 * 60 * 1000,
  });

  const createJourneyMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("transformation_journeys")
        .insert({ user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transformation-journey"] });
    },
  });

  // Calculate current day from started_at
  const currentDay = journey
    ? Math.min(differenceInDays(new Date(), new Date(journey.started_at)) + 1, 90)
    : 0;

  const phase = currentDay > 0 ? getPhase(currentDay) : null;
  const phaseConfig = phase ? PHASE_CONFIG[phase] : null;

  const earnedBadges = (journey?.badges_earned ?? []) as string[];
  const newBadges = BADGE_MILESTONES.filter(
    (m) => currentDay >= m.day && !earnedBadges.includes(m.badge)
  );

  const allBadges = BADGE_MILESTONES.map((m) => ({
    ...m,
    earned: currentDay >= m.day,
  }));

  const isCompleted = currentDay >= 90;
  const progress = Math.min((currentDay / 90) * 100, 100);

  return {
    journey,
    currentDay,
    phase,
    phaseLabel: phaseConfig?.label ?? "",
    phaseMessage: phaseConfig?.message ?? "",
    badges: allBadges,
    newBadges,
    progress,
    isCompleted,
    isLoading,
    startJourney: createJourneyMutation.mutate,
    isStarting: createJourneyMutation.isPending,
  };
}
