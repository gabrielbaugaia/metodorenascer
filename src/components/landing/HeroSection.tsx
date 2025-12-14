import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function HeroSection() {
  const whatsappLink = "https://wa.me/5511999999999?text=Quero%20reservar%20minha%20vaga%20no%20Método%20Renascer";
  
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Clean dark background with subtle gradient */}
      <div className="absolute inset-0 bg-background">
        <div 
          className="absolute inset-0" 
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 40%, hsl(20 80% 8% / 0.8) 0%, transparent 70%)'
          }} 
        />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 pt-32 pb-20">
        <div className="max-w-4xl mx-auto text-center">
          
          {/* Main Title Block - Clean Typography */}
          <div className="mb-12 animate-fade-in">
            <h1 
              className="text-6xl md:text-8xl lg:text-9xl tracking-tight leading-[0.85] mb-6"
              style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 500 }}
            >
              <span className="block text-foreground">NÃO BUSQUE</span>
              <span className="block text-primary">EVOLUÇÃO</span>
              <span className="block text-foreground">BUSQUE</span>
              <span className="block text-primary">RENASCIMENTO</span>
            </h1>
          </div>

          {/* Tagline - Simple and Clean */}
          <div 
            className="mb-10 animate-fade-in" 
            style={{ animationDelay: "0.15s" }}
          >
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Perca <span className="text-primary font-semibold">-15kg em 90 dias</span> com 
              seu plano personalizado e acompanhamento 24h.
            </p>
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
              className="group text-base md:text-lg px-8 md:px-12 py-5 md:py-6"
            >
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <span className="relative z-10 tracking-wide">QUERO RENASCER</span>
                <ArrowRight className="w-5 h-5 relative z-10 ml-2 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Minimal scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-float">
        <div className="w-5 h-8 rounded-full border border-muted-foreground/20 flex items-start justify-center p-1.5">
          <div className="w-1 h-2 rounded-full bg-primary/70" />
        </div>
      </div>
    </section>
  );
}