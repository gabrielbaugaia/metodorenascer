import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Flame } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const plans = [
  {
    name: "EMBAIXADOR",
    price: "49,90",
    period: "/mes",
    badge: "25 VAGAS",
    features: [
      "Treino personalizado",
      "Receitas exclusivas",
      "Fale com Mentor 24h",
      "Dashboard de progresso",
      "Analise de fotos",
      "Acesso vitalicio ao preco"
    ],
    popular: true,
    promotional: true
  },
  {
    name: "MENSAL",
    price: "197",
    period: "/mes",
    features: [
      "Treino personalizado",
      "Receitas exclusivas",
      "Fale com Mentor 24h",
      "Dashboard de progresso",
      "Analise de fotos e videos"
    ],
    popular: false
  },
  {
    name: "TRIMESTRAL",
    price: "497",
    period: "/3 meses",
    savings: "Economize R$94",
    features: [
      "Tudo do plano Mensal",
      "Check-ins semanais",
      "Ajustes de protocolo",
      "Consultoria nutricional"
    ],
    popular: false
  },
  {
    name: "SEMESTRAL",
    price: "697",
    period: "/6 meses",
    savings: "Economize R$485",
    features: [
      "Tudo do plano Trimestral",
      "Plano nutricional avancado",
      "Suporte prioritario",
      "Acesso a comunidade"
    ],
    popular: false
  },
  {
    name: "ANUAL",
    price: "997",
    period: "/ano",
    savings: "Economize R$1.367",
    features: [
      "Tudo do plano Semestral",
      "Mentoria exclusiva",
      "Acesso a comunidade VIP",
      "Bonus: E-books exclusivos"
    ],
    popular: false
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

        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-7xl mx-auto mt-12">
          {plans.map((plan, index) => (
            <Card 
              key={plan.name}
              className={`relative overflow-hidden animate-fade-in transition-all duration-300 ${
                plan.popular 
                  ? 'bg-primary/10 border-primary/50 md:scale-105' 
                  : 'bg-card border-border/50'
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-bold">
                  {plan.badge || "RECOMENDADO"}
                </div>
              )}
              
              {plan.savings && (
                <div className="absolute top-0 left-0 bg-green-600 text-white px-2 py-1 text-xs font-bold">
                  {plan.savings}
                </div>
              )}
              
              <CardContent className="p-6">
                <h3 className="font-display text-xl text-foreground mb-3">{plan.name}</h3>
                
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-lg text-muted-foreground">R$</span>
                  <span className="font-display text-4xl text-primary">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  variant={plan.popular ? "fire" : "outline"} 
                  size="sm" 
                  className="w-full"
                  asChild
                >
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                    {plan.promotional ? "Garantir Vaga" : "Escolher Plano"}
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
