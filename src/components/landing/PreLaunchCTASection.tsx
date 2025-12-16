import { forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const WHATSAPP_GROUP_LINK = "https://chat.whatsapp.com/FzfmZXRpd5AD8z0dL8UFnh?mode=hqrt1";

export const PreLaunchCTASection = forwardRef<HTMLElement>((_, forwardedRef) => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <section 
      ref={ref} 
      className={`py-20 md:py-28 section-dark relative overflow-hidden transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
    >
      {/* Background glow effect */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center bottom, hsl(25 100% 12% / 0.3) 0%, transparent 60%)'
        }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl tracking-wide leading-tight">
            <span className="text-foreground">Sua Nova Vida </span>
            <span className="text-primary">Começa Quando </span>
            <span className="text-foreground">a Antiga Termina</span>
          </h2>

          <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Grupo VIP exclusivo para membros fundadores. 
            Condição especial só até o lançamento oficial.
          </p>

          <div className="pt-4">
            <Button 
              variant="fire" 
              size="xl" 
              asChild 
              className="group text-base md:text-lg px-10 md:px-14 py-6 md:py-7"
            >
              <a href={WHATSAPP_GROUP_LINK} target="_blank" rel="noopener noreferrer">
                <span className="relative z-10 font-semibold tracking-wide">
                  ENTRAR GRUPO VIP LANÇAMENTO
                </span>
                <ArrowRight className="w-5 h-5 relative z-10 ml-2 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            Vagas limitadas no grupo exclusivo.
          </p>
        </div>
      </div>
    </section>
  );
});

PreLaunchCTASection.displayName = "PreLaunchCTASection";
