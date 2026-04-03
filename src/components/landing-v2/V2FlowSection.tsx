import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const steps = [
  { n: "01", ico: "📲", title: "COLETA", text: "Você registra sono, estresse e energia. O wearable sincroniza VFC e FC automaticamente." },
  { n: "02", ico: "⚙️", title: "PROCESSO", text: "Centenas de variáveis processadas e convertidas em scores padronizados em tempo real." },
  { n: "03", ico: "🎯", title: "SCORE", text: "SIS Score e Renascer Score consolidam tudo em dois números que definem seu dia." },
  { n: "04", ico: "🧠", title: "PRESCRIÇÃO", text: "IA consome 30 dias de dados e gera seu protocolo de treino, nutrição e mindset." },
  { n: "05", ico: "🔔", title: "ALERTA", text: "Antes de qualquer problema surgir, o sistema detecta e notifica para intervenção." },
];

export function V2FlowSection() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <section id="v2-sistema" ref={ref} className="py-[110px] px-7 md:px-[60px] bg-card/50">
      <div className={`transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-7"}`}>
        <div className="flex items-center gap-3.5 font-mono-v2 text-[10px] tracking-[4px] uppercase text-primary mb-[18px]">
          01 — Como Funciona
          <span className="w-10 h-[1px] bg-primary" />
        </div>
        <h2 className="font-display-v2 text-[clamp(44px,5.5vw,72px)] tracking-[2px] leading-[.96] text-foreground mb-5">
          O SISTEMA QUE<br />NUNCA PARA
        </h2>
        <p className="font-body-v2 text-[16px] text-muted-foreground font-light max-w-[580px] leading-[1.8] mb-16">
          5 etapas que rodam 24h por dia — do momento em que você acorda até o próximo treino.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8 relative">
        {/* Dashed line — desktop only */}
        <div className="hidden md:block absolute top-[44px] left-[calc(10%+10px)] right-[calc(10%+10px)] h-[1px]" style={{ backgroundImage: "repeating-linear-gradient(90deg, hsl(var(--primary)) 0, hsl(var(--primary)) 8px, transparent 8px, transparent 18px)" }} />

        {steps.map((s, i) => (
          <div
            key={s.n}
            className={`flex flex-col items-center text-center px-3 transition-all duration-600 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}
            style={{ transitionDelay: `${i * 120}ms` }}
          >
            <div className="w-[88px] h-[88px] bg-card border border-border flex flex-col items-center justify-center mb-6 relative z-[1] hover:border-primary transition-colors">
              <div className="absolute inset-[5px] border border-primary/15" />
              <span className="font-mono-v2 text-[9px] tracking-[1px] text-primary">{s.n}</span>
              <span className="text-[22px] mt-0.5">{s.ico}</span>
            </div>
            <h3 className="font-display-v2 text-[18px] tracking-[2px] text-foreground mb-2.5">{s.title}</h3>
            <p className="font-body-v2 text-[12.5px] text-muted-foreground leading-[1.6]">{s.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
