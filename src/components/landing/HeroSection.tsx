import { memo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, Users } from "lucide-react";

const UrgencyCounter = memo(function UrgencyCounter() {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [spotsLeft] = useState(7);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const diff = endOfDay.getTime() - now.getTime();
      
      return {
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, []);

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 px-4 py-3 rounded-xl bg-card/50 border border-primary/20 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-primary">
        <Users className="w-4 h-4" />
        <span className="text-sm font-medium">
          Apenas <span className="font-bold">{spotsLeft} vagas</span> restantes
        </span>
      </div>
      <div className="hidden sm:block w-px h-6 bg-border" />
      <div className="flex items-center gap-2 text-muted-foreground">
        <Clock className="w-4 h-4" />
        <span className="text-sm">Oferta expira em:</span>
        <div className="flex gap-1 font-mono font-bold text-primary">
          <span className="bg-primary/10 px-1.5 py-0.5 rounded">{pad(timeLeft.hours)}</span>
          <span>:</span>
          <span className="bg-primary/10 px-1.5 py-0.5 rounded">{pad(timeLeft.minutes)}</span>
          <span>:</span>
          <span className="bg-primary/10 px-1.5 py-0.5 rounded">{pad(timeLeft.seconds)}</span>
        </div>
      </div>
    </div>
  );
});

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

          {/* Subtitle - Better spacing and size */}
          <p 
            className="text-muted-foreground text-lg md:text-xl max-w-md mx-auto animate-fade-in leading-relaxed font-light" 
            style={{ animationDelay: "0.15s" }}
          >
            Para quem já tentou de tudo e está cansado de métodos que não funcionam na vida real.
          </p>

          {/* CTA Block - Tighter grouping */}
          <div 
            className="animate-fade-in flex flex-col items-center gap-5" 
            style={{ animationDelay: "0.25s" }}
          >
            {/* Urgency Counter */}
            <UrgencyCounter />

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
