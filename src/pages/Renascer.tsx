import { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { TransformationPhaseCard } from "@/components/renascer/TransformationPhaseCard";
import { useAuth } from "@/hooks/useAuth";
import { useRenascerScore } from "@/hooks/useRenascerScore";
import { useSisScore } from "@/hooks/useSisScore";
import { useBehaviorProfile } from "@/hooks/useBehaviorProfile";
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
import { MindsetInsightsPanel } from "@/components/mindset/MindsetInsightsPanel";
import { MiniConfetti } from "@/components/renascer/MiniConfetti";
import { ManualInput } from "@/components/renascer/ManualInput";
import { RecentLogsHistory } from "@/components/renascer/RecentLogsHistory";
import { BehaviorProfileBadge } from "@/components/renascer/BehaviorProfileBadge";
import { MicroWinsCard } from "@/components/renascer/MicroWinsCard";
import { ActiveChallengeCard } from "@/components/renascer/ActiveChallengeCard";
import { BatchFitnessUpload } from "@/components/renascer/BatchFitnessUpload";
import { ExcelDataImport } from "@/components/renascer/ExcelDataImport";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import { ExternalLink, Flame, Download, History, Loader2, CalendarDays, FileSpreadsheet } from "lucide-react";
import { format } from "date-fns";
import { generateSisReportPdf } from "@/lib/generateSisReportPdf";
import { toast } from "sonner";
import { ptBR } from "date-fns/locale";

export default function Renascer() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [celebrating, setCelebrating] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [backfilling, setBackfilling] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [batchUploadOpen, setBatchUploadOpen] = useState(false);
  const [excelImportOpen, setExcelImportOpen] = useState(false);

  // Legacy score (kept for ManualInput compatibility)
  const { todayLog, isLoading: legacyLoading } = useRenascerScore();

  // SIS score
  const sis = useSisScore();

  // Behavioral AI
  const behavior = useBehaviorProfile();

  // Classify behavior on dashboard load
  useEffect(() => {
    if (user?.id) {
      supabase.functions.invoke("classify-behavior").catch(console.error);
    }
  }, [user?.id]);

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

        {/* 90-Day Transformation Journey */}
        <TransformationPhaseCard />

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

        {/* Behavioral Profile Badge */}
        {behavior.profile && (
          <BehaviorProfileBadge
            profileType={behavior.profile.profile_type}
            confidence={behavior.profile.confidence_score}
          />
        )}

        {/* Micro Wins */}
        <MicroWinsCard wins={behavior.microWins} />

        {/* Active Challenge */}
        {behavior.activeChallenge && behavior.activeChallengeInfo && (
          <ActiveChallengeCard
            challengeLabel={behavior.activeChallengeInfo.label}
            targetDays={behavior.activeChallengeInfo.target}
            currentStreak={sis.currentStreak}
          />
        )}


        <SisSubScoreCards
          mechanical={sis.mechanical}
          recovery={sis.recovery}
          cognitive={sis.cognitive}
          consistency={sis.consistency}
          nutrition={sis.nutrition}
          scores30dFull={sis.scores30dFull}
        />

        {/* Alerts */}
        <SisAlerts alerts={sis.alerts} />

        {/* Trend Chart */}
        <SisTrendChart data={sis.scores30d} avg7={sis.avg7} avg14={sis.avg14} avg30={sis.avg30} />

        {/* Cognitive Quick Check-in */}
        <SisCognitiveCheckin />

        {/* Mental Wellness Insights */}
        <MindsetInsightsPanel />

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

        {/* Batch upload button */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 gap-2 border-primary/30 text-primary hover:bg-primary/10"
            onClick={() => setBatchUploadOpen(true)}
          >
            <CalendarDays className="h-4 w-4" />
            Recuperar Semana
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-2 border-primary/30 text-primary hover:bg-primary/10"
            onClick={() => setExcelImportOpen(true)}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Importar Excel
          </Button>
        </div>
        <BatchFitnessUpload open={batchUploadOpen} onOpenChange={setBatchUploadOpen} />
        <ExcelDataImport open={excelImportOpen} onOpenChange={setExcelImportOpen} />

        {/* Recent Logs History (kept) */}
        <RecentLogsHistory />

        {/* SIS Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            disabled={backfilling}
            onClick={async () => {
              setBackfilling(true);
              try {
                const { error } = await supabase.functions.invoke("compute-sis-score", {
                  body: { backfill: true },
                });
                if (error) throw error;
                queryClient.invalidateQueries({ queryKey: ["sis-scores-30d"] });
                toast.success("Histórico SIS importado com sucesso!");
              } catch (e) {
                console.error("Backfill error:", e);
                toast.error("Erro ao importar histórico");
              } finally {
                setBackfilling(false);
              }
            }}
          >
            {backfilling ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <History className="h-3.5 w-3.5 mr-1.5" />}
            Importar Histórico
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            disabled={downloadingPdf || !sis.scores30d.length}
            onClick={() => {
              setDownloadingPdf(true);
              try {
                generateSisReportPdf({
                  userName: profile?.full_name || firstName || "Aluno",
                  scores30d: sis.scores30dFull,
                  avg7: sis.avg7,
                  avg14: sis.avg14,
                  avg30: sis.avg30,
                  delta7vs30: sis.delta7vs30,
                  currentStreak: sis.currentStreak,
                  bestStreak: sis.bestStreak,
                });
                toast.success("PDF gerado com sucesso!");
              } catch (e) {
                console.error("PDF error:", e);
                toast.error("Erro ao gerar PDF");
              } finally {
                setDownloadingPdf(false);
              }
            }}
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Relatório SIS
          </Button>
        </div>

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
