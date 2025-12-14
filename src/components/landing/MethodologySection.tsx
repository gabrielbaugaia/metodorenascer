import { Card, CardContent } from "@/components/ui/card";
import { Camera, Utensils, MessageCircle, Trophy } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const pillars = [
  {
    icon: Camera,
    title: "Análise de Treino e Fotos",
    description: "Acompanhamento que avalia sua execução e progresso em tempo real, corrigindo e otimizando cada movimento."
  },
  {
    icon: Utensils,
    title: "Receitas 100% Suas",
    description: "Plano nutricional personalizado com receitas baseadas nos seus gostos e objetivos."
  },
  {
    icon: MessageCircle,
    title: "Fale com Mentor 24h",
    description: "Suporte contínuo pelo app. Tire dúvidas, receba motivação e ajustes no seu plano a qualquer momento."
  },
  {
    icon: Trophy,
    title: "Progresso Gamificado",
    description: "Sistema de conquistas e badges que transforma sua jornada em um jogo. Cada meta batida é celebrada."
  }
];

export function MethodologySection() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <section 
      ref={ref} 
      id="metodologia" 
      className={`py-20 md:py-28 section-dark transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
    >
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-14 max-w-3xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-foreground mb-5 tracking-wide">
            Mate Sua <span className="text-primary">Versão Antiga</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
            Para construir o novo, o velho precisa deixar de existir. O Método Renascer é uma abordagem integrada focada em alta performance.
          </p>
        </div>

        {/* Pillar Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
          {pillars.map((pillar, index) => (
            <Card 
              key={pillar.title} 
              className="bg-card border-border/60 animate-fade-in group hover:border-primary/40 transition-all duration-300 h-full"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6 flex flex-col items-center text-center h-full">
                <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center mb-4 group-hover:bg-primary/25 transition-colors">
                  <pillar.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display text-lg md:text-xl text-foreground mb-3">{pillar.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{pillar.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
