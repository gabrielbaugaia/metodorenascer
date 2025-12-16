import { Button } from "@/components/ui/button";
import { ArrowRight, Dumbbell, Utensils, MessageCircle } from "lucide-react";

const WHATSAPP_GROUP_LINK = "https://chat.whatsapp.com/FzfmZXRpd5AD8z0dL8UFnh";

export function PreLaunchHeroSection() {
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
          
          {/* Main Title Block - Clean Typography */}
          <div className="mb-8 animate-fade-in">
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl tracking-tight leading-none mb-2">
              <span className="text-foreground">NÃO BUSQUE EVOLUÇÃO,</span>
            </h1>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl tracking-tight leading-none">
              <span className="text-foreground">BUSQUE </span>
              <span className="text-primary">RENASCIMENTO</span>
            </h1>
          </div>

          {/* Subtitle - Clean and readable */}
          <div 
            className="mb-10 animate-fade-in" 
            style={{ animationDelay: "0.15s" }}
          >
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Perca até <span className="text-primary font-semibold">15kg em 90 dias</span> com 
              seu plano personalizado e acompanhamento 24h.
            </p>
          </div>

          {/* Benefits Bullets */}
          <div 
            className="mb-12 animate-fade-in flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="flex items-center gap-2 text-muted-foreground">
              <Dumbbell className="w-5 h-5 text-primary" />
              <span className="text-sm md:text-base">Treino 100% personalizado</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Utensils className="w-5 h-5 text-primary" />
              <span className="text-sm md:text-base">Nutrição baseada em você</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MessageCircle className="w-5 h-5 text-primary" />
              <span className="text-sm md:text-base">Suporte 24h no App</span>
            </div>
          </div>

          {/* CTA Button - WhatsApp Group */}
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
              <a href={WHATSAPP_GROUP_LINK} target="_blank" rel="noopener noreferrer">
                <span className="relative z-10 tracking-wide font-semibold">ENTRAR GRUPO VIP LANÇAMENTO</span>
                <ArrowRight className="w-5 h-5 relative z-10 ml-2 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
          </div>

          {/* Urgency text */}
          <p 
            className="mt-6 text-sm text-muted-foreground animate-fade-in"
            style={{ animationDelay: "0.4s" }}
          >
            Vagas limitadas no grupo exclusivo - condição especial só até o lançamento oficial.
          </p>
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
}
