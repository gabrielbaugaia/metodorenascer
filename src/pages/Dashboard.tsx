import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, Utensils, Brain, BookOpen, MessageCircle, TrendingUp, Loader2, Crown, Settings, ShieldCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const dashboardCards = [
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

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { subscribed, loading: subLoading, createCheckout, openCustomerPortal, subscriptionEnd } = useSubscription();
  const { isAdmin } = useAdminCheck();
  const navigate = useNavigate();
  const [checkingAnamnese, setCheckingAnamnese] = useState(true);
  const [hasAnamnese, setHasAnamnese] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Check if anamnese is complete
  useEffect(() => {
    const checkAnamnese = async () => {
      if (!user) return;
      
      try {
        const { data } = await supabase
          .from("profiles")
          .select("age, weight, height, goals")
          .eq("id", user.id)
          .single();
        
        const complete = !!(data?.age && data?.weight && data?.height && data?.goals);
        setHasAnamnese(complete);
        
        // If not complete and has subscription, redirect to anamnese
        if (!complete && subscribed) {
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
  }, [user, subscribed, subLoading, navigate]);

  const handleSubscribe = async () => {
    try {
      await createCheckout();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível iniciar o checkout",
        variant: "destructive",
      });
    }
  };

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

  const isLoading = authLoading || subLoading || checkingAnamnese;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Subscription plans for non-subscribers
  const subscriptionPlans = [
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

  // Show subscription required screen (admins bypass this)
  if (!subscribed && !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-12 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-10">
              <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-6">
                <Crown className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold mb-4">Escolha seu Plano</h1>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Para acessar todo o conteúdo do Método Renascer, escolha o plano que melhor se adapta a você.
              </p>
            </div>

            <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
              {subscriptionPlans.map((plan) => (
                <Card 
                  key={plan.name} 
                  className={`relative p-5 flex flex-col ${plan.popular ? 'border-primary ring-1 ring-primary' : ''}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold rounded-full">
                      {plan.badge}
                    </div>
                  )}
                  {plan.savings && (
                    <div className="absolute top-2 right-2 bg-muted text-muted-foreground px-2 py-0.5 text-[10px] rounded">
                      {plan.savings}
                    </div>
                  )}
                  
                  <h3 className="font-bold text-lg mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-sm text-muted-foreground">R$</span>
                    <span className="text-2xl font-bold text-primary">{plan.price}</span>
                    <span className="text-xs text-muted-foreground">{plan.period}</span>
                  </div>
                  
                  <ul className="space-y-2 mb-4 flex-1 text-sm">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <span className="text-primary">✓</span>
                        <span className="text-muted-foreground text-xs">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    variant={plan.popular ? "fire" : "outline"} 
                    size="sm" 
                    className="w-full"
                    onClick={() => handleSelectPlan(plan.priceId)}
                  >
                    {plan.popular ? "GARANTIR VAGA" : "ESCOLHER"}
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Welcome */}
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

          {/* Subscription status */}
          {subscriptionEnd && (
            <Card variant="glass" className="mb-4 p-4 border-primary/20">
              <div className="flex items-center gap-3">
                <Crown className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">Assinatura Ativa</p>
                  <p className="text-xs text-muted-foreground">
                    Válida até {new Date(subscriptionEnd).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Progress bar */}
          <Card variant="glass" className="mb-8 p-6">
            <div className="flex items-center gap-4 mb-4">
              <TrendingUp className="w-6 h-6 text-primary" />
              <div>
                <h3 className="font-semibold text-foreground">Progresso do Mes</h3>
                <p className="text-sm text-muted-foreground">15 dias de treino completados</p>
              </div>
            </div>
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: "50%" }} />
            </div>
          </Card>

          {/* Main cards grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {dashboardCards.map((card, index) => (
              <Card
                key={card.title}
                variant="dashboard"
                className="group cursor-pointer animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => navigate(card.href)}
              >
                <CardHeader className="pb-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <card.icon className="w-7 h-7 text-foreground" />
                  </div>
                  <CardTitle className="text-3xl">{card.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{card.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

        </div>
      </main>
    </div>
  );
}
