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
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 text-center lg:text-left max-w-xl lg:max-w-lg">
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl tracking-wide mb-6">
              <span className="text-foreground">Liderado por </span>
              <span className="text-primary">Gabriel Baú</span>
            </h2>

            <p className="text-muted-foreground text-base md:text-lg mb-5 leading-relaxed">
              Eu não sou apenas um treinador online. Sou o estrategista que vai guiar sua jornada de reconstrução.
            </p>

            <p className="text-muted-foreground text-sm md:text-base mb-6 leading-relaxed">
              Criei o Método Renascer porque cansei de ver pessoas com potencial sendo destruídas pelo ciclo do fracasso fitness. Minha missão é clara: usar a ciência do treino e a profundidade do comportamento humano para transformar pessoas comuns em suas melhores versões.
            </p>

            <p className="text-primary text-base md:text-lg font-medium">
              "Aqui não existe tentar. Existe fazer até conquistar."
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
