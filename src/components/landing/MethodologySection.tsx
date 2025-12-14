import { Card, CardContent } from "@/components/ui/card";
import { Camera, Utensils, MessageCircle, Trophy } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const pillars = [
  {
    icon: Camera,
    title: "Analise de Treino e Fotos",
    description: "Acompanhamento que avalia sua execucao e progresso em tempo real, corrigindo e otimizando cada movimento."
  },
  {
    icon: Utensils,
    title: "Receitas 100% Suas",
    description: "Plano nutricional personalizado com receitas baseadas nos seus gostos e objetivos."
  },
  {
    icon: MessageCircle,
    title: "Fale com Mentor 24h",
    description: "Suporte continuo pelo app. Tire duvidas, receba motivacao e ajustes no seu plano a qualquer momento."
  },
  {
    icon: Trophy,
    title: "Progresso Gamificado",
    description: "Sistema de conquistas e badges que transforma sua jornada em um jogo. Cada meta batida e celebrada."
  }
];

export function MethodologySection() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <section ref={ref} id="metodologia" className={`py-24 section-dark transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-6xl text-foreground mb-4 italic">
            MATE SUA <span className="text-primary">VERSAO ANTIGA</span>
          </h2>
          <p className="text-muted-foreground max-w-3xl mx-auto text-lg">
            Para construir o novo, o velho precisa deixar de existir. O Metodo Renascer e uma abordagem integrada focada em alta performance.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {pillars.map((pillar, index) => (
            <Card 
              key={pillar.title} 
              className="bg-primary/10 border-primary/30 animate-fade-in group hover:bg-primary/20 hover:border-primary/50 transition-all duration-300"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6 space-y-4 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                  <pillar.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-display text-xl text-foreground">{pillar.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{pillar.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
