import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";

const features = [
  "Treino personalizado semanal",
  "Plano nutricional adaptado",
  "Acompanhamento via WhatsApp",
  "Biblioteca de receitas fitness",
  "Aulas de mindset",
  "Comunidade exclusiva",
  "Suporte 24h",
  "Garantia de 30 dias",
];

export function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      
      <div className="relative z-10 container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-4xl md:text-6xl text-foreground mb-6">
            PRONTO PARA <span className="text-gradient glow-text">RENASCER</span>?
          </h2>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Junte-se a centenas de pessoas que ja transformaram suas vidas com o nosso metodo
          </p>

          {/* Features grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {features.map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-left">
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm text-muted-foreground">{feature}</span>
              </div>
            ))}
          </div>

          {/* Price card */}
          <div className="inline-flex flex-col items-center gap-4 p-8 rounded-2xl glass-card animate-pulse-glow mb-8">
            <span className="text-sm text-muted-foreground uppercase tracking-wider">Investimento mensal</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl text-muted-foreground">R$</span>
              <span className="font-display text-7xl text-gradient">49,90</span>
            </div>
            <span className="text-xs text-muted-foreground">Cancele quando quiser</span>
          </div>

          {/* CTA Button */}
          <div>
            <Button variant="fire" size="xl" asChild className="group">
              <Link to="/auth?mode=signup">
                <span className="relative z-10">Comecar Minha Transformacao</span>
                <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
