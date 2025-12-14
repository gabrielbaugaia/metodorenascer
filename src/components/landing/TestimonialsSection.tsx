import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const testimonials = [
  {
    name: "Ana SP",
    result: "Perdi 18kg sem sair de casa",
    content: "O Metodo Renascer mudou completamente minha relacao com exercicio. Com o acompanhamento via WhatsApp e os treinos personalizados, consegui perder 18kg treinando em casa. Nunca imaginei que seria possivel."
  },
  {
    name: "Joao RJ",
    result: "Forca voltou + mente forte",
    content: "Depois de anos sedentario, recuperei minha forca e, mais importante, minha confianca. O trabalho de mindset fez toda diferenca. Hoje me sinto renovado, como se tivesse renascido."
  },
  {
    name: "Maria BH",
    result: "15kg em 3 meses",
    content: "Em apenas 3 meses consegui resultados que nunca tive em anos tentando sozinha. O suporte 24h e as receitas personalizadas fizeram toda diferenca. Recomendo para todos."
  },
  {
    name: "Dr. Leonardo Higashi",
    result: "Medico Endocrinologista",
    content: "Treino com o Bau desde 2014 e os resultados foram excelentes. Profissional dedicado, comprometido, atualizado e que se preocupa nao so com o resultado fisico, mas tambem com a saude."
  },
  {
    name: "Rafael Susin",
    result: "Empresario",
    content: "O Gabriel Bau e extremamente profissional, assiduo, competente e - o melhor - traz resultados. Minha qualidade de vida melhorou significativamente."
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
    <section ref={ref} className={`py-24 bg-background transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-6xl text-foreground mb-4 italic">
            RESULTADOS <span className="text-primary">REAIS</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Veja quem decidiu parar de dar desculpas e assumiu o controle.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <Card className="bg-card border-border/50">
              <CardContent className="p-8 md:p-12">
                <Quote className="w-12 h-12 text-primary/30 mb-6" />
                
                <div className="min-h-[200px] flex flex-col justify-center">
                  <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8">
                    "{testimonials[currentIndex].content}"
                  </p>
                  
                  <div className="border-t border-border pt-6">
                    <p className="font-display text-2xl text-primary">
                      {testimonials[currentIndex].result}
                    </p>
                    <p className="text-foreground font-semibold mt-1">
                      - {testimonials[currentIndex].name}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Navigation Arrows */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 text-muted-foreground hover:text-primary"
              onClick={goToPrevious}
            >
              <ChevronLeft className="w-8 h-8" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 text-muted-foreground hover:text-primary"
              onClick={goToNext}
            >
              <ChevronRight className="w-8 h-8" />
            </Button>
          </div>

          {/* Dots indicator */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'bg-primary w-8' 
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
