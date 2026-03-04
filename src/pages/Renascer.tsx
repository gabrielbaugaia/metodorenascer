import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRenascerScore } from "@/hooks/useRenascerScore";
import { useSisScore } from "@/hooks/useSisScore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { PageHeader } from "@/components/ui/page-header";
import { PageTutorial, PageTutorialBanner } from "@/components/onboarding/PageTutorial";
import { SisScoreRing } from "@/components/sis/SisScoreRing";
import { SisSubScoreCards } from "@/components/sis/SisSubScoreCards";
import { SisAlerts } from "@/components/sis/SisAlerts";
import { SisTrendChart } from "@/components/sis/SisTrendChart";
import { SisCognitiveCheckin } from "@/components/sis/SisCognitiveCheckin";
import { MiniConfetti } from "@/components/renascer/MiniConfetti";
import { ManualInput } from "@/components/renascer/ManualInput";
import { RecentLogsHistory } from "@/components/renascer/RecentLogsHistory";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ExternalLink, Flame } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Renascer() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [celebrating, setCelebrating] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  // Legacy score (kept for ManualInput compatibility)
  const { todayLog, isLoading: legacyLoading } = useRenascerScore();

  // SIS score
  const sis = useSisScore();

  const handleSaveSuccess = useCallback(async () => {
    setCelebrating(true);
    setShowFeedback(true);
    setTimeout(() => setCelebrating(false), 900);
    setTimeout(() => setShowFeedback(false), 2500);

    const key = "renascer_celebrations_count";
    const count = parseInt(localStorage.getItem(key) ?? "0", 10);
    if (count < 7) {
      setShowConfetti(true);
      localStorage.setItem(key, String(count + 1));
      setTimeout(() => setShowConfetti(false), 1200);
    }

    // Recompute SIS score after manual input save
    try {
      await supabase.functions.invoke("compute-sis-score", {
        body: { target_date: format(new Date(), "yyyy-MM-dd") },
      });
      queryClient.invalidateQueries({ queryKey: ["sis-scores-30d"] });
    } catch (e) {
      console.error("SIS recompute failed:", e);
    }
  }, [queryClient]);

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

  const todayFormatted = format(new Date(), "EEE, dd/MM", { locale: ptBR });

  if (sis.isLoading && legacyLoading) {
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
        <PageHeader
          title={`Olá, ${firstName}`}
          subtitle={`Hoje — ${todayFormatted}`}
          actions={<PageTutorial pageId="renascer" />}
        />

        <PageTutorialBanner pageId="renascer" />

        {/* SIS Score Ring */}
        <div className="rounded-xl border border-border/50 bg-card p-6 flex flex-col items-center gap-4 relative">
          <MiniConfetti active={showConfetti} />
          <SisScoreRing
            score={sis.score}
            classification={sis.classification}
            label={sis.label}
            delta7vs30={sis.delta7vs30}
            hasTodayScore={sis.hasTodayScore}
          />
          {sis.currentStreak > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Flame className="h-3.5 w-3.5 text-orange-500" />
              <span>{sis.currentStreak} dias consecutivos</span>
              {sis.bestStreak > sis.currentStreak && (
                <span className="text-muted-foreground/60">· recorde {sis.bestStreak}</span>
              )}
            </div>
          )}
          {showFeedback && (
            <p className="text-xs text-muted-foreground animate-fade-in transition-opacity">
              Atualizado. Continue no controle.
            </p>
          )}
        </div>

        {/* Sub-score Cards */}
        <SisSubScoreCards
          mechanical={sis.mechanical}
          recovery={sis.recovery}
          structural={sis.structural}
          bodyComp={sis.bodyComp}
          cognitive={sis.cognitive}
          consistency={sis.consistency}
        />

        {/* Alerts */}
        <SisAlerts alerts={sis.alerts} />

        {/* Trend Chart */}
        <SisTrendChart data={sis.scores30d} avg7={sis.avg7} avg14={sis.avg14} avg30={sis.avg30} />

        {/* Cognitive Quick Check-in */}
        <SisCognitiveCheckin />

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

        {/* Manual Input (kept) */}
        <ManualInput dataMode={dataMode} todayLog={todayLog} onSaveSuccess={handleSaveSuccess} />

        {/* Recent Logs History (kept) */}
        <RecentLogsHistory />

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
