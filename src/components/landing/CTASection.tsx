import { forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
export const CTASection = forwardRef<HTMLElement>((_, forwardedRef) => {
  const {
    ref,
    isVisible
  } = useScrollAnimation({
    threshold: 0.1
  });
  return <section ref={ref} className={`py-20 md:py-28 section-dark relative overflow-hidden transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
      {/* Background glow effect */}
      <div className="absolute inset-0 pointer-events-none" style={{
      background: 'radial-gradient(ellipse at center bottom, hsl(25 100% 12% / 0.3) 0%, transparent 60%)'
    }} />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center flex flex-col items-center gap-5">
          <h2 className="font-display font-black text-foreground text-[2.5rem] sm:text-4xl md:text-5xl lg:text-6xl leading-[1.1] tracking-[-0.02em] text-center">
            Sua Nova Vida <span className="text-primary">Começa Agora</span>
          </h2>

          <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">Vagas limitadas para acompanhamento individual. 
Não aceitamos curiosos, apenas comprometidos.</p>

          <div className="pt-4">
            <Button variant="fire" size="xl" asChild className="group text-base md:text-lg px-10 md:px-14 py-6 md:py-7">
              <a href="#preco">
                <span className="relative z-10 font-semibold tracking-wide">
                  RESERVAR MINHA TRANSFORMAÇÃO
                </span>
                <ArrowRight className="w-5 h-5 relative z-10 ml-2 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>;
});
CTASection.displayName = "CTASection";