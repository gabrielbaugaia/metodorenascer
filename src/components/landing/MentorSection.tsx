import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import gabrielBauPhoto from "@/assets/gabriel-bau.png";

export const MentorSection = () => {
  const { ref, isVisible } = useScrollAnimation();
  
  return (
    <section ref={ref} className="py-16 md:py-24 relative overflow-hidden bg-background">
      <div className="container mx-auto px-4">
        <div className={`flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 max-w-4xl mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          
          {/* Photo with glow */}
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-110" />
            <div className="relative w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 rounded-lg overflow-hidden border border-primary/30 shadow-2xl">
              <img 
                src={gabrielBauPhoto} 
                alt="Gabriel Baú - Criador do Método Renascer" 
                className="w-full h-full object-cover object-top" 
                loading="lazy" 
                decoding="async"
              />
            </div>
          </div>

          {/* Content - Simplified */}
          <div className="flex-1 text-center md:text-left max-w-md flex flex-col gap-4">
            <h2 className="font-display font-black text-foreground text-4xl md:text-5xl lg:text-6xl leading-[1.1] tracking-[-0.02em]">
              Gabriel <span className="text-primary">Baú</span>
            </h2>

            <p className="text-muted-foreground text-lg md:text-xl leading-relaxed">
              O estrategista por trás do Método Renascer.
            </p>

            <p className="text-primary text-lg md:text-xl font-semibold italic mt-2">
              "Aqui não existe tentar. Existe fazer até conquistar."
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
