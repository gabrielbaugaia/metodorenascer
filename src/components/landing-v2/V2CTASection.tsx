import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export function V2CTASection() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <section ref={ref} className="py-[130px] px-7 md:px-[60px] text-center relative overflow-hidden">
      {/* Glow */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 65% 65% at 50% 50%, rgba(255,101,0,.09) 0%, transparent 65%)" }} />
      {/* Grid */}
      <div className="absolute inset-0" style={{
        backgroundImage: "linear-gradient(rgba(255,101,0,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,101,0,.025) 1px, transparent 1px)",
        backgroundSize: "72px 72px",
        maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 0%, transparent 80%)",
        WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 0%, transparent 80%)",
      }} />

      <div className={`relative z-[1] transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-7"}`}>
        <h2 className="font-display-v2 text-[clamp(48px,7vw,96px)] tracking-[3px] leading-[.92] text-foreground mb-3">
          DADOS GERAM<br /><span className="text-primary">RESULTADO.</span>
        </h2>
        <p className="font-display-v2 text-[clamp(22px,3vw,36px)] tracking-[4px] text-muted-foreground mb-9">
          INTUIÇÃO É O PASSADO.
        </p>
        <p className="font-body-v2 text-[16px] text-muted-foreground font-light max-w-[540px] mx-auto mb-[52px] leading-[1.8]">
          Você já passou tempo suficiente treinando no escuro.
          O <strong className="text-foreground">Método Renascer</strong> existe para acabar com isso.
        </p>

        <div className="flex gap-4 items-center justify-center flex-wrap">
          <a
            href="#v2-preco"
            className="font-mono-v2 text-[11px] tracking-[2.5px] uppercase bg-primary text-primary-foreground px-10 py-4 border border-primary hover:bg-transparent hover:text-primary transition-all duration-200 inline-block"
          >
            Começar Diagnóstico Gratuito
          </a>
          <a
            href="#v2-preco"
            className="font-mono-v2 text-[11px] tracking-[2px] uppercase bg-transparent text-muted-foreground px-10 py-4 border border-border hover:border-primary hover:text-primary transition-all duration-200 inline-block"
          >
            Ver Planos →
          </a>
        </div>
      </div>
    </section>
  );
}
