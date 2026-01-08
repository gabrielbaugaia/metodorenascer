import { memo } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const HeroSection = memo(function HeroSection() {
  return (
    <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden bg-background">
      {/* Content */}
      <div className="relative z-10 container mx-auto px-[5%] pt-[15vh] pb-[10vh] md:py-0">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-8 md:gap-12">
          
          {/* Title Block */}
          <div className="animate-fade-in flex flex-col items-center gap-2 w-full">
            <h1 className="font-display tracking-[-0.05em] leading-[0.9] text-center">
              <span className="text-foreground block text-[2.8rem] sm:text-[3.5rem] md:text-6xl lg:text-7xl font-black">
                NÃO BUSQUE
              </span>
              <span className="text-foreground block text-[4.5rem] sm:text-[5.5rem] md:text-8xl lg:text-[10rem] font-black">
                EVOLUÇÃO
              </span>
            </h1>
            <p className="text-primary text-[1.1rem] sm:text-xl md:text-2xl font-bold tracking-[0.1em] mt-2">
              BUSQUE RENASCIMENTO
            </p>
          </div>

          {/* Subtitle - Better spacing and size */}
          <p 
            className="text-muted-foreground text-lg md:text-xl max-w-md mx-auto animate-fade-in leading-relaxed font-light" 
            style={{ animationDelay: "0.15s" }}
          >
            Para quem já tentou de tudo e está cansado de métodos que não funcionam na vida real.
          </p>

          {/* CTA Block - Tighter grouping */}
          <div 
            className="animate-fade-in flex flex-col items-center gap-4" 
            style={{ animationDelay: "0.25s" }}
          >
            <Button 
              variant="fire" 
              size="xl" 
              asChild 
              className="group text-lg md:text-xl px-10 md:px-14 py-6 md:py-7 rounded-xl shadow-2xl"
            >
              <a href="#preco">
                <span className="relative z-10 tracking-wide font-semibold">QUERO RENASCER</span>
                <ArrowRight className="w-5 h-5 md:w-6 md:h-6 relative z-10 ml-2 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
            
            <p className="text-sm md:text-base text-muted-foreground/60 tracking-wide">
              A partir de R$49,90/mês · Cancele quando quiser
            </p>
          </div>
        </div>
      </div>

      {/* Minimal scroll indicator */}
      <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 animate-float">
        <div className="w-5 h-8 rounded-full border border-muted-foreground/20 flex items-start justify-center p-1.5">
          <div className="w-1 h-2 rounded-full bg-primary/70" />
        </div>
      </div>
    </section>
  );
});
