import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Star, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    id: "elite-fundador",
    name: "ELITE Fundador",
    price: 49.90,
    originalPrice: 197.00,
    interval: "mês",
    description: "Vagas limitadas - Primeiros 25 membros",
    features: [
      "Treino personalizado",
      "Plano nutricional estratégico",
      "Suporte WhatsApp 24h",
      "Acesso à comunidade VIP",
      "Acompanhamento semanal",
    ],
    popular: true,
    icon: Crown,
    priceId: "price_1ScZqTCuFZvf5xFdZuOBMzpt",
  },
  {
    id: "mensal",
    name: "Mensal",
    price: 197.00,
    interval: "mês",
    description: "Compromisso mínimo",
    features: [
      "Treino personalizado",
      "Plano nutricional",
      "Suporte WhatsApp",
      "Acesso à comunidade",
    ],
    popular: false,
    icon: Zap,
    priceId: "price_1ScZrECuFZvf5xFdfS9W8kvY",
  },
  {
    id: "trimestral",
    name: "Trimestral",
    price: 497.00,
    originalPrice: 591.00,
    interval: "trimestre",
    description: "Economia de 16%",
    features: [
      "Tudo do plano mensal",
      "Receitas exclusivas",
      "Aulas de mindset",
      "Prioridade no suporte",
    ],
    popular: false,
    icon: Star,
    priceId: "price_1ScZsTCuFZvf5xFdbW8kJeQF",
  },
  {
    id: "semestral",
    name: "Semestral",
    price: 697.00,
    originalPrice: 1182.00,
    interval: "semestre",
    description: "Economia de 41%",
    features: [
      "Tudo do trimestral",
      "Consultoria nutricional",
      "Análise de progresso mensal",
      "Bônus: E-book fitness",
    ],
    popular: false,
    icon: Star,
    priceId: "price_1ScZtrCuFZvf5xFd8iXDfbEp",
  },
  {
    id: "anual",
    name: "Anual",
    price: 997.00,
    originalPrice: 2364.00,
    interval: "ano",
    description: "Economia de 58%",
    features: [
      "Tudo do semestral",
      "Mentoria individual",
      "Plano 100% personalizado",
      "Acesso vitalício a bônus",
    ],
    popular: false,
    icon: Crown,
    priceId: "price_1ScZvCCuFZvf5xFdjrs51JQB",
  },
];

export function PricingSection() {
  return (
    <section id="planos" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      
      <div className="relative z-10 container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-6xl text-foreground mb-4">
            ESCOLHA SEU <span className="text-gradient glow-text">PLANO</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Invista em voce e comece sua transformacao hoje
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative flex flex-col transition-all duration-300 hover:scale-105 ${
                plan.popular 
                  ? "border-primary shadow-lg shadow-primary/20 scale-105" 
                  : "border-border"
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                  Mais Popular
                </Badge>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-2 p-3 rounded-full bg-primary/10 w-fit">
                  <plan.icon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="font-display text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1">
                <div className="text-center mb-6">
                  {plan.originalPrice && (
                    <span className="text-sm text-muted-foreground line-through block">
                      R$ {plan.originalPrice.toFixed(2).replace(".", ",")}
                    </span>
                  )}
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-muted-foreground">R$</span>
                    <span className="font-display text-4xl text-gradient">
                      {plan.price.toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">/{plan.interval}</span>
                </div>
                
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              
              <CardFooter>
                <Button 
                  variant={plan.popular ? "fire" : "outline"} 
                  className="w-full" 
                  asChild
                >
                  <Link to="/auth?mode=signup">
                    Assinar Agora
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Todos os planos incluem garantia de 30 dias. Cancele quando quiser.
        </p>
      </div>
    </section>
  );
}
