import { memo } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const HeroSection = memo(function HeroSection() {
  return (
    <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden bg-background pt-24 md:pt-32">
      {/* Subtle radial gradient for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(16_100%_50%/0.05)_0%,_transparent_70%)]" />
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 md:px-8">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-10 md:gap-12">
          
          {/* Title Block - Dominant headline */}
          <div className="animate-fade-in w-full flex flex-col items-center gap-6">
            <h1 className="font-display font-black text-foreground text-[2.75rem] sm:text-6xl md:text-7xl lg:text-8xl leading-[1.05] tracking-[0.01em] text-center">
              Treinos que funcionam de verdade —{" "}
              <span className="text-primary drop-shadow-[0_0_40px_rgba(255,69,0,0.7)]">com método e progresso visível.</span>
            </h1>
          </div>

          {/* Subheadline - Smaller, breathing room */}
          <p 
            className="text-muted-foreground text-base md:text-lg lg:text-xl max-w-2xl mx-auto animate-fade-in leading-relaxed text-center" 
            style={{ animationDelay: "0.1s" }}
          >
            Prescrição individual + acompanhamento. Você sabe exatamente o que fazer e como evoluir.
          </p>

          {/* Reinforcement phrase */}
          <p 
            className="text-primary text-sm md:text-base font-semibold animate-fade-in text-center" 
            style={{ animationDelay: "0.2s" }}
          >
            Não é desafio. Não é treino genérico. É método.
          </p>

          {/* CTA Block */}
          <div 
            className="animate-fade-in flex flex-col items-center gap-6 pt-4" 
            style={{ animationDelay: "0.3s" }}
          >
            <Button 
              variant="fire" 
              size="xl" 
              asChild 
              className="group text-xl md:text-2xl px-12 md:px-16 py-7 md:py-8 rounded-xl shadow-2xl animate-pulse-glow hover:animate-none"
            >
              <a href="#preco">
                <span className="relative z-10 tracking-wide font-semibold">Entrar no método</span>
                <ArrowRight className="w-6 h-6 md:w-7 md:h-7 relative z-10 ml-3 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
});
