import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";

interface SubscriptionPlan {
  name: string;
  price: string;
  period: string;
  badge?: string;
  priceId: string;
  features: string[];
  savings?: string;
  popular: boolean;
}

interface PlanSelectionGridProps {
  plans: SubscriptionPlan[];
  onSelectPlan: (priceId: string) => void;
}

export function PlanSelectionGrid({ plans, onSelectPlan }: PlanSelectionGridProps) {
  return (
    <div className="min-h-screen bg-background">
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
            {plans.map((plan) => (
              <Card 
                key={plan.name} 
                className={`relative p-5 flex flex-col ${plan.popular ? 'border-primary ring-1 ring-primary' : ''}`}
              >
                {plan.popular && plan.badge && (
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
                  onClick={() => onSelectPlan(plan.priceId)}
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
