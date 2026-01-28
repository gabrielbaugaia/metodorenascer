import { Camera, Utensils, MessageCircle, Trophy } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const pillars = [
  {
    icon: Camera,
    title: "Análise"
  },
  {
    icon: Utensils,
    title: "Receitas"
  },
  {
    icon: MessageCircle,
    title: "Mentor 24h"
  },
  {
    icon: Trophy,
    title: "Gamificação"
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
        {/* Section Header - No subtitle */}
        <h2 className="font-display font-black text-foreground text-[2.5rem] sm:text-4xl md:text-5xl lg:text-6xl leading-[1.1] tracking-[-0.02em] text-center mb-12 md:mb-16">
          O <span className="text-primary">Método Renascer</span>
        </h2>

        {/* Horizontal Pillars - Icons + Titles only */}
        <div className="flex flex-wrap justify-center gap-6 md:gap-12 lg:gap-16 max-w-4xl mx-auto">
          {pillars.map((pillar, index) => (
            <div 
              key={pillar.title} 
              className="flex flex-col items-center gap-3 animate-fade-in group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                <pillar.icon className="w-8 h-8 md:w-10 md:h-10 text-primary" />
              </div>
              <span className="font-display text-foreground text-lg md:text-xl tracking-wide">
                {pillar.title}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
