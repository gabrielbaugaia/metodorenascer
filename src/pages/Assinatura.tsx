import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEntitlements } from "@/hooks/useEntitlements";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Calendar,
  CreditCard,
  Gift,
  Clock,
  CheckCircle2,
  Loader2,
  Crown,
  ArrowRight,
  Sparkles,
  Check,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MAX_ELITE_FUNDADOR_MEMBERS, PLAN_TYPES } from "@/lib/planConstants";

const STRIPE_TRIAL_LINK = "https://buy.stripe.com/9B67sKeMW4ru2sp7Gy2B201";
const STRIPE_DIRECT_LINK = "https://buy.stripe.com/fZu3cudIS3nqaYVf902B205";

interface Subscription {
  id: string;
  status: string;
  plan_type: string;
  current_period_start: string | null;
  current_period_end: string | null;
  price_cents: number | null;
}

interface Profile {
  cashback_balance: number | null;
  full_name: string;
}

const plans = [
  {
    id: PLAN_TYPES.ELITE_FUNDADOR,
    name: "ELITE FUNDADOR",
    price: 4990,
    priceDisplay: "R$ 49,90",
    period: "/mês",
    priceId: "price_1ScZqTCuFZvf5xFdZuOBMzpt",
    features: ["Treino personalizado", "Nutrição personalizada", "Mindset", "Suporte 24h"],
    popular: false,
    dualCta: true,
    color: "primary",
  },
  {
    id: PLAN_TYPES.TRIMESTRAL,
    name: "TRIMESTRAL",
    price: 49700,
    priceDisplay: "R$ 497,00",
    period: "/3 meses",
    priceId: "price_1ScZsTCuFZvf5xFdbW8kJeQF",
    features: ["Treino personalizado", "Nutrição personalizada", "Mindset", "Suporte 24h", "Economia de 16%"],
    popular: true,
    dualCta: false,
    color: "primary",
  },
  {
    id: PLAN_TYPES.ANUAL,
    name: "ANUAL",
    price: 99700,
    priceDisplay: "R$ 997,00",
    period: "/ano",
    priceId: "price_1ScZvCCuFZvf5xFdjrs51JQB",
    features: ["Treino personalizado", "Nutrição personalizada", "Mindset", "Suporte 24h", "Economia de 58%"],
    popular: false,
    dualCta: false,
    color: "muted",
  },
];

export default function Assinatura() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { effectiveLevel } = useEntitlements();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [embaixadorCount, setEmbaixadorCount] = useState<number>(0);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [subResult, profileResult, embaixadorResult] = await Promise.all([
        supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user!.id)
          .eq("status", "active")
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("cashback_balance, full_name")
          .eq("id", user!.id)
          .maybeSingle(),
        supabase
          .from("subscriptions")
          .select("*", { count: "exact", head: true })
          .eq("plan_type", PLAN_TYPES.ELITE_FUNDADOR)
          .eq("status", "active"),
      ]);

      if (subResult.data) setSubscription(subResult.data);
      if (profileResult.data) setProfile(profileResult.data);
      setEmbaixadorCount(embaixadorResult.count || 0);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const availablePlans = plans.filter((plan) => {
    if (plan.id === PLAN_TYPES.ELITE_FUNDADOR && embaixadorCount >= MAX_ELITE_FUNDADOR_MEMBERS) {
      return false;
    }
    return true;
  });

  const handleRenewPlan = async (plan: (typeof plans)[0]) => {
    if (!user) return;

    setProcessingPlan(plan.id);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: plan.priceId },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (error) {
      console.error("Erro ao criar checkout:", error);
      toast.error("Erro ao processar renovação");
    } finally {
      setProcessingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (error) {
      console.error("Erro ao abrir portal:", error);
      toast.error("Erro ao abrir gerenciamento de assinatura");
    }
  };

  const calculateProgress = () => {
    if (!subscription?.current_period_start || !subscription?.current_period_end) return 0;
    const start = new Date(subscription.current_period_start);
    const end = new Date(subscription.current_period_end);
    const now = new Date();
    const totalDays = differenceInDays(end, start);
    const usedDays = differenceInDays(now, start);
    return Math.min(Math.max((usedDays / totalDays) * 100, 0), 100);
  };

  const getDaysRemaining = () => {
    if (!subscription?.current_period_end) return 0;
    return Math.max(differenceInDays(new Date(subscription.current_period_end), new Date()), 0);
  };

  const cashbackAmount = profile?.cashback_balance || 0;
  const cashbackValue = cashbackAmount * 10;

  if (authLoading || loading) {
    return (
      <ClientLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Minha Assinatura</h1>
          <p className="text-muted-foreground">Gerencie seu plano e renove sua transformação</p>
        </div>

        {/* Status da Assinatura Atual */}
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20 shrink-0">
                  <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-base sm:text-lg">Status da Assinatura</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {subscription ? "Sua assinatura está ativa" : "Você não possui assinatura ativa"}
                  </CardDescription>
                </div>
              </div>
              {subscription && (
                <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30 w-fit">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Ativo
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {subscription ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">Início</span>
                    </div>
                    <p className="font-semibold">
                      {subscription.current_period_start
                        ? format(new Date(subscription.current_period_start), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                        : "-"}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">Término</span>
                    </div>
                    <p className="font-semibold">
                      {subscription.current_period_end
                        ? format(new Date(subscription.current_period_end), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                        : "-"}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <CreditCard className="h-4 w-4" />
                      <span className="text-sm">Plano</span>
                    </div>
                    <p className="font-semibold capitalize">{subscription.plan_type || "Padrão"}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progresso do período</span>
                    <span className="font-medium">{getDaysRemaining()} dias restantes</span>
                  </div>
                  <Progress value={calculateProgress()} className="h-2" />
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">Escolha um plano abaixo para começar sua transformação</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cashback */}
        {cashbackAmount > 0 && (
          <Card className="border-green-500/30 bg-green-500/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <Gift className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <CardTitle className="text-green-400">Cashback Disponível</CardTitle>
                  <CardDescription>Você tem créditos de indicação para usar na renovação</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-green-400">
                    {cashbackAmount} {cashbackAmount === 1 ? "indicação" : "indicações"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Equivale a {cashbackValue}% de desconto na próxima renovação
                  </p>
                </div>
                <Sparkles className="h-10 w-10 text-green-400/50" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Planos */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{subscription ? "Renovar ou Estender Plano" : "Escolha seu Plano"}</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {availablePlans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative transition-all hover:border-primary/50 ${
                  plan.popular ? "border-primary ring-1 ring-primary/20" : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">Mais Popular</Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">{plan.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">{plan.priceDisplay}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  {cashbackAmount > 0 && (
                    <p className="text-sm text-green-400 mt-1">
                      Com cashback: R$ {((plan.price - (plan.price * cashbackValue) / 100) / 100).toFixed(2).replace(".", ",")}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {plan.dualCta ? (
                    <div className="space-y-2">
                      <Button
                        variant="fire"
                        className="w-full"
                        onClick={() => window.open(STRIPE_TRIAL_LINK, "_blank")}
                      >
                        Testar 7 dias grátis
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => window.open(STRIPE_DIRECT_LINK, "_blank")}
                      >
                        Assinar agora
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleRenewPlan(plan)}
                      disabled={processingPlan === plan.id}
                      className="w-full"
                      variant={plan.popular ? "default" : "outline"}
                    >
                      {processingPlan === plan.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          {subscription ? "Renovar" : "Assinar"}
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Link para Indicações */}
        <Card className="bg-muted/30">
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Gift className="h-6 w-6 sm:h-8 sm:w-8 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-sm sm:text-base">Indique e Ganhe</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Ganhe 10% de cashback para cada amigo que assinar
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate("/indicacoes")} className="w-full sm:w-auto">
                Ver Indicações
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ClientLayout>
  );
}
