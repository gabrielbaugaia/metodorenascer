import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useActivityTracker } from "@/hooks/useActivityTracker";
import { useAchievements } from "@/hooks/useAchievements";
import { supabase } from "@/integrations/supabase/client";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { Target, Utensils, TrendingUp, Heart, CreditCard, Lock, Camera, AlertTriangle, Dumbbell, ClipboardCheck, Flame, ArrowRight, ChefHat } from "lucide-react";
import { toast } from "sonner";
import { STRIPE_PRICE_IDS } from "@/lib/planConstants";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { PlanSelectionGrid } from "@/components/dashboard/PlanSelectionGrid";
import { ProtocolRenewalBanner } from "@/components/dashboard/ProtocolRenewalBanner";
import { ProtocolRenewalPopup } from "@/components/dashboard/ProtocolRenewalPopup";
import { WeeklyCheckinModal } from "@/components/checkin/WeeklyCheckinModal";
import { ReferralCampaignPopup } from "@/components/referral/ReferralCampaignPopup";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScoreRing } from "@/components/renascer/ScoreRing";
import { useGabrielBauScore } from "@/hooks/useGabrielBauScore";
import { computeBodyIndicators, type DayLog } from "@/lib/bodyIndicators";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PageHeader } from "@/components/ui/page-header";
import { MetricStrip, SectionHeader } from "@/components/ui/premium";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ManualInput } from "@/components/renascer/ManualInput";
import { useAnalytics } from "@/hooks/useAnalytics";


function DashboardSkeleton() {
  return (
    <div className="container mx-auto max-w-xl space-y-6 animate-pulse">
      {/* Hero: foco do dia + score */}
      <div className="grid md:grid-cols-[minmax(0,1fr)_252px] gap-6 rounded-2xl border border-border/60 p-6">
        <div className="space-y-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-3 w-2/3" />
          <div className="flex gap-3 pt-4">
            <Skeleton className="h-11 w-40 rounded-xl" />
            <Skeleton className="h-11 w-32 rounded-xl" />
          </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-4">
          <Skeleton className="h-[138px] w-[138px] rounded-full" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>

      {/* 3 indicator cards skeleton */}
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-card border border-border/50 rounded-lg p-3 flex flex-col items-center gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-10" />
            <Skeleton className="h-2 w-12" />
          </div>
        ))}
      </div>

      {/* Quick access grid skeleton */}
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

const SUBSCRIPTION_PLANS = [
  {
    name: "Embaixador",
    price: "49,90",
    period: "/mês",
    badge: "25 VAGAS",
    priceId: "price_1ScZqTCuFZvf5xFdZuOBMzpt",
    features: ["Treino personalizado", "Receitas exclusivas", "Fale com Mentor 24h", "Dashboard de progresso", "Análise de fotos", "Preço vitalício"],
    popular: true,
  },
  {
    name: "Mensal",
    price: "197",
    period: "/mês",
    priceId: "price_1ScZrECuFZvf5xFdfS9W8kvY",
    features: ["Treino personalizado", "Receitas exclusivas", "Fale com Mentor 24h", "Dashboard de progresso", "Análise de fotos"],
    popular: false,
  },
  {
    name: "Trimestral",
    price: "497",
    period: "/3 meses",
    priceId: "price_1ScZsTCuFZvf5xFdbW8kJeQF",
    savings: "Economize R$94",
    features: ["Tudo do Mensal", "Check-ins semanais", "Ajustes de protocolo", "Consultoria nutricional"],
    popular: false,
  },
  {
    name: "Semestral",
    price: "697",
    period: "/6 meses",
    priceId: "price_1ScZtrCuFZvf5xFd8iXDfbEp",
    savings: "Economize R$485",
    features: ["Tudo do Trimestral", "Plano nutricional avançado", "Suporte prioritário"],
    popular: false,
  },
  {
    name: "Anual",
    price: "997",
    period: "/ano",
    priceId: "price_1ScZvCCuFZvf5xFdjrs51JQB",
    savings: "Economize R$1.367",
    features: ["Tudo do Semestral", "Mentoria exclusiva", "Comunidade VIP"],
    popular: false,
  },
];

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { subscribed, loading: subLoading, createCheckout, openCustomerPortal, subscriptionEnd } = useSubscription();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const { streak } = useAchievements();
  const gabrielBauData = useGabrielBauScore();
  useActivityTracker();
  const navigate = useNavigate();
  const { trackCheckinStarted, trackCheckinCompleted } = useAnalytics();
  const queryClient = useQueryClient();
  const [checkingAnamnese, setCheckingAnamnese] = useState(true);
  const [showWeeklyCheckin, setShowWeeklyCheckin] = useState(false);
  const [showDailyLog, setShowDailyLog] = useState(false);
  const [canDoWeeklyCheckin, setCanDoWeeklyCheckin] = useState(false);
  const [pendingPaymentInfo, setPendingPaymentInfo] = useState<{ planType: string; planName: string; priceId?: string } | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(true);
  const [needsEvolutionPhotos, setNeedsEvolutionPhotos] = useState(false);
  const [daysSinceLastProtocol, setDaysSinceLastProtocol] = useState(0);
  const [anamneseIncomplete, setAnamneseIncomplete] = useState(false);
  const [firstName, setFirstName] = useState("");


  // Fetch consistency data
  const { data: consistencyData } = useQuery({
    queryKey: ["dashboard-consistency", user?.id],
    enabled: !!user?.id && subscribed,
    queryFn: async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const sevenDaysAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");

      const { data: manualLogs } = await supabase
        .from("manual_day_logs")
        .select("date, sleep_hours, stress_level, energy_focus, trained_today, rpe")
        .eq("user_id", user!.id)
        .gte("date", sevenDaysAgo)
        .lte("date", today);

      const logs: DayLog[] = (manualLogs || []).map((l) => ({
        date: l.date,
        sleep_hours: l.sleep_hours,
        stress_level: l.stress_level,
        energy_focus: l.energy_focus,
        trained_today: l.trained_today,
      }));

      return computeBodyIndicators(logs);
    },
  });

  // Fetch weight evolution
  const { data: weightDelta } = useQuery({
    queryKey: ["dashboard-weight-delta", user?.id],
    enabled: !!user?.id && subscribed,
    queryFn: async () => {
      const { data } = await supabase
        .from("weekly_checkins")
        .select("current_weight, created_at")
        .eq("user_id", user!.id)
        .not("current_weight", "is", null)
        .order("created_at", { ascending: false })
        .limit(2);

      if (!data || data.length < 2) return null;
      return Number((data[0].current_weight! - data[1].current_weight!).toFixed(1));
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!authLoading && !adminLoading && isAdmin) {
      navigate("/admin");
    }
  }, [isAdmin, authLoading, adminLoading, navigate]);

  useEffect(() => {
    const checkWeeklyCheckin = async () => {
      if (!user) return;
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
      const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
      const { data } = await supabase
        .from("weekly_checkins")
        .select("id")
        .eq("user_id", user.id)
        .eq("week_number", weekNumber)
        .eq("year", now.getFullYear())
        .single();
      setCanDoWeeklyCheckin(!data);
    };
    checkWeeklyCheckin();
  }, [user, showWeeklyCheckin]);

  useEffect(() => {
    const checkEvolutionPhotosNeeded = async () => {
      if (!user || !subscribed) return;
      try {
        const { data: lastProtocol } = await supabase
          .from("protocolos")
          .select("created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!lastProtocol) return;
        const protocolDate = new Date(lastProtocol.created_at);
        const now = new Date();
        const daysSince = Math.floor((now.getTime() - protocolDate.getTime()) / (1000 * 60 * 60 * 24));
        setDaysSinceLastProtocol(daysSince);
        if (daysSince < 30) { setNeedsEvolutionPhotos(false); return; }
        const { data: recentCheckin } = await supabase
          .from("checkins")
          .select("id, foto_url")
          .eq("user_id", user.id)
          .gt("created_at", lastProtocol.created_at)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        setNeedsEvolutionPhotos(!(recentCheckin && recentCheckin.foto_url));
      } catch (error) {
        console.error("Error checking evolution photos:", error);
      }
    };
    checkEvolutionPhotosNeeded();
  }, [user, subscribed]);

  useEffect(() => {
    const checkPendingPayment = async () => {
      if (!user) { setCheckingPayment(false); return; }
      if (isAdmin) { setCheckingPayment(false); return; }
      try {
        const { data } = await supabase
          .from("subscriptions")
          .select("status, plan_type, plan_name")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (data?.status === "pending_payment") {
          setPendingPaymentInfo({
            planType: data.plan_type || "mensal",
            planName: data.plan_name || "Plano",
            priceId: STRIPE_PRICE_IDS[data.plan_type || "mensal"],
          });
        }
      } catch (error) {
        console.error("Error checking pending payment:", error);
      } finally {
        setCheckingPayment(false);
      }
    };
    checkPendingPayment();
  }, [user, isAdmin]);

  const [missingAnamneseFields, setMissingAnamneseFields] = useState<string[]>([]);

  useEffect(() => {
    const checkAnamneseAndGetName = async () => {
      if (!user) return;
      if (checkingPayment) return;
      if (pendingPaymentInfo) { setCheckingAnamnese(false); return; }
      try {
        const { data } = await supabase
          .from("profiles")
          .select("age, weight, height, goals, objetivo_principal, anamnese_completa, full_name, dias_disponiveis, nivel_condicionamento, horario_treino, ja_treinou_antes, data_nascimento")
          .eq("id", user.id)
          .single();
        const hasEssentialData = !!(data?.age && data?.weight && data?.height && (data?.goals || data?.objetivo_principal));
        if (data?.full_name) setFirstName(data.full_name.split(" ")[0]);

        const anamneseComplete = data?.anamnese_completa === true || hasEssentialData;
        if (!anamneseComplete && !isAdmin) {
          setAnamneseIncomplete(true);
          // Calculate missing fields for display
          const fieldChecks: [boolean, string][] = [
            [!data?.data_nascimento && !data?.age, "Data de nascimento"],
            [!data?.weight, "Peso"],
            [!data?.height, "Altura"],
            [!data?.objetivo_principal && !data?.goals, "Objetivo principal"],
            [data?.ja_treinou_antes == null, "Histórico de treino"],
            [!data?.dias_disponiveis, "Dias disponíveis"],
            [!data?.nivel_condicionamento, "Nível de condicionamento"],
            [!data?.horario_treino, "Horário de treino"],
          ];
          setMissingAnamneseFields(fieldChecks.filter(([missing]) => missing).map(([, label]) => label));
        }
      } catch (error) {
        console.error("Error checking anamnese:", error);
      } finally {
        setCheckingAnamnese(false);
      }
    };
    if (!subLoading && !checkingPayment) {
      checkAnamneseAndGetName();
    }
  }, [user, subscribed, isAdmin, subLoading, navigate, pendingPaymentInfo, checkingPayment]);

  const handleSelectPlan = async (priceId: string) => {
    try {
      await createCheckout(priceId);
    } catch (error) {
      toast.error("Não foi possível iniciar o checkout");
    }
  };

  const isLoading = authLoading || subLoading || checkingAnamnese || checkingPayment;

  if (isLoading) {
    return (
      <ClientLayout>
        <DashboardSkeleton />
      </ClientLayout>
    );
  }

  // Pending payment screen
  if (pendingPaymentInfo && !isAdmin) {
    const handlePayNow = async () => {
      if (pendingPaymentInfo.priceId) {
        try { await createCheckout(pendingPaymentInfo.priceId); } catch (error) {
          toast.error("Não foi possível iniciar o pagamento");
        }
      }
    };
    return (
      <ClientLayout>
        <div className="container mx-auto max-w-lg py-12">
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Pagamento Pendente</CardTitle>
              <CardDescription>Seu acesso está aguardando a confirmação do pagamento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/30 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">Plano selecionado</p>
                <p className="text-lg font-semibold text-foreground">{pendingPaymentInfo.planName}</p>
              </div>
              <p className="text-sm text-muted-foreground text-center">Complete o pagamento para desbloquear todas as funcionalidades.</p>
              <Button onClick={handlePayNow} variant="default" className="w-full" size="lg">
                <CreditCard className="mr-2 h-5 w-5" />
                Pagar Agora
              </Button>
            </CardContent>
          </Card>
        </div>
      </ClientLayout>
    );
  }

  // Plan selection
  if (!subscribed && !isAdmin) {
    return (
      <ClientLayout>
        <PlanSelectionGrid plans={SUBSCRIPTION_PLANS} onSelectPlan={handleSelectPlan} />
      </ClientLayout>
    );
  }

  // Determine the single daily action (CTA única e contextual)
  const getDailyAction = () => {
    if (!gabrielBauData.todayLog) {
      return {
        label: "Registro do dia",
        hint: "Leva menos de um minuto e é o que ajusta seu protocolo.",
        cta: "Registrar meu dia",
        icon: ClipboardCheck,
        action: () => {
          trackCheckinStarted("diario");
          setShowDailyLog(true);
        },
      };
    }
    if (canDoWeeklyCheckin) {
      return {
        label: "Check-in da semana",
        hint: "Fechamento semanal com peso e percepção geral.",
        cta: "Fazer check-in",
        icon: ClipboardCheck,
        action: () => {
          trackCheckinStarted("semanal");
          setShowWeeklyCheckin(true);
        },
      };
    }
    if (needsEvolutionPhotos) {
      return {
        label: "Fotos de evolução",
        hint: "As fotos liberam o próximo ciclo do seu protocolo.",
        cta: "Enviar fotos",
        icon: Camera,
        action: () => navigate("/evolucao"),
      };
    }
    return {
      label: "Treino disponível",
      hint: "Dia registrado. Agora é executar o treino do ciclo.",
      cta: "Iniciar treino",
      icon: Dumbbell,
      action: () => navigate("/treino"),
    };
  };

  const dailyAction = getDailyAction();


  const pillars = [
    { label: "Treino", desc: "Plano prescrito do ciclo", icon: Dumbbell, href: "/treino" },
    { label: "Nutrição", desc: "Plano alimentar e macros", icon: Utensils, href: "/nutricao" },
    { label: "Aeróbico", desc: "Sessões e condicionamento", icon: Heart, href: "/cardio" },
    { label: "Mindset", desc: "Rotina e disciplina", icon: Target, href: "/mindset" },
  ];

  const hourNow = new Date().getHours();
  const greeting = hourNow < 12 ? "Bom dia" : hourNow < 18 ? "Boa tarde" : "Boa noite";
  const todayLabel = format(new Date(), "dd 'de' MMMM", { locale: ptBR });

  return (
    <ClientLayout>
      <OnboardingTour />
      <ReferralCampaignPopup />
      <ProtocolRenewalPopup daysSinceLastProtocol={daysSinceLastProtocol} />

      <div className="space-y-10 md:space-y-14">
        <PageHeader
          eyebrow={`Hoje · ${todayLabel}`}
          title={firstName ? `${greeting}, ${firstName}` : greeting}
          subtitle="Seu acompanhamento de hoje, organizado por prioridade. Uma ação principal, o restante como apoio."
        />

        {/* Anamnese pendente */}
        {anamneseIncomplete && (
          <section className="surface p-6 md:p-8 border-primary/30">
            <p className="eyebrow-label text-primary">Pendência</p>
            <h2 className="section-title mt-2">Anamnese incompleta</h2>
            <p className="text-sm text-muted-foreground mt-3 max-w-lg leading-relaxed">
              Preciso desses dados para prescrever treino, nutrição e mentalidade com precisão.
            </p>
            {missingAnamneseFields.length > 0 && (
              <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                Faltando: <span className="text-foreground">{missingAnamneseFields.join(" · ")}</span>
              </p>
            )}
            <Button className="mt-6" onClick={() => navigate("/anamnese")}>
              Preencher anamnese
            </Button>
          </section>
        )}

        <ProtocolRenewalBanner
          daysSinceLastProtocol={daysSinceLastProtocol}
          needsEvolutionPhotos={needsEvolutionPhotos}
        />

        {/* Bloco principal do dia */}
        <section className="surface-dark overflow-hidden shadow-[var(--shadow-elevated)]">
          <div className="grid md:grid-cols-[minmax(0,1fr)_252px]">
            <div className="p-7 md:p-10 flex flex-col justify-between gap-8">
              <div>
                <p className="eyebrow-label">Foco do dia</p>
                 <h2 className="mt-3 text-[1.75rem] font-bold leading-tight text-sidebar-foreground md:text-[2.25rem]">{dailyAction.label}</h2>
                 <p className="text-sm text-sidebar-foreground/60 mt-4 max-w-md leading-relaxed">
                  {dailyAction.hint}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="lg" onClick={dailyAction.action} className="gap-2 min-h-11">
                  <dailyAction.icon className="h-4 w-4" strokeWidth={1.4} />
                  {dailyAction.cta}
                </Button>
              </div>
            </div>

            <div className="border-t md:border-t-0 md:border-l border-sidebar-border bg-sidebar-accent/40 px-6 py-9 md:px-8 md:py-10 flex flex-col items-center justify-center gap-6">
              <ScoreRing
                score={gabrielBauData.score}
                classification={gabrielBauData.classification}
                emptyLabel={!gabrielBauData.todayLog ? "empty" : undefined}
              />
              <div className="text-center">
                <p className="text-[0.68rem] uppercase tracking-[0.18em] text-sidebar-foreground/45">
                  {gabrielBauData.classification}
                </p>
                <p className="mt-1.5 text-sm text-sidebar-foreground/75 leading-relaxed">
                  {gabrielBauData.statusText}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Progresso da semana */}
        <section className="section-block">
           <SectionHeader title="Progresso da semana" action={<Button
               variant="ghost"
               size="sm"
              onClick={() => navigate("/evolucao")}
               className="text-muted-foreground"
            >
              Ver evolução
             </Button>} />
           <MetricStrip items={[
              {
                label: "Consistência",
                value: consistencyData?.hasEnoughData ? `${consistencyData.consistencyPercent}%` : "—",
                hint: "últimos 7 dias",
              },
              {
                label: "Sequência",
                value: streak.current_streak > 0 ? `${streak.current_streak}` : "—",
                hint: streak.current_streak > 0 ? "dias consecutivos" : "sem registro",
              },
              {
                label: "Peso",
                value: weightDelta != null ? `${weightDelta > 0 ? "+" : ""}${weightDelta} kg` : "—",
                hint: "variação recente",
              },
             ]} />
        </section>

        {/* Pilares do acompanhamento */}
        <section className="section-block">
          <SectionHeader title="Seus pilares" description="Os quatro eixos do seu acompanhamento, organizados para consulta rápida." />
          <div className="surface divide-y divide-border/60">
            {pillars.map((item) => {
              const isLocked = anamneseIncomplete;
              return (
                <button
                  key={item.label}
                  onClick={() => !isLocked && navigate(item.href)}
                  disabled={isLocked}
                  className="w-full flex items-center gap-5 px-6 md:px-8 py-5 text-left transition-colors hover:bg-secondary/30 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isLocked ? (
                    <Lock className="h-[18px] w-[18px] text-muted-foreground shrink-0" strokeWidth={1.4} />
                  ) : (
                    <item.icon className="h-[18px] w-[18px] text-primary shrink-0" strokeWidth={1.4} />
                  )}
                  <span className="min-w-0 flex-1">
                     <span className="block text-base font-semibold text-foreground">{item.label}</span>
                    <span className="block text-xs text-muted-foreground mt-0.5">{item.desc}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={1.4} />
                </button>
              );
            })}
          </div>
        </section>

        {/* Orientação do treinador */}
        <section className="surface-quiet p-7 md:p-9">
          <p className="eyebrow-label">Orientação do treinador</p>
          <p className="font-display text-lg md:text-xl text-foreground mt-3 leading-snug max-w-2xl">
            {gabrielBauData.recommendation[1] ??
              "Constância vale mais que intensidade isolada. Cumpra o plano de hoje e registre o dia — é assim que eu ajusto seu protocolo."}
          </p>
          <p className="text-xs text-muted-foreground mt-4">Gabriel Baú · Consultoria</p>
        </section>
      </div>

      {/* Registro do dia — dentro da própria tela Hoje */}
      <Sheet open={showDailyLog} onOpenChange={setShowDailyLog}>
        <SheetContent side="bottom" className="max-h-[92dvh] overflow-y-auto">
          <SheetHeader className="text-left">
            <SheetTitle>Registro do dia</SheetTitle>
            <SheetDescription>
              Sono, energia, estresse e treino de hoje. É o que alimenta seu score.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-5 pb-8">
            <ManualInput
              dataMode="manual"
              todayLog={
                gabrielBauData.todayLog
                  ? {
                      sleep_hours: gabrielBauData.todayLog.sleep_hours ?? null,
                      stress_level: gabrielBauData.todayLog.stress_level ?? null,
                      energy_focus: gabrielBauData.todayLog.energy_focus ?? null,
                      trained_today: gabrielBauData.todayLog.trained_today ?? null,
                      rpe: (gabrielBauData.todayLog as { rpe?: number | null }).rpe ?? null,
                    }
                  : null
              }
              onSaveSuccess={() => {
                trackCheckinCompleted("diario");
                queryClient.invalidateQueries({ queryKey: ["renascer-score"] });
                queryClient.invalidateQueries({ queryKey: ["dashboard-consistency"] });
                setShowDailyLog(false);
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      <WeeklyCheckinModal
        open={showWeeklyCheckin}
        onOpenChange={setShowWeeklyCheckin}
        onComplete={() => {
          setCanDoWeeklyCheckin(false);
          trackCheckinCompleted("semanal");
        }}
      />

    </ClientLayout>
  );
}
