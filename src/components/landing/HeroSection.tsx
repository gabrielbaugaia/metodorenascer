import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Flame, Target, Brain, Utensils } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/80" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 pt-24 pb-16 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 animate-fade-in">
            <Flame className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Transformacao Garantida</span>
          </div>

          {/* Main Title */}
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl text-foreground leading-none animate-fade-in" style={{ animationDelay: "0.1s" }}>
            SUA <span className="text-gradient glow-text">TRANSFORMACAO</span>
            <br />COMPLETA
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Treino personalizado, nutricao inteligente e suporte 24h. 
            Tudo que voce precisa para alcancar o corpo dos seus sonhos.
          </p>

          {/* Price */}
          <div className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <div className="inline-flex flex-col items-center gap-1 p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border">
              <span className="text-sm text-muted-foreground uppercase tracking-wider">Por apenas</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl text-muted-foreground">R$</span>
                <span className="font-display text-6xl md:text-7xl text-gradient">49,90</span>
                <span className="text-muted-foreground">/mes</span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <Button variant="fire" size="xl" asChild className="group">
              <Link to="/auth?mode=signup">
                <span className="relative z-10">Comecar Agora</span>
                <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button variant="outline" size="xl" asChild>
              <a href="#metodologia">Conhecer o Metodo</a>
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 animate-fade-in" style={{ animationDelay: "0.5s" }}>
            {[
              { icon: Target, label: "Treino Personalizado" },
              { icon: Utensils, label: "Plano Nutricional" },
              { icon: Brain, label: "Mentoria Mindset" },
              { icon: Flame, label: "Suporte 24h" },
            ].map((feature) => (
              <div key={feature.label} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card/30 backdrop-blur-sm border border-border/50">
                <feature.icon className="w-6 h-6 text-primary" />
                <span className="text-xs md:text-sm text-muted-foreground text-center">{feature.label}</span>
              </div>
            ))}
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
