import { Link } from "react-router-dom";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export function LandingAppHero() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <section
      ref={ref}
      className="min-h-[88vh] flex flex-col justify-center items-start px-7 md:px-[60px] pt-[140px] pb-20 relative overflow-hidden"
    >
      {/* Grid background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,101,0,.028) 1px, transparent 1px), linear-gradient(90deg, rgba(255,101,0,.028) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage: "radial-gradient(ellipse 85% 85% at 50% 50%, black 0%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 85% 85% at 50% 50%, black 0%, transparent 80%)",
        }}
      />
      {/* Glow */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 60% at 62% 50%, rgba(255,101,0,.07) 0%, transparent 65%)",
        }}
      />
      {/* Orange line — desktop only */}
      <div
        className="absolute left-[60px] top-[140px] bottom-20 w-[2px] hidden md:block z-[1]"
        style={{ background: "linear-gradient(180deg, hsl(var(--primary)) 0%, transparent 100%)" }}
      />

      <div
        className={`relative z-[2] max-w-[900px] md:pl-7 transition-all duration-1000 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-7"
        }`}
      >
        <div className="inline-flex items-center font-mono-v2 text-[10px] tracking-[3px] uppercase text-primary border border-primary/40 px-[18px] py-[7px] mb-11">
          App Método Renascer
        </div>

        <h1 className="font-display-v2 text-[clamp(56px,8vw,108px)] leading-[.92] tracking-[3px] text-foreground mb-4">
          SEU CORPO,<br />
          SEU PROTOCOLO<span className="text-primary">.</span>
        </h1>

        <p className="font-display-v2 text-[clamp(22px,3vw,40px)] tracking-[4px] text-muted-foreground mb-9">
          CALCULADO TODO DIA.
        </p>

        <p className="font-body-v2 text-[16px] md:text-[17px] text-muted-foreground/80 font-light leading-[1.8] max-w-[560px] mb-[44px]">
          Prescrição física, nutricional e mental que se adapta aos{" "}
          <strong className="text-foreground font-medium">seus dados reais</strong> — não a um plano genérico. Treino, nutrição, mindset e inteligência de performance em um único app.
        </p>

        <div className="flex gap-3 md:gap-4 items-center flex-wrap">
          <a
            href="#v2-preco"
            className="font-mono-v2 text-[11px] tracking-[2.5px] uppercase bg-primary text-primary-foreground px-8 md:px-10 py-4 border border-primary hover:bg-transparent hover:text-primary transition-all duration-200 inline-block"
          >
            Começar Agora
          </a>
          <Link
            to="/quiz"
            className="font-mono-v2 text-[10px] tracking-[1px] uppercase bg-transparent text-muted-foreground px-6 md:px-10 py-4 border border-border hover:border-primary hover:text-primary transition-all duration-200 inline-block whitespace-nowrap"
          >
            Diagnóstico de 60s
          </Link>
        </div>

        <p className="font-mono-v2 text-[9px] tracking-[2px] uppercase text-muted-foreground/60 mt-6">
          7 dias de garantia · cancele quando quiser
        </p>
      </div>
    </section>
  );
}
