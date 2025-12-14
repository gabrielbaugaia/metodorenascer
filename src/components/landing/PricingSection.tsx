import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Flame } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
const plans = [{
  name: "EMBAIXADOR",
  price: "49,90",
  period: "/mes",
  badge: "25 VAGAS",
  priceId: "price_1ScZqTCuFZvf5xFdZuOBMzpt",
  features: ["Treino personalizado", "Receitas exclusivas", "Fale com Mentor 24h", "Dashboard de progresso", "Analise de fotos", "Acesso vitalicio ao preco"],
  popular: true,
  promotional: true
}, {
  name: "MENSAL",
  price: "197",
  period: "/mes",
  priceId: "price_1ScZrECuFZvf5xFdfS9W8kvY",
  features: ["Treino personalizado", "Receitas exclusivas", "Fale com Mentor 24h", "Dashboard de progresso", "Analise de fotos e videos"],
  popular: false
}, {
  name: "TRIMESTRAL",
  price: "497",
  period: "/3 meses",
  priceId: "price_1ScZsTCuFZvf5xFdbW8kJeQF",
  savings: "Economize R$94",
  features: ["Tudo do plano Mensal", "Check-ins semanais", "Ajustes de protocolo", "Consultoria nutricional"],
  popular: false
}, {
  name: "SEMESTRAL",
  price: "697",
  period: "/6 meses",
  priceId: "price_1ScZtrCuFZvf5xFd8iXDfbEp",
  savings: "Economize R$485",
  features: ["Tudo do plano Trimestral", "Plano nutricional avancado", "Suporte prioritario", "Acesso a comunidade"],
  popular: false
}, {
  name: "ANUAL",
  price: "997",
  period: "/ano",
  priceId: "price_1ScZvCCuFZvf5xFdjrs51JQB",
  savings: "Economize R$1.367",
  features: ["Tudo do plano Semestral", "Mentoria exclusiva", "Acesso a comunidade VIP", "Bonus: E-books exclusivos"],
  popular: false
}];
export function PricingSection() {
  const {
    ref,
    isVisible
  } = useScrollAnimation({
    threshold: 0.1
  });
  const {
    createCheckout
  } = useSubscription();
  const {
    user
  } = useAuth();
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
  return <section ref={ref} id="preco" className={`py-24 section-dark transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6">
            <Flame className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-primary uppercase tracking-wider">50 Vagas Restantes</span>
          </div>
          
          <h2 className="font-display text-4xl md:text-6xl text-foreground mb-4 italic">
            PLANO <span className="text-primary">EMBAIXADOR</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg mb-2">De R$197/mês por apenas R$49/mês os embaixadores terão preço 
vitalício sem acréscimos eternamente. Apenas para os
 primeiros 25 clientes cadastrados. Não perca OPORTUNIDADE ÚNICA.</p>
          <p className="text-primary font-semibold">
            Nao gostou? Devolvemos 100% do seu investimento.
          </p>
        </div>

        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-7xl mx-auto mt-12">
          {plans.map((plan, index) => <Card key={plan.name} className={`relative overflow-hidden animate-fade-in transition-all duration-300 ${plan.popular ? 'bg-primary/10 border-primary/50 md:scale-105' : 'bg-card border-border/50'}`} style={{
          animationDelay: `${index * 0.1}s`
        }}>
              {plan.popular && <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-bold">
                  {plan.badge || "RECOMENDADO"}
                </div>}
              
              {plan.savings && <div className="absolute top-0 left-0 bg-green-600 text-white px-2 py-1 text-xs font-bold">
                  {plan.savings}
                </div>}
              
              <CardContent className="p-6">
                <h3 className="font-display text-xl text-foreground mb-3">{plan.name}</h3>
                
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-lg text-muted-foreground">R$</span>
                  <span className="font-display text-4xl text-primary">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.map(feature => <li key={feature} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>)}
                </ul>

                <Button variant={plan.popular ? "fire" : "outline"} size="sm" className="w-full" onClick={() => handleSelectPlan(plan.priceId)}>
                  {plan.promotional ? "Garantir Vaga" : "Escolher Plano"}
                </Button>
              </CardContent>
            </Card>)}
        </div>
      </div>
    </section>;
}