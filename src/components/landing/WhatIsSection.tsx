import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export function WhatIsSection() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <section 
      ref={ref} 
      className={`py-16 md:py-24 section-graphite transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
    >
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center flex flex-col items-center gap-6">
          <h2 className="font-display font-black text-foreground text-[2.5rem] sm:text-4xl md:text-5xl leading-[1.1] tracking-[-0.02em]">
            O Renascer não é um treino. <span className="text-primary">É um sistema.</span>
          </h2>
          
          <p className="text-muted-foreground text-lg md:text-xl leading-relaxed max-w-2xl">
            O Método Renascer foi criado para quem entende que resultado não vem de motivação,
mas de prescrição correta e execução consistente.
          </p>
          
          <p className="text-muted-foreground text-lg md:text-xl leading-relaxed max-w-2xl">
            Treino, nutrição e mentalidade são definidos a partir do seu corpo,
da sua rotina e do seu objetivo.
          </p>
        </div>
      </div>
    </section>
  );
}
