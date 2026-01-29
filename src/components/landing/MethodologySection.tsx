import { Camera, Dumbbell, Utensils, Brain, Target } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const pillars = [
  {
    icon: Camera,
    title: "Análise Individual",
    description: "Avaliação completa do seu perfil físico, rotina, histórico e objetivo para prescrever o que realmente funciona para você."
  },
  {
    icon: Dumbbell,
    title: "Treino Prescrito",
    description: "Treino estruturado de acordo com seu nível, tempo disponível e capacidade de recuperação. Sem padrão genérico."
  },
  {
    icon: Utensils,
    title: "Nutrição + Receitas",
    description: "Plano alimentar alinhado ao seu objetivo, mais acesso IA de receitas exclusiva que facilitam a execução no dia a dia."
  },
  {
    icon: Brain,
    title: "Mentalidade",
    description: "Guia exclusivo aplicado à sua rotina real, com acompanhamento contínuo e ajustes conforme sua evolução."
  },
  {
    icon: Target,
    title: "Consistência",
    description: "Um sistema que transforma execução diária em progresso real e mensurável."
  }
];

export function MethodologySection() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <section 
      ref={ref} 
      id="metodologia" 
      className={`py-16 md:py-24 bg-background transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
    >
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16 flex flex-col items-center gap-3">
          <h2 className="font-display font-black text-foreground text-[2.5rem] sm:text-4xl md:text-5xl lg:text-6xl leading-[1.1] tracking-[-0.02em]">
            O <span className="text-primary">Método Renascer</span>
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl">
            Um sistema completo de prescrição personalizada.
          </p>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-8 max-w-6xl mx-auto">
          {pillars.map((pillar, index) => (
            <div 
              key={pillar.title} 
              className="flex flex-col items-center text-center gap-3 animate-fade-in group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                <pillar.icon className="w-7 h-7 md:w-8 md:h-8 text-primary" />
              </div>
              <h3 className="font-display text-foreground text-base md:text-lg font-semibold">
                {pillar.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
