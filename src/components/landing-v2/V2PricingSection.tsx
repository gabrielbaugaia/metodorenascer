import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const plans = [
  {
    tier: "Nível 01",
    name: "ESSENCIAL",
    from: "A partir de",
    price: "97",
    desc: "Acesso completo ao sistema de inteligência. Para quem quer autonomia com dados reais guiando cada decisão.",
    items: [
      "SIS Score™ calculado diariamente",
      "Renascer Score™ — prontidão para treino",
      "Health Readiness com wearable",
      "6 índices de inteligência mental",
      "Plano de 90 dias adaptativo",
      "IA disponível 24h",
      "App completo com check-ins",
    ],
    cta: "Começar com Essencial",
    featured: false,
  },
  {
    tier: "Nível 02",
    name: "PRO",
    from: "A partir de",
    price: "297",
    desc: "Tudo do Essencial com acompanhamento semanal direto. Para quem quer resultado acelerado com suporte especializado.",
    items: [
      "Tudo do plano Essencial",
      "Acompanhamento semanal com Baú",
      "Análise completa a cada 4 semanas",
      "Alertas prioritários com resposta em 24h",
      "Protocolo ortopédico personalizado",
      "Revisão de fotos e composição corporal",
      "Ajuste dinâmico de protocolo",
      "Acesso a grupo exclusivo PRO",
    ],
    cta: "Começar com PRO",
    featured: true,
  },
  {
    tier: "Nível 03",
    name: "ELITE",
    from: "A partir de",
    price: "697",
    desc: "Acesso total com presença direta. Para executivos e atletas que exigem o máximo de cuidado e precisão.",
    items: [
      "Tudo do plano PRO",
      "Call semanal 1:1 com Baú (60 min)",
      "Acesso direto via WhatsApp",
      "Presencial em Alphaville (opcional)",
      "Reabilitação ortopédica integrada",
      "Protocolo executivo de performance",
      "Prioridade máxima em todos os alertas",
      "Análise quinzenal com relatório completo",
    ],
    cta: "Falar com Baú",
    featured: false,
  },
];

const compareRows = [
  ["SIS Score™ diário", "✓", "✓", "✓"],
  ["Renascer Score™", "✓", "✓", "✓"],
  ["IA disponível 24h", "✓", "✓", "✓"],
  ["Plano de 90 dias", "✓", "✓", "✓"],
  ["Acompanhamento humano semanal", "—", "✓", "✓"],
  ["Protocolo ortopédico", "—", "✓", "✓"],
  ["Call 1:1 semanal", "—", "—", "✓"],
  ["WhatsApp direto com Baú", "—", "—", "✓"],
  ["Sessão presencial (Alphaville)", "—", "—", "✓"],
];

export function V2PricingSection() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.05 });

  return (
    <section id="v2-preco" ref={ref} className="py-[110px] px-7 md:px-[60px] relative overflow-hidden">
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 60% at 50% 40%, rgba(255,101,0,.05) 0%, transparent 65%)" }} />

      <div className={`relative z-[1] text-center mb-[72px] transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-7"}`}>
        <div className="flex items-center justify-center gap-3.5 font-mono-v2 text-[10px] tracking-[4px] uppercase text-primary mb-[18px]">
          05 — Planos
        </div>
        <h2 className="font-display-v2 text-[clamp(44px,5.5vw,72px)] tracking-[2px] leading-[.96] text-foreground mb-5">
          ESCOLHA SEU<br />NÍVEL DE INTELIGÊNCIA
        </h2>
        <p className="font-body-v2 text-[16px] text-muted-foreground font-light max-w-[580px] mx-auto leading-[1.8]">
          Três caminhos para transformação real. Cada plano acessa o sistema completo —
          a diferença está na profundidade do acompanhamento humano.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[2px] relative z-[1]">
        {plans.map((p) => (
          <div
            key={p.name}
            className={`bg-card border p-[44px_36px_40px] flex flex-col relative overflow-hidden transition-transform duration-300 hover:-translate-y-1.5 ${
              p.featured
                ? "border-primary bg-secondary -translate-y-2 hover:-translate-y-3.5"
                : "border-border"
            }`}
          >
            {p.featured && (
              <div className="absolute -top-px left-1/2 -translate-x-1/2 bg-primary font-mono-v2 text-[9px] tracking-[2.5px] uppercase text-primary-foreground px-5 py-[5px] whitespace-nowrap">
                Mais Escolhido
              </div>
            )}

            <span className="font-mono-v2 text-[9.5px] tracking-[3px] uppercase text-primary mb-3">{p.tier}</span>
            <h3 className="font-display-v2 text-[34px] tracking-[2px] text-foreground mb-6 leading-none">{p.name}</h3>

            <div className="mb-7">
              <span className="font-mono-v2 text-[9px] tracking-[2px] uppercase text-muted-foreground block mb-1">{p.from}</span>
              <span className="font-display-v2 text-[64px] text-foreground leading-none">
                <span className="text-[28px] align-super mr-0.5 text-muted-foreground">R$</span>
                {p.price}
                <span className="font-mono-v2 text-[11px] tracking-[1px] text-muted-foreground ml-1">/mês</span>
              </span>
            </div>

            <p className="font-body-v2 text-[13px] text-muted-foreground leading-[1.65] mb-7">{p.desc}</p>

            <div className="h-[1px] bg-border mb-7" />

            <ul className="flex-1 mb-9 space-y-0">
              {p.items.map((item) => (
                <li key={item} className="flex items-start gap-3 font-body-v2 text-[13px] text-foreground/80 leading-[1.55] py-[7px] border-b border-border last:border-none">
                  <span className="font-mono-v2 text-[11px] text-primary flex-shrink-0 mt-0.5">→</span>
                  {item}
                </li>
              ))}
            </ul>

            <a
              href="#"
              className={`font-mono-v2 text-[10px] tracking-[2.5px] uppercase p-[15px] text-center border block transition-all duration-200 ${
                p.featured
                  ? "bg-primary border-primary text-primary-foreground hover:bg-transparent hover:text-primary"
                  : "bg-transparent border-border text-muted-foreground hover:border-primary hover:text-primary"
              }`}
            >
              {p.cta}
            </a>
          </div>
        ))}
      </div>

      {/* Comparison table */}
      <div className="mt-20 overflow-x-auto relative z-[1]">
        <p className="font-mono-v2 text-[10px] tracking-[4px] uppercase text-primary text-center mb-8">Comparativo Completo</p>
        <table className="w-full border-collapse min-w-[600px]">
          <thead>
            <tr>
              {["O que está incluso", "Essencial", "PRO", "Elite"].map((h, i) => (
                <th key={h} className={`bg-secondary font-mono-v2 text-[10px] tracking-[2.5px] uppercase p-[18px_24px] text-left border border-border ${i === 0 ? "text-muted-foreground" : "text-primary"}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {compareRows.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className={`p-[16px_24px] border border-border text-[13.5px] leading-[1.5] ${
                      ri % 2 === 0 ? "bg-card" : "bg-secondary"
                    } ${ci === 0 ? "text-foreground font-medium" : ""} ${
                      cell === "✓" ? "text-primary" : cell === "—" ? "text-border" : "text-foreground/80"
                    }`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
