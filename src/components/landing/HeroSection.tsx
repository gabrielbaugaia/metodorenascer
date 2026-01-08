import { memo } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const HeroSection = memo(function HeroSection() {
  return (
    <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden">
      {/* Clean dark background */}
      <div className="absolute inset-0 bg-background" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 md:px-8">
        <div className="max-w-2xl mx-auto text-center flex flex-col items-center gap-10 md:gap-12">
          
          {/* Main Title - 3 lines hierarchy */}
          <div className="animate-fade-in">
            <h1 className="font-display tracking-tight leading-[0.95]">
              <span className="text-foreground block text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
                NÃO BUSQUE
              </span>
              <span className="text-foreground block text-5xl sm:text-6xl md:text-8xl lg:text-[10rem] my-1 md:my-2">
                EVOLUÇÃO
              </span>
              <span className="block text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
                <span className="text-foreground">BUSQUE </span>
                <span className="text-primary">RENASCIMENTO</span>
              </span>
            </h1>
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
