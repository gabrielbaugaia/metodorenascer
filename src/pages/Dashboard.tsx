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
import { toast } from "@/hooks/use-toast";
import { STRIPE_PRICE_IDS } from "@/lib/planConstants";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { FullPageLoader } from "@/components/ui/loading-spinner";
import { PlanSelectionGrid } from "@/components/dashboard/PlanSelectionGrid";
import { WeeklyCheckinModal } from "@/components/checkin/WeeklyCheckinModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScoreRing } from "@/components/renascer/ScoreRing";
import { StatusBadge } from "@/components/renascer/StatusBadge";
import { useRenascerScore } from "@/hooks/useRenascerScore";
import { computeBodyIndicators, type DayLog } from "@/lib/bodyIndicators";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";

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
  const renascer = useRenascerScore();
  useActivityTracker();
  const navigate = useNavigate();
  const [checkingAnamnese, setCheckingAnamnese] = useState(true);
  const [showWeeklyCheckin, setShowWeeklyCheckin] = useState(false);
  const [canDoWeeklyCheckin, setCanDoWeeklyCheckin] = useState(false);
  const [pendingPaymentInfo, setPendingPaymentInfo] = useState<{ planType: string; planName: string; priceId?: string } | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(true);
  const [needsEvolutionPhotos, setNeedsEvolutionPhotos] = useState(false);
  const [daysSinceLastProtocol, setDaysSinceLastProtocol] = useState(0);
  const [anamneseIncomplete, setAnamneseIncomplete] = useState(false);

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
      toast({ title: "Erro", description: "Não foi possível iniciar o checkout", variant: "destructive" });
    }
  };

  const isLoading = authLoading || subLoading || checkingAnamnese || checkingPayment;

  if (isLoading) {
    return <FullPageLoader />;
  }

  // Pending payment screen
  if (pendingPaymentInfo && !isAdmin) {
    const handlePayNow = async () => {
      if (pendingPaymentInfo.priceId) {
        try { await createCheckout(pendingPaymentInfo.priceId); } catch (error) {
          toast({ title: "Erro", description: "Não foi possível iniciar o pagamento", variant: "destructive" });
        }
      }
    };
    return (
      <ClientLayout>
        <div className="container mx-auto max-w-lg py-12">
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-yellow-500" />
              </div>
              <CardTitle className="text-2xl">Pagamento Pendente</CardTitle>
              <CardDescription>Seu acesso está aguardando a confirmação do pagamento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/30 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">Plano selecionado</p>
                <p className="text-lg font-semibold text-primary">{pendingPaymentInfo.planName}</p>
              </div>
              <p className="text-sm text-muted-foreground text-center">Complete o pagamento para desbloquear todas as funcionalidades.</p>
              <Button onClick={handlePayNow} variant="fire" className="w-full" size="lg">
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

  // Determine daily action
  const getDailyAction = () => {
    if (canDoWeeklyCheckin) {
      return { label: "Check-in pendente", cta: "Registrar hoje", icon: ClipboardCheck, action: () => setShowWeeklyCheckin(true) };
    }
    if (needsEvolutionPhotos) {
      return { label: "Fotos de evolução", cta: "Enviar fotos", icon: Camera, action: () => navigate("/evolucao") };
    }
    return { label: "Treino disponível", cta: "Iniciar treino", icon: Dumbbell, action: () => navigate("/treino") };
  };

  const dailyAction = getDailyAction();

  const quickAccess = [
    { label: "Treino", icon: Dumbbell, href: "/treino" },
    { label: "Nutrição", icon: Utensils, href: "/nutricao" },
    { label: "Receitas", icon: ChefHat, href: "/receitas" },
    { label: "Evolução", icon: TrendingUp, href: "/evolucao" },
    { label: "Dados do Corpo", icon: Heart, href: "/dados-corpo" },
  ];

  return (
    <ClientLayout>
      <OnboardingTour />

      <div className="container mx-auto max-w-xl space-y-6">
        {/* Alerta de Anamnese Pendente */}
        {anamneseIncomplete && (
          <Card className="border-yellow-500/40 bg-yellow-500/5">
            <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-yellow-500" />
              </div>
              <CardTitle className="text-lg">Anamnese Pendente</CardTitle>
              <p className="text-sm text-muted-foreground max-w-sm">
                Preencha sua anamnese para que possamos gerar seus protocolos de treino, dieta e mentalidade personalizados.
              </p>
              {missingAnamneseFields.length > 0 && (
                <div className="w-full bg-muted/30 rounded-lg p-3 text-left">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Campos faltando:</p>
                  <p className="text-xs text-foreground">{missingAnamneseFields.join(" • ")}</p>
                </div>
              )}
              <Button variant="fire" size="lg" className="w-full mt-2" onClick={() => navigate("/anamnese")}>
                Preencher Anamnese Agora
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 1. Executive Status — ScoreRing */}
        <div className="flex flex-col items-center gap-4 py-4">
          <ScoreRing score={renascer.score} classification={renascer.classification} />
          <StatusBadge classification={renascer.classification} statusText={renascer.statusText} />
          {renascer.recommendation.length > 0 && (
            <p className="text-xs text-muted-foreground text-center max-w-xs">{renascer.recommendation[0]}</p>
          )}
        </div>

        {/* 2. Ação do Dia */}
        <div
          onClick={dailyAction.action}
          className="bg-card border border-border/50 hover:border-primary/30 transition-colors cursor-pointer rounded-lg p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <dailyAction.icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
            <div>
              <p className="text-sm font-medium text-foreground">{dailyAction.label}</p>
              <p className="text-xs text-muted-foreground">{dailyAction.cta}</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
        </div>

        {/* 3. Progresso — 3 indicadores */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card border border-border/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Consistência</p>
            <p className="text-lg font-semibold text-primary">
              {consistencyData?.hasEnoughData ? `${consistencyData.consistencyPercent}%` : "—"}
            </p>
            <p className="text-[10px] text-muted-foreground">últimos 7 dias</p>
          </div>
          <div className="bg-card border border-border/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Sequência</p>
            <p className="text-lg font-semibold text-primary">
              {streak.current_streak > 0 ? `${streak.current_streak} dias` : "—"}
            </p>
            <p className="text-[10px] text-muted-foreground">atual</p>
          </div>
          <div className="bg-card border border-border/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Evolução</p>
            <p className="text-lg font-semibold text-primary">
              {weightDelta != null ? `${weightDelta > 0 ? "+" : ""}${weightDelta} kg` : "—"}
            </p>
            <p className="text-[10px] text-muted-foreground">peso</p>
          </div>
        </div>

        {/* 4. Quick Access */}
        <div className="grid grid-cols-2 gap-3">
          {quickAccess.map((item) => {
            const isLocked = anamneseIncomplete;
            return (
              <div
                key={item.label}
                onClick={() => !isLocked && navigate(item.href)}
                className={`bg-card border rounded-lg p-4 flex items-center gap-3 transition-colors ${
                  isLocked
                    ? "border-border/30 opacity-50 cursor-not-allowed"
                    : "border-border/50 hover:border-primary/30 cursor-pointer"
                }`}
              >
                {isLocked ? (
                  <Lock className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
                ) : (
                  <item.icon className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
                )}
                <span className="text-sm font-medium text-foreground">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <WeeklyCheckinModal
        open={showWeeklyCheckin}
        onOpenChange={setShowWeeklyCheckin}
        onComplete={() => setCanDoWeeklyCheckin(false)}
      />
    </ClientLayout>
  );
}
