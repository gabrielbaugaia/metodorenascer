import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import gabrielBauPhoto from "@/assets/gabriel-bau.png";

export const MentorSection = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section 
      ref={ref}
      className="py-20 md:py-28 relative overflow-hidden bg-background"
    >
      <div className="container mx-auto px-4">
        <div className={`flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-16 max-w-5xl mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Photo */}
          <div className="relative flex-shrink-0">
            <div className="w-56 h-56 md:w-72 md:h-72 rounded-lg overflow-hidden border-2 border-primary/50 shadow-xl">
              <img 
                src={gabrielBauPhoto} 
                alt="Gabriel Baú - CEO e criador do Método Renascer" 
                className="w-full h-full object-cover object-top"
                loading="lazy"
                decoding="async"
                width="288"
                height="288"
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 text-center lg:text-left max-w-xl lg:max-w-lg flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <h2 className="font-display font-black text-foreground text-[2rem] sm:text-3xl md:text-4xl lg:text-5xl leading-[1.1] tracking-[-0.02em]">
                Liderado por
              </h2>
              <p className="text-primary font-bold text-[1.5rem] sm:text-2xl md:text-3xl tracking-wide">
                Gabriel Baú
              </p>
            </div>

            <p className="text-foreground text-[1.1rem] md:text-lg leading-relaxed">
              Eu não sou apenas um treinador online. Sou o estrategista que vai guiar sua jornada de reconstrução.
            </p>

            <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
              Criei o Método Renascer porque cansei de ver pessoas com potencial sendo destruídas pelo ciclo do fracasso fitness. Minha missão é clara: usar a ciência do treino e a profundidade do comportamento humano para transformar pessoas comuns em suas melhores versões.
            </p>

            <p className="text-primary text-base md:text-lg font-semibold">
              "Aqui não existe tentar. Existe fazer até conquistar."
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
