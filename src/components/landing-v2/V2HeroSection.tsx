import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export function V2HeroSection() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <section ref={ref} className="min-h-screen flex flex-col justify-center items-start px-7 md:px-[60px] pt-[140px] pb-20 relative overflow-hidden">
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
            "radial-gradient(ellipse 55% 60% at 62% 50%, rgba(255,101,0,.07) 0%, transparent 65%), radial-gradient(ellipse 30% 30% at 10% 80%, rgba(255,101,0,.04) 0%, transparent 55%)",
        }}
      />
      {/* Orange line left — desktop only */}
      <div className="absolute left-[60px] top-[140px] bottom-20 w-[2px] hidden md:block z-[1]" style={{ background: "linear-gradient(180deg, hsl(var(--primary)) 0%, transparent 100%)" }} />

      <div className={`relative z-[2] max-w-[900px] md:pl-7 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-7"}`}>
        {/* Badge */}
        <div className="inline-flex items-center gap-2.5 font-mono-v2 text-[10px] tracking-[3px] uppercase text-primary border border-primary/40 px-[18px] py-[7px] mb-11">
          <span className="w-[7px] h-[7px] bg-primary rounded-full animate-pulse" />
          Sistema Ativo — Abril 2026
        </div>

        <h1 className="font-display-v2 text-[clamp(72px,9vw,120px)] leading-[.92] tracking-[3px] text-foreground mb-1.5">
          SEU CORPO<br />
          FALA TODOS<br />
          OS DIAS<span className="text-primary">.</span>
        </h1>

        <p className="font-display-v2 text-[clamp(28px,3.5vw,46px)] tracking-[5px] text-muted-foreground mb-9">
          VOCÊ ESTÁ OUVINDO?
        </p>

        <p className="font-body-v2 text-[17px] text-muted-foreground/80 font-light leading-[1.8] max-w-[560px] mb-[52px]">
          O Método Renascer é o único sistema que cruza seus dados fisiológicos,
          mentais e de treino diariamente — e adapta seu protocolo
          em <strong className="text-foreground font-medium">tempo real</strong>. Não é um app genérico. É inteligência aplicada ao seu corpo.
        </p>

        <div className="flex gap-4 items-center flex-wrap">
          <a
            href="#v2-preco"
            className="font-mono-v2 text-[11px] tracking-[2.5px] uppercase bg-primary text-primary-foreground px-10 py-4 border border-primary hover:bg-transparent hover:text-primary transition-all duration-200 inline-block"
          >
            Começar Agora
          </a>
          <a
            href="#v2-sistema"
            className="font-mono-v2 text-[11px] tracking-[2px] uppercase bg-transparent text-muted-foreground px-10 py-4 border border-border hover:border-primary hover:text-primary transition-all duration-200 inline-block"
          >
            Ver Como Funciona →
          </a>
        </div>
      </div>

      {/* Floating metrics — desktop only */}
      <div className="absolute right-[60px] top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-4 z-[2]">
        {[
          { num: "365", label: "Dias Monitorados", sub: "Análise contínua" },
          { num: "6", label: "Índices Mentais", sub: "Psicologia aplicada" },
          { num: "30", label: "Dias de Contexto", sub: "Por prescrição" },
        ].map((m) => (
          <div key={m.label} className="bg-card border border-border p-[18px_24px] min-w-[190px] relative overflow-hidden hover:border-primary transition-colors">
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary" />
            <div className="font-display-v2 text-[46px] leading-none text-foreground tracking-[1px]">{m.num}</div>
            <div className="font-mono-v2 text-[9px] tracking-[2px] uppercase text-primary mt-1">{m.label}</div>
            <div className="font-body-v2 text-[11px] text-muted-foreground mt-0.5">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-[2]">
        <span className="font-mono-v2 text-[8px] tracking-[3px] uppercase text-muted-foreground">Scroll</span>
        <div className="w-[1px] h-[50px] origin-top animate-pulse" style={{ background: "linear-gradient(180deg, hsl(var(--primary)) 0%, transparent 100%)" }} />
      </div>
    </section>
  );
}
