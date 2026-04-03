import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const alerts = [
  { ico: "🏋️", tag: "Alerta Automático", title: "Overtraining", body: "VFC em queda por 5+ dias + FC de repouso elevada + queda na motivação. Detectado antes da lesão.", action: "→ Deload automático + notificação ao prescritor" },
  { ico: "❤️", tag: "Alta Prioridade", title: "Estresse Crônico", body: "Estresse >70% + sono <6h por 5+ dias. Correlacionado com VFC reduzida e risco cardiovascular.", action: "→ Revisão de carga + técnicas de recuperação" },
  { ico: "⚡", tag: "Alerta Crítico", title: "Fadiga Oculta", body: "Você diz estar bem — mas VFC baixa e FC elevada revelam burnout não percebido. Dados têm prioridade.", action: "→ Dados objetivos sobrepõem o auto-reporte" },
  { ico: "🧠", tag: "Alta Prioridade", title: "Risco de Burnout", body: "Sem interação social por 5+ dias + ansiedade ≥4/5 por 4+ dias + queda progressiva de humor.", action: "→ Intervenção do prescritor + suporte imediato" },
];

export function V2DetectionSection() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <section id="v2-deteccao" ref={ref} className="py-[110px] px-7 md:px-[60px]">
      <div className={`transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-7"}`}>
        <div className="flex items-center gap-3.5 font-mono-v2 text-[10px] tracking-[4px] uppercase text-primary mb-[18px]">
          04 — Prevenção
          <span className="w-10 h-[1px] bg-primary" />
        </div>
        <h2 className="font-display-v2 text-[clamp(44px,5.5vw,72px)] tracking-[2px] leading-[.96] text-foreground mb-5">
          DETECTA O PROBLEMA<br />ANTES DE VOCÊ
        </h2>
        <p className="font-body-v2 text-[16px] text-muted-foreground font-light max-w-[580px] leading-[1.8] mb-16">
          Nenhum método tradicional faz isso. O Renascer identifica padrões de risco
          silenciosos antes que se manifestem — e age automaticamente.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-[2px]">
        {alerts.map((a, i) => (
          <div
            key={a.title}
            className={`bg-card border border-border p-8 grid grid-cols-[60px_1fr] gap-5 items-start hover:border-primary transition-all duration-300 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}
            style={{ transitionDelay: `${i * 100}ms` }}
          >
            <div className="w-[60px] h-[60px] bg-primary/8 border border-primary flex items-center justify-center text-[24px] flex-shrink-0">
              {a.ico}
            </div>
            <div>
              <div className="font-mono-v2 text-[8.5px] tracking-[2px] uppercase text-primary mb-1.5">{a.tag}</div>
              <h3 className="font-display-v2 text-[22px] tracking-[1px] text-foreground mb-2">{a.title}</h3>
              <p className="font-body-v2 text-[12.5px] text-muted-foreground leading-[1.65]">{a.body}</p>
              <p className="font-mono-v2 text-[9.5px] tracking-[1px] text-primary mt-3">{a.action}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
