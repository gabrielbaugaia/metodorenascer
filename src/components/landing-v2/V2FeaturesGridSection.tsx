import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const features = [
  { ico: "📊", title: "Score Diário", tag: "Shape Intelligence Score™", desc: "Índice de 0 a 100 que consolida treino, sono, mente, consistência e nutrição num único número calculado todo dia." },
  { ico: "🔋", title: "Prontidão", tag: "Renascer Score™", desc: "Determina o volume exato de treino para o dia — 100%, 80%, 50% ou recuperação ativa — com base em como você acordou." },
  { ico: "💓", title: "Fisiologia", tag: "Health Readiness", desc: "Seu wearable vira ferramenta clínica. VFC, FC de repouso e qualidade de sono cruzados com dados subjetivos." },
  { ico: "🧬", title: "Psicologia", tag: "Inteligência Mental", desc: "6 índices que detectam burnout, compulsão alimentar, queda de motivação e isolamento — antes de virar problema." },
  { ico: "🎭", title: "Comportamento", tag: "Perfil Adaptativo", desc: "4 perfis comportamentais identificados automaticamente. Cada um recebe desafios, comunicação e estratégias próprias." },
  { ico: "📅", title: "Ciclo", tag: "Plano de 90 Dias", desc: "Análise → Prescrição → Execução → Ajuste. Protocolo que evolui a cada semana com dados reais, fotos e composição corporal." },
];

export function V2FeaturesGridSection() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <section ref={ref} className="py-[110px] px-7 md:px-[60px] bg-card/50">
      <div className={`transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-7"}`}>
        <div className="flex items-center gap-3.5 font-mono-v2 text-[10px] tracking-[4px] uppercase text-primary mb-[18px]">
          03 — Subsistemas
          <span className="w-10 h-[1px] bg-primary" />
        </div>
        <h2 className="font-display-v2 text-[clamp(44px,5.5vw,72px)] tracking-[2px] leading-[.96] text-foreground mb-5">
          6 SISTEMAS<br />TRABALHANDO POR VOCÊ
        </h2>
        <p className="font-body-v2 text-[16px] text-muted-foreground font-light max-w-[580px] leading-[1.8] mb-16">
          Cada subsistema monitora uma dimensão específica do seu desempenho.
          Juntos, formam a inteligência mais completa disponível em performance humana.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[2px]">
        {features.map((f, i) => (
          <div
            key={f.title}
            className={`bg-card border border-border p-10 relative overflow-hidden group hover:border-primary transition-all duration-300 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}
            style={{ transitionDelay: `${i * 80}ms` }}
          >
            {/* Left accent bar */}
            <div className="absolute left-0 top-0 w-[3px] h-0 bg-primary group-hover:h-full transition-all duration-350" />
            {/* Corner fold */}
            <div className="absolute top-0 right-0 w-0 h-0 border-solid border-t-0 border-r-[28px] border-b-[28px] border-l-0 border-transparent border-r-primary/10 group-hover:border-r-[44px] group-hover:border-b-[44px] transition-all duration-300" />

            <span className="text-[34px] block mb-5">{f.ico}</span>
            <h3 className="font-display-v2 text-[22px] tracking-[1px] text-foreground mb-2">{f.title}</h3>
            <span className="font-mono-v2 text-[9px] tracking-[2.5px] uppercase text-primary block mb-3.5">{f.tag}</span>
            <p className="font-body-v2 text-[13.5px] text-muted-foreground leading-[1.7]">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
