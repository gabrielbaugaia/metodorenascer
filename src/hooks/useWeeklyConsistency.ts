import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Consistência semanal unificada.
 *
 * Regra: só entra no índice global a dimensão que tem base confiável
 * (meta conhecida ou janela fixa de 7 dias). Nada é estimado.
 */

export interface ConsistencyDimension {
  key: "treino" | "aerobico" | "checkins" | "nutricao";
  label: string;
  /** Quantidade realizada no período. */
  done: number;
  /** Meta do período — null quando não há base para definir meta. */
  target: number | null;
  /** Percentual 0–100 — null quando não computável. */
  percent: number | null;
  /** Texto pronto para exibição (ex.: "4/5" ou "2 sessões"). */
  display: string;
  /** Entra no cálculo do índice global. */
  countsToIndex: boolean;
  /** Explicação curta da origem do número. */
  source: string;
}

export interface WeeklyConsistency {
  loading: boolean;
  /** Índice global 0–100 — null quando não há dimensões confiáveis. */
  index: number | null;
  dimensions: ConsistencyDimension[];
  /** Quantas dimensões entraram no índice. */
  basisCount: number;
  periodLabel: string;
  hasAnyData: boolean;
}

const WINDOW_DAYS = 7;

function parseTrainingTarget(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.min(7, Math.max(1, Math.round(value)));
  }
  if (typeof value === "string") {
    const match = value.match(/\d+/);
    if (match) {
      const n = parseInt(match[0], 10);
      if (Number.isFinite(n) && n > 0) return Math.min(7, n);
    }
  }
  return null;
}

function uniqueDays(rows: { date?: string | null }[] | null | undefined, key = "date") {
  const set = new Set<string>();
  (rows || []).forEach((row) => {
    const raw = (row as Record<string, unknown>)[key];
    if (typeof raw === "string" && raw.length >= 10) set.add(raw.slice(0, 10));
  });
  return set.size;
}

export function useWeeklyConsistency(): WeeklyConsistency {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["weekly-consistency", user?.id],
    enabled: !!user?.id,
    staleTime: 60_000,
    queryFn: async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const from = format(subDays(new Date(), WINDOW_DAYS - 1), "yyyy-MM-dd");
      const fromTs = `${from}T00:00:00.000Z`;

      const [profileRes, workoutsRes, cardioRes, logsRes, foodRes, foodEverRes] = await Promise.all([
        supabase.from("profiles").select("dias_disponiveis").eq("id", user!.id).maybeSingle(),
        supabase
          .from("workout_completions")
          .select("workout_date")
          .eq("user_id", user!.id)
          .gte("workout_date", from)
          .lte("workout_date", today),
        supabase
          .from("cardio_sessions")
          .select("session_date")
          .eq("user_id", user!.id)
          .gte("session_date", from)
          .lte("session_date", today),
        supabase
          .from("manual_day_logs")
          .select("date")
          .eq("user_id", user!.id)
          .gte("date", from)
          .lte("date", today),
        supabase
          .from("food_logs")
          .select("date")
          .eq("user_id", user!.id)
          .gte("date", from)
          .lte("date", today),
        supabase.from("food_logs").select("id").eq("user_id", user!.id).lt("created_at", fromTs).limit(1),
      ]);

      return {
        trainingTarget: parseTrainingTarget(profileRes.data?.dias_disponiveis),
        workoutDays: uniqueDays(workoutsRes.data as { date?: string }[], "workout_date"),
        cardioDays: uniqueDays(cardioRes.data as { date?: string }[], "session_date"),
        checkinDays: uniqueDays(logsRes.data as { date?: string }[], "date"),
        nutritionDays: uniqueDays(foodRes.data as { date?: string }[], "date"),
        usesNutritionDiary: (foodRes.data?.length ?? 0) > 0 || (foodEverRes.data?.length ?? 0) > 0,
      };
    },
  });

  const dimensions: ConsistencyDimension[] = [];

  if (data) {
    const trainingTarget = data.trainingTarget;
    dimensions.push({
      key: "treino",
      label: "Treino",
      done: data.workoutDays,
      target: trainingTarget,
      percent: trainingTarget ? Math.min(100, Math.round((data.workoutDays / trainingTarget) * 100)) : null,
      display: trainingTarget
        ? `${data.workoutDays}/${trainingTarget}`
        : `${data.workoutDays} ${data.workoutDays === 1 ? "treino" : "treinos"}`,
      countsToIndex: !!trainingTarget,
      source: trainingTarget
        ? "Treinos concluídos no app sobre os dias disponíveis da sua anamnese."
        : "Treinos concluídos no app nos últimos 7 dias. Sem meta definida na anamnese.",
    });

    dimensions.push({
      key: "aerobico",
      label: "Aeróbico",
      done: data.cardioDays,
      target: null,
      percent: null,
      display: `${data.cardioDays} ${data.cardioDays === 1 ? "sessão" : "sessões"}`,
      countsToIndex: false,
      source: "Sessões aeróbicas registradas nos últimos 7 dias. Não há meta prescrita para virar percentual.",
    });

    dimensions.push({
      key: "checkins",
      label: "Check-ins",
      done: data.checkinDays,
      target: WINDOW_DAYS,
      percent: Math.min(100, Math.round((data.checkinDays / WINDOW_DAYS) * 100)),
      display: `${data.checkinDays}/${WINDOW_DAYS}`,
      countsToIndex: true,
      source: "Dias com registro diário preenchido na tela Hoje.",
    });

    if (data.usesNutritionDiary) {
      dimensions.push({
        key: "nutricao",
        label: "Nutrição",
        done: data.nutritionDays,
        target: WINDOW_DAYS,
        percent: Math.min(100, Math.round((data.nutritionDays / WINDOW_DAYS) * 100)),
        display: `${data.nutritionDays}/${WINDOW_DAYS}`,
        countsToIndex: true,
        source: "Dias com pelo menos uma refeição registrada no diário.",
      });
    } else {
      dimensions.push({
        key: "nutricao",
        label: "Nutrição",
        done: 0,
        target: null,
        percent: null,
        display: "sem registro",
        countsToIndex: false,
        source: "Ainda não há registros no diário nutricional para calcular consistência.",
      });
    }
  }

  const basis = dimensions.filter((d) => d.countsToIndex && d.percent != null);
  const index = basis.length
    ? Math.round(basis.reduce((acc, d) => acc + (d.percent as number), 0) / basis.length)
    : null;

  return {
    loading: isLoading,
    index,
    dimensions,
    basisCount: basis.length,
    periodLabel: "últimos 7 dias",
    hasAnyData: dimensions.some((d) => d.done > 0),
  };
}
