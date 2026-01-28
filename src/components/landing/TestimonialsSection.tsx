import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const testimonials = [
  {
    name: "Ana SP",
    result: "Perdi 18kg sem sair de casa",
    content: "O Método Renascer mudou completamente minha relação com exercício. Com o acompanhamento via WhatsApp e os treinos personalizados, consegui perder 18kg treinando em casa. Nunca imaginei que seria possível."
  },
  {
    name: "João RJ",
    result: "Força voltou + mente forte",
    content: "Depois de anos sedentário, recuperei minha força e, mais importante, minha confiança. O trabalho de mindset fez toda diferença. Hoje me sinto renovado, como se tivesse renascido."
  },
  {
    name: "Maria BH",
    result: "15kg em 3 meses",
    content: "Em apenas 3 meses consegui resultados que nunca tive em anos tentando sozinha. O suporte 24h e as receitas personalizadas fizeram toda diferença. Recomendo para todos."
  },
  {
    name: "Dr. Leonardo Higashi",
    result: "Médico Endocrinologista",
    content: "Treino com o Baú desde 2014 e os resultados foram excelentes. Profissional dedicado, comprometido, atualizado e que se preocupa não só com o resultado físico, mas também com a saúde."
  },
  {
    name: "Rafael Susin",
    result: "Empresário",
    content: "O Gabriel Baú é extremamente profissional, assíduo, competente e - o melhor - traz resultados. Minha qualidade de vida melhorou significativamente."
  }
];

export function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  return (
    <section 
      ref={ref} 
      className={`py-16 md:py-24 bg-background transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
    >
      <div className="container mx-auto px-4">
        {/* Section Header - No subtitle */}
        <h2 className="font-display font-black text-foreground text-[2.5rem] sm:text-4xl md:text-5xl lg:text-6xl leading-[1.1] tracking-[-0.02em] text-center mb-12 md:mb-16">
          Resultados <span className="text-primary">Reais</span>
        </h2>

        <div className="max-w-3xl mx-auto">
          <div className="relative">
            {/* Editorial style - no card borders */}
            <div className="px-4 md:px-8 py-8 md:py-12">
              {/* Large quote mark */}
              <span className="text-primary/20 text-[6rem] md:text-[8rem] font-serif leading-none absolute -top-4 left-0">"</span>
              
              <div className="min-h-[200px] flex flex-col justify-center relative z-10">
                <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground leading-relaxed mb-8 italic">
                  {testimonials[currentIndex].content}
                </p>
                
                <div className="border-t border-border/30 pt-6">
                  <p className="text-primary font-semibold text-xl md:text-2xl">
                    {testimonials[currentIndex].result}
                  </p>
                  <p className="text-foreground text-base mt-2">
                    — {testimonials[currentIndex].name}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation Arrows */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 md:-translate-x-12 text-muted-foreground hover:text-primary"
              onClick={goToPrevious}
            >
              <ChevronLeft className="w-8 h-8" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 md:translate-x-12 text-muted-foreground hover:text-primary"
              onClick={goToNext}
            >
              <ChevronRight className="w-8 h-8" />
            </Button>
          </div>

          {/* Dots indicator - minimal */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'bg-primary w-8' 
                    : 'bg-muted-foreground/20 hover:bg-muted-foreground/40'
                }`}
                onClick={() => {
                  setIsAutoPlaying(false);
                  setCurrentIndex(index);
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
