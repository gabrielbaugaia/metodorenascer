import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function HeroSection() {
  const whatsappLink = "https://wa.me/5511999999999?text=Quero%20reservar%20minha%20vaga%20no%20Método%20Renascer";
  
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with radial gradient */}
      <div className="absolute inset-0 bg-background">
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at center, hsl(25 100% 15% / 0.6) 0%, hsl(0 0% 0%) 70%)'
        }} />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 pt-24 pb-16 text-center">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Main Title */}
          <div className="space-y-2 animate-fade-in">
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl text-foreground leading-none italic">NÃO BUSQUE</h1>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl text-primary leading-none italic">EVOLUÇÃO</h1>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl text-foreground leading-none italic">
              BUSQUE
            </h1>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl text-primary leading-none italic">
              RENASCIMENTO
            </h1>
          </div>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto animate-fade-in leading-relaxed" style={{
            animationDelay: "0.2s"
          }}>
            CANSOU de dietas que <span className="text-primary font-semibold">FALHAM</span>? 
            Renasça com <span className="text-primary font-semibold">-15kg em 90 DIAS</span>. 
            Seu plano personalizado + Coach 24h/7.
          </p>

          <p className="text-base md:text-lg text-muted-foreground/80 max-w-2xl mx-auto animate-fade-in" style={{
            animationDelay: "0.3s"
          }}>
            Treino personalizado, receitas exclusivas, análise de fotos e vídeos em tempo real. Sem academia.
          </p>

          {/* CTA */}
          <div className="animate-fade-in pt-4" style={{
            animationDelay: "0.4s"
          }}>
            <Button variant="fire" size="xl" asChild className="group text-lg px-10 py-6">
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <span className="relative z-10">APLICAR PARA O MÉTODO RENASCER</span>
                <ArrowRight className="w-5 h-5 relative z-10 ml-2 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
        <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
          <div className="w-1.5 h-3 rounded-full bg-primary animate-pulse" />
        </div>
      </div>
    </section>
  );
}
