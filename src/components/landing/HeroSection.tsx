import { memo } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const HeroSection = memo(function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Clean dark background with subtle gradient */}
      <div className="absolute inset-0 bg-background">
        <div 
          className="absolute inset-0" 
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 40%, hsl(20 80% 6% / 0.6) 0%, transparent 70%)'
          }} 
        />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-24 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          
          {/* Main Title Block */}
          <div className="mb-6 animate-fade-in">
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl tracking-tight leading-tight mb-2">
              <span className="text-foreground">NÃO BUSQUE EVOLUÇÃO</span>
            </h1>
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl tracking-tight leading-tight">
              <span className="text-foreground">BUSQUE </span>
              <span className="text-primary">RENASCIMENTO</span>
            </h1>
          </div>

          {/* Subtitle - Orange */}
          <div 
            className="mb-6 animate-fade-in" 
            style={{ animationDelay: "0.1s" }}
          >
            <h2 className="text-lg md:text-xl text-primary font-medium">
              Para quem já gastou fortunas em métodos que duram 2 semanas
            </h2>
          </div>

          {/* Paragraph */}
          <div 
            className="mb-8 animate-fade-in" 
            style={{ animationDelay: "0.15s" }}
          >
            <p className="text-sm md:text-base text-foreground/90 max-w-xl mx-auto leading-relaxed">
              Você não é fraco. São as soluções que ignoram sua vida real.<br />
              Quebramos o ciclo esperança → fracasso → vergonha para sempre.
            </p>
          </div>

          {/* Benefits Bullets - 4 items */}
          <div 
            className="mb-10 animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto text-left"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="flex items-center gap-3 text-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
              <span className="text-sm md:text-base">Força e composição corporal sem extremos</span>
            </div>
            <div className="flex items-center gap-3 text-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
              <span className="text-sm md:text-base">Energia para render no trabalho e na vida</span>
            </div>
            <div className="flex items-center gap-3 text-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
              <span className="text-sm md:text-base">Disciplina que roda no automático</span>
            </div>
            <div className="flex items-center gap-3 text-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
              <span className="text-sm md:text-base">Autoestima que encara espelho sem culpa</span>
            </div>
          </div>

          {/* CTA Button */}
          <div 
            className="animate-fade-in" 
            style={{ animationDelay: "0.3s" }}
          >
            <Button 
              variant="fire" 
              size="xl" 
              asChild 
              className="group text-base md:text-lg px-10 md:px-14 py-6 md:py-7"
            >
              <a href="#preco">
                <span className="relative z-10 tracking-wide font-semibold">QUERO RENASCER</span>
                <ArrowRight className="w-5 h-5 relative z-10 ml-2 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
            
            {/* Microtext */}
            <p className="mt-4 text-xs md:text-sm text-muted-foreground">
              R$47/mês inaugural | Cancela quando quiser
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
