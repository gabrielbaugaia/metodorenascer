import { memo } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const HeroSection = memo(function HeroSection() {
  return (
    <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden bg-background pt-24 md:pt-32">
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 md:px-8">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-8 md:gap-10">
          
          {/* Title Block - same pattern as other sections */}
          <div className="animate-fade-in w-full flex flex-col items-center gap-4">
            <h1 className="font-display font-black text-foreground text-[2.5rem] sm:text-5xl md:text-6xl lg:text-7xl leading-[1.1] tracking-[-0.02em] text-center">
              <span className="block">Não Busque Evolução,</span>
              <span className="block">Busque <span className="text-primary drop-shadow-[0_0_30px_rgba(255,69,0,0.6)]">RENASCIMENTO</span></span>
            </h1>
          </div>

          {/* Subtitle - Centered with highlight animation */}
          <p 
            className="text-muted-foreground text-lg md:text-xl max-w-xl mx-auto animate-fade-in leading-relaxed font-light text-center" 
            style={{ animationDelay: "0.15s" }}
          >
            Para <span className="text-foreground font-medium animate-pulse">poucos</span> que estão prontos para deixar a frustração para trás e finalmente se orgulhar do próprio reflexo.
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
              className="group text-lg md:text-xl px-10 md:px-14 py-6 md:py-7 rounded-xl shadow-2xl animate-pulse-glow hover:animate-none"
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

    </section>
  );
});
