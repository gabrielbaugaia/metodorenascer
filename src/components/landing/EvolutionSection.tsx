import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export function EvolutionSection() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <section 
      ref={ref} 
      className={`py-16 md:py-24 section-graphite transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
    >
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center flex flex-col items-center gap-6">
          <h2 className="font-display font-black text-foreground text-[2.5rem] sm:text-4xl md:text-5xl leading-[1.1] tracking-[-0.02em]">
            Evolução aqui não é <span className="text-primary">achismo.</span>
          </h2>
          
          <p className="text-muted-foreground text-lg md:text-xl leading-relaxed max-w-2xl">
            Check-ins, análises visuais, feedbacks e ajustes fazem parte do método.
            Você não fica sozinho no processo.
          </p>
        </div>
      </div>
    </section>
  );
}
