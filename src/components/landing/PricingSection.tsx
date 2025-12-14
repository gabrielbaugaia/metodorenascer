import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Flame } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const plans = [
  {
    name: "INICIAL",
    price: "97",
    period: "/mes",
    features: [
      "Treino personalizado IA",
      "Receitas geradas por IA",
      "Suporte WhatsApp",
      "Dashboard de progresso",
      "Analise de fotos"
    ],
    popular: false
  },
  {
    name: "PREMIUM",
    price: "197",
    period: "/mes",
    features: [
      "Tudo do plano Inicial",
      "Consultoria individual",
      "Video-chamadas semanais",
      "Analise de video em tempo real",
      "Plano nutricional avancado",
      "Acesso prioritario"
    ],
    popular: true
  }
];

export function PricingSection() {
  const whatsappLink = "https://wa.me/5511999999999?text=Quero%20reservar%20minha%20vaga%20no%20Método%20Renascer";
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <section ref={ref} id="preco" className={`py-24 section-dark transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6">
            <Flame className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-primary uppercase tracking-wider">50 Vagas Restantes</span>
          </div>
          
          <h2 className="font-display text-4xl md:text-6xl text-foreground mb-4 italic">
            PLANO <span className="text-primary">INAUGURAL</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg mb-2">
            R$97/mes com 90 dias de garantia total
          </p>
          <p className="text-primary font-semibold">
            Nao gostou? Devolvemos 100% do seu investimento.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-12">
          {plans.map((plan, index) => (
            <Card 
              key={plan.name}
              className={`relative overflow-hidden animate-fade-in transition-all duration-300 ${
                plan.popular 
                  ? 'bg-primary/10 border-primary/50 scale-105' 
                  : 'bg-card border-border/50'
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1 text-sm font-bold">
                  RECOMENDADO
                </div>
              )}
              
              <CardContent className="p-8">
                <h3 className="font-display text-2xl text-foreground mb-4">{plan.name}</h3>
                
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-2xl text-muted-foreground">R$</span>
                  <span className="font-display text-6xl text-primary">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  variant={plan.popular ? "fire" : "outline"} 
                  size="lg" 
                  className="w-full"
                  asChild
                >
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                    Escolher Plano
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
