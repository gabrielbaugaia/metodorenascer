import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { ClipboardCheck, FileText, Play, TrendingUp, Settings } from "lucide-react";

const steps = [
  { icon: ClipboardCheck, label: "Análise", animation: "iconBounce 3s ease-in-out infinite" },
  { icon: FileText, label: "Prescrição", animation: "iconSwing 4s ease-in-out infinite" },
  { icon: Play, label: "Execução", animation: "iconPulse 3.5s ease-in-out infinite" },
  { icon: TrendingUp, label: "Evolução", animation: "iconFloat 4s ease-in-out infinite" },
  { icon: Settings, label: "Ajuste", animation: "iconSpin 8s linear infinite" },
];

export function HowItWorksSection() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <section 
      ref={ref} 
      className={`py-16 md:py-24 section-light transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
    >
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-10">
          {/* Header */}
          <div className="text-center flex flex-col items-center gap-4">
            <h2 className="font-display font-black text-[2.5rem] sm:text-4xl md:text-5xl leading-[1.1] tracking-[-0.02em]">
              O método se adapta à sua vida. <span className="text-primary">Não o contrário.</span>
            </h2>
            
            <p className="text-lg md:text-xl leading-relaxed max-w-2xl">
              Você é analisado, recebe prescrições claras, executa no dia a dia, 
              registra evolução e ajusta conforme os resultados.
            </p>
          </div>

          {/* Flow Steps */}
          <div className="w-full flex flex-wrap justify-center items-center gap-4 md:gap-6">
            {steps.map((step, index) => (
              <div key={step.label} className="flex items-center gap-4 md:gap-6">
                <div className="flex flex-col items-center gap-2">
                  <div
                    className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-primary/10 flex items-center justify-center"
                    style={{
                      animation: isVisible ? step.animation : 'none',
                      animationDelay: `${index * 0.15}s`,
                    }}
                  >
                    <step.icon className="w-7 h-7 md:w-8 md:h-8 text-primary" />
                  </div>
                  <span className="font-display text-sm md:text-base">
                    {step.label}
                  </span>
                </div>
                
                {/* Arrow connector (not on last item) */}
                {index < steps.length - 1 && (
                  <div
                    className="hidden md:block text-primary text-2xl font-bold"
                    style={{
                      animation: isVisible ? 'arrowSlide 2.5s ease-in-out infinite' : 'none',
                      animationDelay: `${index * 0.3}s`,
                    }}
                  >
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
