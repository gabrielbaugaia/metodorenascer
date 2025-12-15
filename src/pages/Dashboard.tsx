import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useActivityTracker } from "@/hooks/useActivityTracker";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Target, Utensils, Brain, BookOpen, MessageCircle, Settings, ShieldCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { FullPageLoader } from "@/components/ui/loading-spinner";
import { PlanSelectionGrid } from "@/components/dashboard/PlanSelectionGrid";
import { DashboardCardsGrid } from "@/components/dashboard/DashboardCardsGrid";
import { SubscriptionStatusCard } from "@/components/dashboard/SubscriptionStatusCard";

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
  useActivityTracker();
  const navigate = useNavigate();
  const [checkingAnamnese, setCheckingAnamnese] = useState(true);

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

  useEffect(() => {
    const checkAnamnese = async () => {
      if (!user) return;
      
      try {
        const { data } = await supabase
          .from("profiles")
          .select("age, weight, height, goals, anamnese_completa")
          .eq("id", user.id)
          .single();
        
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
    
    if (!subLoading) {
      checkAnamnese();
    }
  }, [user, subscribed, isAdmin, subLoading, navigate]);

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

  const isLoading = authLoading || subLoading || checkingAnamnese;

  if (isLoading) {
    return <FullPageLoader />;
  }

  if (!subscribed && !isAdmin) {
    return (
      <>
        <Header />
        <PlanSelectionGrid plans={SUBSCRIPTION_PLANS} onSelectPlan={handleSelectPlan} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <OnboardingTour />
      
      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Welcome Header */}
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold uppercase text-foreground mb-2">
                BEM-VINDO, <span className="text-primary">GUERREIRO</span>
              </h1>
              <p className="text-muted-foreground">Sua jornada de transformacao continua hoje</p>
            </div>
            <div className="flex gap-2">
              {isAdmin && (
                <Button variant="outline" size="sm" onClick={() => navigate("/admin")}>
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Admin
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleManageSubscription}>
                <Settings className="w-4 h-4 mr-2" />
                Gerenciar Assinatura
              </Button>
            </div>
          </div>

          {/* Subscription Status */}
          {subscriptionEnd && (
            <SubscriptionStatusCard subscriptionEnd={subscriptionEnd} />
          )}

          {/* Main Dashboard Cards */}
          <DashboardCardsGrid cards={DASHBOARD_CARDS} />
        </div>
      </main>
    </div>
  );
}
