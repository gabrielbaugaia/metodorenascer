import { memo } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const HeroSection = memo(function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Clean dark background */}
      <div className="absolute inset-0 bg-background" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20 md:py-28">
        <div className="max-w-3xl mx-auto text-center">
          
          {/* Main Title - Clean & Bold */}
          <div className="mb-8 animate-fade-in">
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight leading-[1.1]">
              <span className="text-foreground block">NÃO BUSQUE EVOLUÇÃO</span>
              <span className="text-foreground">BUSQUE </span>
              <span className="text-primary">RENASCIMENTO</span>
            </h1>
          </div>

          {/* Single powerful subtitle */}
          <p 
            className="text-muted-foreground text-base md:text-lg max-w-lg mx-auto mb-12 animate-fade-in leading-relaxed" 
            style={{ animationDelay: "0.15s" }}
          >
            Para quem já tentou de tudo e está cansado de métodos que não funcionam na vida real.
          </p>

          {/* CTA Button */}
          <div 
            className="animate-fade-in" 
            style={{ animationDelay: "0.25s" }}
          >
            <Button 
              variant="fire" 
              size="xl" 
              asChild 
              className="group text-base md:text-lg px-12 py-7"
            >
              <a href="#preco">
                <span className="relative z-10 tracking-wide font-semibold">QUERO RENASCER</span>
                <ArrowRight className="w-5 h-5 relative z-10 ml-2 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
            
            <p className="mt-5 text-sm text-muted-foreground/70">
              A partir de R$47/mês · Cancele quando quiser
            </p>
          </div>
        </div>
      </div>

      {/* Minimal scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
        <div className="w-5 h-8 rounded-full border border-muted-foreground/20 flex items-start justify-center p-1.5">
          <div className="w-1 h-2 rounded-full bg-primary/70" />
        </div>
      </div>
    </section>
  );
});
