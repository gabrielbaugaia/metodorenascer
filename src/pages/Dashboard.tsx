import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, Utensils, Brain, BookOpen, MessageCircle, TrendingUp, Loader2, Crown, Settings } from "lucide-react";
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
];

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { subscribed, loading: subLoading, createCheckout, openCustomerPortal, subscriptionEnd } = useSubscription();
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

  // Show subscription required screen
  if (!subscribed) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-12 px-4">
          <div className="container mx-auto max-w-lg text-center">
            <Card className="p-8">
              <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-6">
                <Crown className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-4">Assinatura Necessária</h1>
              <p className="text-muted-foreground mb-6">
                Para acessar todo o conteúdo do Método Renascer, você precisa de uma assinatura ativa.
              </p>
              <div className="bg-muted/50 rounded-lg p-4 mb-6">
                <p className="text-3xl font-bold text-primary">R$ 49,90</p>
                <p className="text-sm text-muted-foreground">por mês</p>
              </div>
              <Button onClick={handleSubscribe} size="lg" className="w-full">
                Assinar Agora
              </Button>
            </Card>
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
              <h1 className="font-display text-4xl md:text-5xl text-foreground mb-2">
                BEM-VINDO, <span className="text-gradient">GUERREIRO</span>
              </h1>
              <p className="text-muted-foreground">Sua jornada de transformacao continua hoje</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleManageSubscription}>
              <Settings className="w-4 h-4 mr-2" />
              Gerenciar Assinatura
            </Button>
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

          {/* WhatsApp support card */}
          <Card variant="glass" className="p-6 cursor-pointer hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Suporte 24h via WhatsApp</h3>
                <p className="text-sm text-muted-foreground">Tire suas duvidas a qualquer momento</p>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
