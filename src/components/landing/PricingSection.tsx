import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { MAX_ELITE_FUNDADOR_MEMBERS, PLAN_TYPES } from "@/lib/planConstants";
import { useAnalytics } from "@/hooks/useAnalytics";

const STRIPE_TRIAL_LINK = 'https://buy.stripe.com/9B67sKeMW4ru2sp7Gy2B201';
const STRIPE_DIRECT_LINK = 'https://buy.stripe.com/fZu3cudIS3nqaYVf902B205';

const visiblePlans = [
  {
    id: PLAN_TYPES.ELITE_FUNDADOR,
    name: "Elite Fundador",
    price: "49,90",
    period: "/mês",
    badge: "25 VAGAS",
    priceId: "price_1ScZqTCuFZvf5xFdZuOBMzpt",
    description: "Teste o método por 7 dias com acesso parcial para conhecer a plataforma antes de desbloquear tudo.",
    features: [
      "Prescrição personalizada de treino, nutrição e mentalidade",
      "Acesso completo ao app",
      "Check-ins e ajustes contínuos",
      "Receitas inteligentes",
      "Acompanhamento de evolução",
    ],
    popular: true,
    promotional: true,
    dualCta: true,
    footnote: "Acesso parcial no trial. Desbloqueio completo após ativação.",
  },
  {
    id: PLAN_TYPES.TRIMESTRAL,
    name: "Trimestral",
    price: "497",
    period: "/3 meses",
    monthlyEquivalent: "R$165,67/mês",
    priceId: "price_1ScZsTCuFZvf5xFdbW8kJeQF",
    savings: "RECOMENDADO",
    description: "Compromisso mínimo para consolidar resultados.",
    features: [
      "Prescrição personalizada de treino, nutrição e mentalidade",
      "Acesso completo ao app",
      "Check-ins e ajustes contínuos",
      "Receitas inteligentes",
      "Acompanhamento de evolução",
    ],
    popular: false,
    dualCta: false,
    ctaText: "Assumir o compromisso",
  },
  {
    id: PLAN_TYPES.ANUAL,
    name: "Anual",
    price: "997",
    period: "/ano",
    monthlyEquivalent: "R$83,08/mês",
    priceId: "price_1ScZvCCuFZvf5xFdjrs51JQB",
    savings: "Economia de 58%",
    description: "Transformação completa com melhor custo-benefício.",
    features: [
      "Prescrição personalizada de treino, nutrição e mentalidade",
      "Acesso completo ao app",
      "Check-ins e ajustes contínuos",
      "Receitas inteligentes",
      "Acompanhamento de evolução",
    ],
    popular: false,
    dualCta: false,
    ctaText: "Acelerar resultados",
  },
];

export function PricingSection() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });
  const { createCheckout } = useSubscription();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [embaixadorCount, setEmbaixadorCount] = useState(0);
  const { trackPlanClicked, trackPlanView } = useAnalytics();

  useEffect(() => {
    if (isVisible) {
      trackPlanView();
    }
  }, [isVisible, trackPlanView]);

  useEffect(() => {
    const fetchEliteFundadorCount = async () => {
      const { count } = await supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("plan_type", PLAN_TYPES.ELITE_FUNDADOR)
        .eq("status", "active");
      setEmbaixadorCount(count || 0);
    };
    fetchEliteFundadorCount();
  }, []);

  // Filter out Elite Fundador if limit reached
  const plans = visiblePlans.filter((plan) => {
    if (plan.id === PLAN_TYPES.ELITE_FUNDADOR && embaixadorCount >= MAX_ELITE_FUNDADOR_MEMBERS) {
      return false;
    }
    return true;
  });

  const handleSelectPlan = async (priceId: string, planName: string) => {
    try {
      trackPlanClicked(planName, priceId);
      await createCheckout(priceId);
    } catch (error) {
      console.error("Error creating checkout:", error);
      toast.error("Erro ao iniciar checkout. Tente novamente.");
    }
  };

  return (
    <section
      ref={ref}
      id="preco"
      className={`py-20 md:py-28 section-dark transition-all duration-1000 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
    >
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-14 max-w-3xl mx-auto flex flex-col items-center gap-4">
          <h2 className="font-display font-black text-foreground text-[2.5rem] sm:text-4xl md:text-5xl lg:text-6xl leading-[1.1] tracking-tight">
            Escolha como você quer evoluir
          </h2>
          <p className="text-base md:text-lg leading-relaxed text-center max-w-xl text-muted-foreground">
            Sem fidelidade forçada. Cancele quando quiser.
          </p>
          <p className="text-base md:text-lg leading-relaxed text-center max-w-xl text-muted-foreground">
            O método é o mesmo. Você escolhe o ritmo e a condição que fazem sentido para sua fase.
          </p>
          <p className="text-primary text-sm font-medium">
            Garantia de 7 dias. Não gostou? Devolvemos 100%.
          </p>
        </div>

        {/* Plan Cards */}
        <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <Card
              key={plan.name}
              className={`relative overflow-hidden animate-fade-in transition-all duration-300 h-full ${
                plan.popular
                  ? "border-primary bg-card md:scale-105"
                  : "bg-card border-border/50"
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {plan.popular && plan.badge && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold rounded-bl-lg">
                  {plan.badge}
                </div>
              )}

              {plan.savings && !plan.popular && (
                <div className="absolute top-0 left-0 bg-muted text-muted-foreground px-2 py-1 text-xs font-medium rounded-br-lg">
                  {plan.savings}
                </div>
              )}

              <CardContent className="p-5 flex flex-col h-full">
                <h3 className="font-display text-xl text-foreground mb-2">
                  {plan.name}
                </h3>

                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-sm text-muted-foreground">R$</span>
                  <span className="font-display text-3xl text-primary">
                    {plan.price}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {plan.period}
                  </span>
                </div>
                {plan.monthlyEquivalent ? (
                  <p className="text-xs text-muted-foreground mb-4">
                    {plan.monthlyEquivalent}
                  </p>
                ) : (
                  <div className="mb-4" />
                )}

                {plan.description && (
                  <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                    {plan.description}
                  </p>
                )}

                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-muted-foreground">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {plan.dualCta ? (
                  <div className="space-y-2 mt-auto">
                    <Button
                      variant="fire"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        trackPlanClicked(plan.name, 'trial');
                        window.open(STRIPE_TRIAL_LINK, '_blank');
                      }}
                    >
                      Testar 7 dias grátis
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        trackPlanClicked(plan.name, 'direct');
                        window.open(STRIPE_DIRECT_LINK, '_blank');
                      }}
                    >
                      Assinar agora
                    </Button>
                    {plan.footnote && (
                      <p className="text-[10px] text-muted-foreground text-center leading-tight">
                        {plan.footnote}
                      </p>
                    )}
                  </div>
                ) : (
                  <Button
                    variant={plan.popular ? "fire" : "outline"}
                    size="sm"
                    className="w-full mt-auto"
                    onClick={() => handleSelectPlan(plan.priceId, plan.name)}
                  >
                    {plan.ctaText || "ESCOLHER PLANO"}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
