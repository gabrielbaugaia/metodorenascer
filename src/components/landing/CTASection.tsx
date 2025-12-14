import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export function CTASection() {
  const whatsappLink = "https://wa.me/5511999999999?text=Quero%20reservar%20minha%20transformação%20no%20Método%20Renascer";
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <section ref={ref} className={`py-24 bg-background relative overflow-hidden transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
      {/* Background glow effect */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center bottom, hsl(25 100% 15% / 0.4) 0%, transparent 60%)'
        }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-2">
            <h2 className="font-display text-4xl md:text-6xl lg:text-7xl text-foreground leading-none italic">
              SUA NOVA VIDA
            </h2>
            <h2 className="font-display text-4xl md:text-6xl lg:text-7xl text-primary leading-none italic">
              COMECA QUANDO
            </h2>
            <h2 className="font-display text-4xl md:text-6xl lg:text-7xl text-foreground leading-none italic">
              A ANTIGA TERMINA
            </h2>
          </div>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Vagas limitadas para acompanhamento individual. 
            Nao aceitamos curiosos, apenas comprometidos.
          </p>

          <div className="pt-4">
            <Button 
              variant="fire" 
              size="xl" 
              asChild 
              className="group text-lg px-12 py-8 animate-pulse-glow"
            >
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <span className="relative z-10 font-display text-xl tracking-wider">
                  RESERVAR MINHA TRANSFORMACAO
                </span>
                <ArrowRight className="w-6 h-6 relative z-10 ml-3 group-hover:translate-x-2 transition-transform" />
              </a>
            </Button>
          </div>

          <p className="text-muted-foreground/60 text-sm">
            Ao clicar, voce sera direcionado para nosso WhatsApp
          </p>
        </div>
      </div>
    </section>
  );
}
