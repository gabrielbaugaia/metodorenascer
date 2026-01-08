import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
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
      className={`py-20 md:py-28 bg-background transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
    >
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-14 max-w-3xl mx-auto flex flex-col items-center gap-4">
          <h2 className="font-display font-black text-foreground text-[2.5rem] sm:text-4xl md:text-5xl lg:text-6xl leading-[1.1] tracking-[-0.02em] text-center">
            Resultados <span className="text-primary">Reais</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed text-center max-w-xl">
            Veja quem decidiu parar de dar desculpas e assumiu o controle.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="relative">
            <Card className="bg-card border-border/50">
              <CardContent className="p-8 md:p-10">
                <Quote className="w-10 h-10 text-primary/20 mb-5" />
                
                <div className="min-h-[180px] flex flex-col justify-center">
                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-6">
                    "{testimonials[currentIndex].content}"
                  </p>
                  
                  <div className="border-t border-border pt-5">
                    <p className="text-primary font-semibold text-lg">
                      {testimonials[currentIndex].result}
                    </p>
                    <p className="text-foreground text-sm mt-1">
                      — {testimonials[currentIndex].name}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Navigation Arrows */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 md:-translate-x-10 text-muted-foreground hover:text-primary"
              onClick={goToPrevious}
            >
              <ChevronLeft className="w-7 h-7" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 md:translate-x-10 text-muted-foreground hover:text-primary"
              onClick={goToNext}
            >
              <ChevronRight className="w-7 h-7" />
            </Button>
          </div>

          {/* Dots indicator */}
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'bg-primary w-6' 
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
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
