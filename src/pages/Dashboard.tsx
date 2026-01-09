import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useActivityTracker } from "@/hooks/useActivityTracker";
import { useAchievements } from "@/hooks/useAchievements";
import { supabase } from "@/integrations/supabase/client";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { Target, Utensils, Brain, BookOpen, MessageCircle, Trophy, ClipboardCheck, CreditCard, Lock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { FullPageLoader } from "@/components/ui/loading-spinner";
import { PlanSelectionGrid } from "@/components/dashboard/PlanSelectionGrid";
import { DashboardCardsGrid } from "@/components/dashboard/DashboardCardsGrid";
import { SubscriptionStatusCard } from "@/components/dashboard/SubscriptionStatusCard";
import { StreakDisplay } from "@/components/gamification/StreakDisplay";
import { AchievementsGrid } from "@/components/gamification/AchievementsGrid";
import { WeeklyCheckinModal } from "@/components/checkin/WeeklyCheckinModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const DASHBOARD_CARDS = [
  {
    icon: Target,
    title: "Treino",
    description: "Seu plano de treino personalizado da semana",
    color: "from-orange-500 to-red-500",
    href: "/treino",
  },
  {
    icon: Utensils,
    title: "Nutricao",
    description: "Cardapio e orientacoes nutricionais",
    color: "from-green-500 to-emerald-500",
    href: "/nutricao",
  },
  {
    icon: Brain,
    title: "Mindset",
    description: "Materiais de desenvolvimento mental",
    color: "from-purple-500 to-violet-500",
    href: "/mindset",
  },
  {
    icon: BookOpen,
    title: "Receitas",
    description: "Biblioteca completa de receitas fitness",
    color: "from-blue-500 to-cyan-500",
    href: "/receitas",
  },
  {
    icon: MessageCircle,
    title: "Fale com Mentor",
    description: "Tire suas dúvidas com seu mentor 24h",
    color: "from-primary to-orange-600",
    href: "/suporte",
  },
];

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
  const { achievements, userAchievements, streak, totalPoints, loading: achievementsLoading } = useAchievements();
  useActivityTracker();
  const navigate = useNavigate();
  const [checkingAnamnese, setCheckingAnamnese] = useState(true);
  const [userName, setUserName] = useState<string>("");
  const [showAchievements, setShowAchievements] = useState(false);
  const [showWeeklyCheckin, setShowWeeklyCheckin] = useState(false);
  const [canDoWeeklyCheckin, setCanDoWeeklyCheckin] = useState(false);
  const [pendingPaymentInfo, setPendingPaymentInfo] = useState<{ planType: string; planName: string; priceId?: string } | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Redirecionar admins diretamente para o painel admin
  useEffect(() => {
    if (!authLoading && !adminLoading && isAdmin) {
      navigate("/admin");
    }
  }, [isAdmin, authLoading, adminLoading, navigate]);

  // Check if user can do weekly checkin
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

  // Check for pending payment status FIRST (before anamnese check)
  useEffect(() => {
    const checkPendingPayment = async () => {
      if (!user) {
        setCheckingPayment(false);
        return;
      }
      
      if (isAdmin) {
        setCheckingPayment(false);
        return;
      }
      
      try {
        const { data } = await supabase
          .from("subscriptions")
          .select("status, plan_type, plan_name")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (data?.status === "pending_payment") {
          // Map plan_type to Stripe price ID
          const priceIdMap: Record<string, string> = {
            elite_founder: "price_1ScZqTCuFZvf5xFdZuOBMzpt",
            mensal: "price_1ScZrECuFZvf5xFdfS9W8kvY",
            trimestral: "price_1ScZsTCuFZvf5xFdbW8kJeQF",
            semestral: "price_1ScZtrCuFZvf5xFd8iXDfbEp",
            anual: "price_1ScZvCCuFZvf5xFdjrs51JQB",
          };
          
          setPendingPaymentInfo({
            planType: data.plan_type || "mensal",
            planName: data.plan_name || "Plano",
            priceId: priceIdMap[data.plan_type || "mensal"],
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

  // Check anamnese ONLY after payment status is resolved
  useEffect(() => {
    const checkAnamneseAndGetName = async () => {
      if (!user) return;
      
      // Wait for payment check to complete first
      if (checkingPayment) return;
      
      // If pending payment, don't redirect to anamnese - stay here to show payment screen
      if (pendingPaymentInfo) {
        setCheckingAnamnese(false);
        return;
      }
      
      try {
        const { data } = await supabase
          .from("profiles")
          .select("age, weight, height, goals, anamnese_completa, full_name")
          .eq("id", user.id)
          .single();
        
        // Set user's first name for greeting
        if (data?.full_name) {
          const firstName = data.full_name.split(" ")[0];
          setUserName(firstName.toUpperCase());
        }
        
        // Check if anamnese is complete (either by flag or by essential fields)
        const hasEssentialData = !!(data?.age && data?.weight && data?.height && data?.goals);
        const anamneseComplete = data?.anamnese_completa === true || hasEssentialData;
        
        // Redirect to anamnese only for subscribed non-admin users with incomplete anamnese
        // Admins bypass anamnese requirement entirely
        if (!anamneseComplete && subscribed && !isAdmin) {
          navigate("/anamnese");
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

  const handleManageSubscription = async () => {
    try {
      await openCustomerPortal();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível abrir o portal",
        variant: "destructive",
      });
    }
  };

  const handleSelectPlan = async (priceId: string) => {
    try {
      await createCheckout(priceId);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível iniciar o checkout",
        variant: "destructive",
      });
    }
  };

  const isLoading = authLoading || subLoading || checkingAnamnese || checkingPayment;

  if (isLoading) {
    return <FullPageLoader />;
  }

  // Show pending payment screen
  if (pendingPaymentInfo && !isAdmin) {
    const handlePayNow = async () => {
      if (pendingPaymentInfo.priceId) {
        try {
          await createCheckout(pendingPaymentInfo.priceId);
        } catch (error) {
          toast({
            title: "Erro",
            description: "Não foi possível iniciar o pagamento",
            variant: "destructive",
          });
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
              <CardDescription>
                Seu acesso está aguardando a confirmação do pagamento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/30 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">Plano selecionado</p>
                <p className="text-lg font-semibold text-primary">{pendingPaymentInfo.planName}</p>
              </div>
              
              <p className="text-sm text-muted-foreground text-center">
                Complete o pagamento para desbloquear todas as funcionalidades do Método Renascer, incluindo treinos, nutrição e suporte com o mentor.
              </p>

              <Button onClick={handlePayNow} variant="fire" className="w-full" size="lg">
                <CreditCard className="mr-2 h-5 w-5" />
                Pagar Agora
              </Button>
              
              <p className="text-xs text-muted-foreground text-center">
                Pagamento seguro via Stripe. Após a confirmação, seu acesso será liberado automaticamente.
              </p>
            </CardContent>
          </Card>
        </div>
      </ClientLayout>
    );
  }

  if (!subscribed && !isAdmin) {
    return (
      <ClientLayout>
        <PlanSelectionGrid plans={SUBSCRIPTION_PLANS} onSelectPlan={handleSelectPlan} />
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <OnboardingTour />
      
      <div className="container mx-auto max-w-6xl">
        {/* Welcome Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold uppercase text-foreground mb-2">
              BEM-VINDO, <span className="text-primary">{userName || "ALUNO"}</span>
            </h1>
            <p className="text-muted-foreground">Sua jornada de transformacao continua hoje</p>
          </div>
          
          {/* Streak compact display */}
          <div className="flex items-center gap-3">
            <StreakDisplay 
              currentStreak={streak.current_streak} 
              longestStreak={streak.longest_streak} 
              compact 
            />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowAchievements(!showAchievements)}
              className="gap-2"
            >
              <Trophy className="h-4 w-4 text-yellow-500" />
              {totalPoints} pts
            </Button>
          </div>
        </div>

        {/* Weekly Checkin Prompt */}
        {canDoWeeklyCheckin && (
          <Card className="mb-6 border-primary/30 bg-primary/5">
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <ClipboardCheck className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Check-in semanal disponível</p>
                  <p className="text-sm text-muted-foreground">Registre como foi sua semana em 1 minuto</p>
                </div>
              </div>
              <Button size="sm" onClick={() => setShowWeeklyCheckin(true)}>
                Fazer agora
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Achievements Section (collapsible) */}
        {showAchievements && (
          <div className="mb-8 animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Minhas Conquistas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AchievementsGrid 
                  achievements={achievements}
                  userAchievements={userAchievements}
                  totalPoints={totalPoints}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Streak Full Display */}
        <div className="mb-8">
          <StreakDisplay 
            currentStreak={streak.current_streak} 
            longestStreak={streak.longest_streak} 
          />
        </div>

        {/* Subscription Status */}
        {subscriptionEnd && (
          <SubscriptionStatusCard subscriptionEnd={subscriptionEnd} />
        )}

        {/* Main Dashboard Cards */}
        <DashboardCardsGrid cards={DASHBOARD_CARDS} />
      </div>

      {/* Weekly Checkin Modal */}
      <WeeklyCheckinModal 
        open={showWeeklyCheckin} 
        onOpenChange={setShowWeeklyCheckin}
        onComplete={() => setCanDoWeeklyCheckin(false)}
      />
    </ClientLayout>
  );
}
