import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import gabrielBauPhoto from "@/assets/gabriel-bau.png";
export const MentorSection = () => {
  const {
    ref,
    isVisible
  } = useScrollAnimation();
  return <section ref={ref} className="py-20 md:py-28 relative overflow-hidden bg-background">
      <div className="container mx-auto px-4">
        <div className={`flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-16 max-w-5xl mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Photo */}
          <div className="relative flex-shrink-0">
            <div className="w-56 h-56 md:w-72 md:h-72 rounded-lg overflow-hidden border-2 border-primary/50 shadow-xl">
              <img src={gabrielBauPhoto} alt="Gabriel Baú - CEO e criador do Método Renascer" className="w-full h-full object-cover object-top" loading="lazy" decoding="async" width="288" height="288" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 text-center lg:text-left max-w-xl lg:max-w-lg flex flex-col gap-5">
            <h2 className="font-display font-black text-foreground text-[2.5rem] sm:text-4xl md:text-5xl lg:text-6xl leading-[1.1] tracking-[-0.02em]">
              Liderado por <span className="text-primary">Gabriel Baú</span>
            </h2>

            <p className="text-foreground text-[1.1rem] md:text-lg leading-relaxed text-justify">Eu não sou apenas um treinador online. Sou o estrategista 
que vai guiar sua jornada de reconstrução.</p>

            <p className="text-muted-foreground text-sm md:text-base leading-relaxed text-justify font-light">
              Criei o Método Renascer porque cansei de ver pessoas com potencial sendo destruídas pelo ciclo do fracasso fitness. Minha missão é clara: usar a ciência do treino e a profundidade do comportamento humano para transformar pessoas comuns em suas melhores versões.
            </p>

            <p className="text-primary text-base md:text-lg font-semibold">
              "Aqui não existe tentar. Existe fazer até conquistar."
            </p>
          </div>
        </div>
      </div>
    </section>;
};