import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Star, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    id: "elite-fundador",
    name: "Membro ELITE - Fundador",
    price: 49.90,
    interval: "mês",
    description: "Desconto especial para 25 membros fundadores",
    features: [
      "Acesso vitalício ao preço de fundador",
      "Prioridade máxima no suporte",
      "Acesso a grupo exclusivo de fundadores",
      "Consultoria estratégica mensal",
      "Renovação automática mensal",
    ],
    popular: true,
    icon: Crown,
    priceId: "price_1ScZqTCuFZvf5xFdZuOBMzpt",
  },
  {
    id: "mensal",
    name: "Plano Mensal",
    price: 197.00,
    interval: "mês",
    description: "Acesso completo ao Método Renascer por 30 dias",
    features: [
      "Plano de treino personalizado",
      "Plano nutricional estratégico",
      "Programa de mindset",
      "Suporte 24h via chat",
      "Acesso a todas as receitas",
    ],
    popular: false,
    icon: Zap,
    priceId: "price_1ScZrECuFZvf5xFdfS9W8kvY",
  },
  {
    id: "trimestral",
    name: "Plano Trimestral",
    price: 497.00,
    interval: "3 meses",
    description: "Até 3x sem juros",
    features: [
      "Tudo do plano mensal",
      "Reavaliação de progresso",
      "Ajustes de planos conforme evolução",
      "Prioridade no suporte",
      "Acesso a comunidade privada",
    ],
    popular: false,
    icon: Star,
    priceId: "price_1ScZsTCuFZvf5xFdbW8kJeQF",
  },
  {
    id: "semestral",
    name: "Plano Semestral",
    price: 697.00,
    interval: "6 meses",
    description: "Até 3x sem juros",
    features: [
      "Tudo do plano trimestral",
      "Consultoria estratégica personalizada",
      "Acompanhamento quinzenal",
      "Acesso a conteúdo exclusivo",
      "Bônus: 1 sessão de coaching",
    ],
    popular: false,
    icon: Star,
    priceId: "price_1ScZtrCuFZvf5xFd8iXDfbEp",
  },
  {
    id: "anual",
    name: "Plano Anual",
    price: 997.00,
    interval: "12 meses",
    description: "Até 3x sem juros",
    features: [
      "Tudo do plano semestral",
      "Suporte prioritário 24/7",
      "Renovação automática anual",
      "Acesso vitalício a conteúdo exclusivo",
      "Bônus: 3 sessões de coaching",
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
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-muted-foreground">R$</span>
                    <span className="font-display text-4xl text-gradient">
                      {plan.price.toFixed(2).replace(".", ",")}
                    </span>
                  </div>
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
