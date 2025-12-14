import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const plans = [
  {
    name: "Embaixador",
    price: "49,90",
    period: "/mês",
    badge: "25 VAGAS",
    priceId: "price_1ScZqTCuFZvf5xFdZuOBMzpt",
    features: ["Treino personalizado", "Receitas exclusivas", "Fale com Mentor 24h", "Dashboard de progresso", "Análise de fotos", "Preço vitalício"],
    popular: true,
    promotional: true
  },
  {
    name: "Mensal",
    price: "197",
    period: "/mês",
    priceId: "price_1ScZrECuFZvf5xFdfS9W8kvY",
    features: ["Treino personalizado", "Receitas exclusivas", "Fale com Mentor 24h", "Dashboard de progresso", "Análise de fotos e vídeos"],
    popular: false
  },
  {
    name: "Trimestral",
    price: "497",
    period: "/3 meses",
    priceId: "price_1ScZsTCuFZvf5xFdbW8kJeQF",
    savings: "Economize R$94",
    features: ["Tudo do plano Mensal", "Check-ins semanais", "Ajustes de protocolo", "Consultoria nutricional"],
    popular: false
  },
  {
    name: "Semestral",
    price: "697",
    period: "/6 meses",
    priceId: "price_1ScZtrCuFZvf5xFd8iXDfbEp",
    savings: "Economize R$485",
    features: ["Tudo do plano Trimestral", "Plano nutricional avançado", "Suporte prioritário", "Acesso à comunidade"],
    popular: false
  },
  {
    name: "Anual",
    price: "997",
    period: "/ano",
    priceId: "price_1ScZvCCuFZvf5xFdjrs51JQB",
    savings: "Economize R$1.367",
    features: ["Tudo do plano Semestral", "Mentoria exclusiva", "Acesso à comunidade VIP", "Bônus: E-books exclusivos"],
    popular: false
  }
];

export function PricingSection() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });
  const { createCheckout } = useSubscription();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSelectPlan = async (priceId: string) => {
    if (!user) {
      toast.info("Faça login para continuar com a assinatura");
      navigate("/auth");
      return;
    }
    try {
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
      className={`py-20 md:py-28 section-dark transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
    >
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-14 max-w-3xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-foreground mb-5 tracking-wide">
            Plano <span className="text-primary">Embaixador</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed mb-4">
            De R$197/mês por apenas R$49/mês — os embaixadores terão preço vitalício sem acréscimos. 
            Apenas para os primeiros 25 clientes cadastrados. Não perca essa oportunidade única.
          </p>
          <p className="text-primary text-sm font-medium">
            Não gostou? Devolvemos 100% do seu investimento.
          </p>
        </div>

        {/* Plan Cards */}
        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-5 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={plan.name} 
              className={`relative overflow-hidden animate-fade-in transition-all duration-300 h-full ${
                plan.popular 
                  ? 'border-primary bg-card md:scale-105' 
                  : 'bg-card border-border/50'
              }`} 
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {plan.popular && (
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
                <h3 className="font-display text-xl text-foreground mb-2">{plan.name}</h3>
                
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-sm text-muted-foreground">R$</span>
                  <span className="font-display text-3xl text-primary">{plan.price}</span>
                  <span className="text-xs text-muted-foreground">{plan.period}</span>
                </div>

                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map(feature => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  variant={plan.popular ? "fire" : "outline"} 
                  size="sm" 
                  className="w-full mt-auto" 
                  onClick={() => handleSelectPlan(plan.priceId)}
                >
                  {plan.promotional ? "GARANTIR VAGA" : "ESCOLHER PLANO"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
