import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAnalytics } from "@/hooks/useAnalytics";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeader } from "@/components/ui/premium";

export type EvolutionPeriod = "30d" | "90d" | "all";

const PERIODS: { key: EvolutionPeriod; label: string; days: number | null }[] = [
  { key: "30d", label: "30 dias", days: 30 },
  { key: "90d", label: "90 dias", days: 90 },
  { key: "all", label: "Todo período", days: null },
];

interface WeightPoint {
  date: string;
  weight: number;
}

interface Props {
  /** Pesos vindos dos check-ins de evolução (mais antigo → mais recente). */
  weightSeries: WeightPoint[];
  currentWeight: number | null;
  period: EvolutionPeriod;
  onPeriodChange: (period: EvolutionPeriod) => void;
}

export function EvolutionOverview({ weightSeries, currentWeight, period, onPeriodChange }: Props) {
  const { user } = useAuth();
  const { trackProgressPeriodChanged } = useAnalytics();
  const days = PERIODS.find((p) => p.key === period)?.days ?? null;

  const { data, isLoading } = useQuery({
    queryKey: ["evolution-overview", user?.id, period],
    enabled: !!user?.id,
    staleTime: 60_000,
    queryFn: async () => {
      const from = days ? format(subDays(new Date(), days - 1), "yyyy-MM-dd") : "1970-01-01";

      const [workouts, cardio, logs] = await Promise.all([
        supabase
          .from("workout_completions")
          .select("workout_date")
          .eq("user_id", user!.id)
          .gte("workout_date", from),
        supabase
          .from("cardio_sessions")
          .select("session_date")
          .eq("user_id", user!.id)
          .gte("session_date", from),
        supabase.from("manual_day_logs").select("date").eq("user_id", user!.id).gte("date", from),
      ]);

      return {
        workouts: workouts.data?.length ?? 0,
        cardio: cardio.data?.length ?? 0,
        checkinDays: new Set((logs.data || []).map((l) => l.date)).size,
      };
    },
  });

  const filteredSeries = useMemo(() => {
    if (!days) return weightSeries;
    const cutoff = subDays(new Date(), days - 1).getTime();
    return weightSeries.filter((p) => new Date(p.date).getTime() >= cutoff);
  }, [weightSeries, days]);

  const weightDelta = useMemo(() => {
    if (filteredSeries.length < 2) return null;
    const first = filteredSeries[0].weight;
    const last = filteredSeries[filteredSeries.length - 1].weight;
    return Number((last - first).toFixed(1));
  }, [filteredSeries]);

  const adherence = useMemo(() => {
    if (!data || !days) return null;
    return Math.min(100, Math.round((data.checkinDays / days) * 100));
  }, [data, days]);

  const metrics = [
    {
      label: "Peso atual",
      value: currentWeight != null ? `${currentWeight} kg` : "—",
      hint: currentWeight != null ? "último registro enviado" : "envie um check-in com peso",
    },
    {
      label: "Variação no período",
      value: weightDelta != null ? `${weightDelta > 0 ? "+" : ""}${weightDelta} kg` : "—",
      hint: weightDelta != null ? "entre o primeiro e o último registro" : "precisa de dois registros",
    },
    {
      label: "Treinos concluídos",
      value: data ? String(data.workouts) : "—",
      hint: "sessões finalizadas no app",
    },
    {
      label: "Sessões aeróbicas",
      value: data ? String(data.cardio) : "—",
      hint: "registradas no período",
    },
    {
      label: "Aderência",
      value: adherence != null ? `${adherence}%` : "—",
      hint: adherence != null ? "dias com registro no período" : "disponível em 30 e 90 dias",
    },
  ];

  return (
    <section className="section-block">
      <SectionHeader
        title="Sua evolução em números"
        description="Leitura simples do período: o que você fez e como o corpo respondeu."
        action={
          <div className="flex gap-1 rounded-xl border border-border/60 p-1" role="group" aria-label="Período">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => {
                  onPeriodChange(p.key);
                  trackProgressPeriodChanged(p.key);
                }}
                aria-pressed={period === p.key}
                className={cn(
                  "min-h-11 rounded-lg px-3 text-xs font-medium transition-colors duration-200",
                  period === p.key
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="surface divide-y divide-border/60 md:grid md:grid-cols-5 md:divide-y-0 md:divide-x">
        {metrics.map((m) => (
          <div key={m.label} className="px-6 py-5 md:px-5">
            <p className="metric-label">{m.label}</p>
            <p className="mt-1.5 text-2xl font-semibold text-foreground">
              {isLoading ? <Skeleton className="h-7 w-16" /> : m.value}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{m.hint}</p>
          </div>
        ))}
      </div>

      <div className="surface p-6 md:p-8">
        <p className="eyebrow-label">Peso ao longo do tempo</p>
        {filteredSeries.length < 2 ? (
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            Ainda não há registros suficientes para desenhar a curva. Envie um novo check-in com peso e a
            linha começa a se formar.
          </p>
        ) : (
          <div className="mt-5 h-56 w-full md:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredSeries} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 6" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => format(new Date(v), "dd/MM", { locale: ptBR })}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={["dataMin - 1.5", "dataMax + 1.5"]}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  width={44}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  labelFormatter={(v) => format(new Date(v as string), "dd 'de' MMMM", { locale: ptBR })}
                  formatter={(value) => [`${value} kg`, "Peso"]}
                />
                <Area
                  type="monotone"
                  dataKey="weight"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#weightFill)"
                  animationDuration={220}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </section>
  );
}

export function useEvolutionPeriod() {
  const [period, setPeriod] = useState<EvolutionPeriod>("90d");
  useEffect(() => {}, []);
  return { period, setPeriod };
}
