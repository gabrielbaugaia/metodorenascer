import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export const MentorSection = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section 
      ref={ref}
      className="py-20 md:py-28 relative overflow-hidden"
      style={{
        background: "linear-gradient(180deg, hsl(var(--background)) 0%, hsl(20 15% 8%) 50%, hsl(var(--background)) 100%)"
      }}
    >
      <div className="container mx-auto px-4">
        <div className={`flex flex-col lg:flex-row items-center gap-12 lg:gap-20 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Photo */}
          <div className="relative flex-shrink-0">
            <div className="w-64 h-64 md:w-80 md:h-80 rounded-lg overflow-hidden border-4 border-primary shadow-2xl shadow-primary/20">
              <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                {/* Placeholder - o usuário pode adicionar a foto real depois */}
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                    <svg className="w-10 h-10 text-primary" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                  <span className="text-muted-foreground text-sm">Gabriel Baú</span>
                </div>
              </div>
            </div>
            {/* Phoenix icon overlay */}
            <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-primary-foreground" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L9 6.5L11.5 9L8 12L10.5 14.5L7 18L12 22L17 18L13.5 14.5L16 12L12.5 9L15 6.5L12 2Z"/>
              </svg>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 text-center lg:text-left">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2">
              <span className="text-foreground">LIDERADO POR</span>
            </h2>
            <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-8">
              GABRIEL BAÚ
            </h3>

            <p className="text-muted-foreground text-lg md:text-xl mb-6 leading-relaxed">
              Eu não sou apenas um treinador online. Sou o estrategista que vai guiar sua jornada de reconstrução.
            </p>

            <p className="text-muted-foreground text-base md:text-lg mb-8 leading-relaxed">
              Criei o Método Renascer porque cansei de ver pessoas com potencial sendo destruídas pelo ciclo do fracasso fitness. 
              Minha missão é clara: usar a ciência do treino e a profundidade do comportamento humano para transformar pessoas comuns em suas melhores versões.
            </p>

            <p className="text-primary text-xl md:text-2xl font-bold italic">
              Aqui não existe "tentar". Existe fazer até conquistar.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
