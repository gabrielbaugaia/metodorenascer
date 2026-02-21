import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRenascerScore } from "@/hooks/useRenascerScore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { ScoreRing } from "@/components/renascer/ScoreRing";
import { StatusBadge } from "@/components/renascer/StatusBadge";
import { TrendIndicator } from "@/components/renascer/TrendIndicator";
import { DayRecommendation } from "@/components/renascer/DayRecommendation";
import { ManualInput } from "@/components/renascer/ManualInput";
import { ScoreSparkline } from "@/components/renascer/ScoreSparkline";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ExternalLink } from "lucide-react";

export default function Renascer() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const {
    score,
    classification,
    statusText,
    trend,
    trendText,
    recommendation,
    todayLog,
    scores7d,
    isLoading: scoreLoading,
  } = useRenascerScore();

  // Fetch data_mode from profile
  const { data: profile } = useQuery({
    queryKey: ["profile-data-mode", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, data_mode")
        .eq("id", user!.id)
        .single();
      return data;
    },
  });

  const dataMode = profile?.data_mode ?? "manual";
  const firstName = profile?.full_name?.split(" ")[0] ?? "";

  const toggleModeMutation = useMutation({
    mutationFn: async (newMode: string) => {
      if (!user?.id) return;
      await supabase.from("profiles").update({ data_mode: newMode }).eq("id", user.id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile-data-mode"] }),
  });

  if (scoreLoading) {
    return (
      <ClientLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6 pb-24 md:pb-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Olá, {firstName} 🔥
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Você está no controle hoje.
          </p>
        </div>

        {/* Score Ring + Badge */}
        <div className="rounded-xl border border-border/50 bg-card p-6 flex flex-col items-center gap-4">
          <ScoreRing score={score} classification={classification} />
          <StatusBadge classification={classification} statusText={statusText} />
        </div>

        {/* Trend + Sparkline */}
        <div className="rounded-xl border border-border/50 bg-card p-5 space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            Tendência
          </h3>
          <TrendIndicator trend={trend} text={trendText} />
          <ScoreSparkline data={scores7d} />
        </div>

        {/* Recommendation */}
        <DayRecommendation items={recommendation} />

        {/* Data mode toggle */}
        <div className="flex items-center justify-between px-1">
          <Label className="text-xs text-muted-foreground">Dados automáticos</Label>
          <Switch
            checked={dataMode === "auto"}
            onCheckedChange={(checked) =>
              toggleModeMutation.mutate(checked ? "auto" : "manual")
            }
          />
        </div>

        {/* Manual Input / Auto placeholder */}
        <ManualInput dataMode={dataMode} todayLog={todayLog} />

        {/* Advanced panel link */}
        <div className="text-center pt-2">
          <Link
            to="/dados-corpo"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            Painel Avançado
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </ClientLayout>
  );
}
