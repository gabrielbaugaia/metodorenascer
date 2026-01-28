import { XCircle } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const problems = [
  {
    text: "Autoestima destruída por dietas genéricas e resultados vazios"
  },
  {
    text: "Corpo estagnado pelo efeito sanfona que nunca termina"
  },
  {
    text: "Desistência por falta de estratégia e suporte real"
  }
];

export function ProblemSection() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });
  
  return (
    <section 
      ref={ref} 
      className={`py-16 md:py-24 section-dark transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
    >
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Section Header - No subtitle */}
          <h2 className="font-display font-black text-foreground text-[2.5rem] sm:text-4xl md:text-5xl lg:text-6xl leading-[1.1] tracking-[-0.02em] text-center mb-12">
            O Fitness Tradicional <span className="text-primary">FALHOU</span> com Você
          </h2>

          {/* Statement Lines - No cards */}
          <div className="flex flex-col">
            {problems.map((problem, index) => (
              <div 
                key={index} 
                className="flex items-start gap-4 py-5 border-b border-border/30 last:border-b-0 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <XCircle className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-foreground text-lg md:text-xl leading-relaxed">
                  {problem.text}
                </p>
              </div>
            ))}
          </div>

          {/* Bottom Message */}
          <div className="text-center mt-12">
            <p className="text-primary text-lg md:text-xl font-semibold">
              O Método Renascer é o ultimato para mudar sua vida.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
