import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const testimonials = [
  { stars: "★★★★★", text: "\"Em 90 dias meu SIS Score saiu de 42 para 78. O sistema detectou que meu problema era sono — não treino. Nunca teria chegado nisso sozinho.\"", name: "Rafael M.", role: "Diretor Comercial · Plano PRO", initial: "R" },
  { stars: "★★★★★", text: "\"Tinha dor no joelho há 2 anos. O protocolo ortopédico do Baú aliado ao sistema de dados resolveu em 6 semanas o que nenhum fisioterapeuta conseguiu.\"", name: "Camila S.", role: "Empresária · Plano Elite", initial: "C" },
  { stars: "★★★★★", text: "\"O alerta de burnout chegou 12 dias antes de eu sentir qualquer coisa. O sistema me poupou de um colapso que eu não estava vendo vir.\"", name: "André P.", role: "CEO · Plano Elite", initial: "A" },
];

export function V2TestimonialsSection() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <section ref={ref} className="py-[110px] px-7 md:px-[60px]">
      <div className={`transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-7"}`}>
        <div className="flex items-center gap-3.5 font-mono-v2 text-[10px] tracking-[4px] uppercase text-primary mb-[18px]">
          06 — Resultados
          <span className="w-10 h-[1px] bg-primary" />
        </div>
        <h2 className="font-display-v2 text-[clamp(44px,5.5vw,72px)] tracking-[2px] leading-[.96] text-foreground mb-5">
          O QUE MUDA QUANDO<br />VOCÊ TREINA COM DADOS
        </h2>
        <p className="font-body-v2 text-[16px] text-muted-foreground font-light max-w-[580px] leading-[1.8] mb-16">
          Resultados reais de pessoas que pararam de adivinhar e começaram a medir.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-[2px]">
        {testimonials.map((t) => (
          <div key={t.name} className="bg-card border border-border p-9 relative hover:border-primary transition-colors">
            <span className="absolute top-6 right-7 font-display-v2 text-[60px] text-primary/7 leading-none">"</span>
            <div className="text-primary text-[14px] tracking-[3px] mb-4">{t.stars}</div>
            <p className="font-body-v2 text-[14px] text-foreground/80 leading-[1.75] font-light italic mb-6">{t.text}</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/8 border border-primary flex items-center justify-center font-display-v2 text-[18px] text-primary">
                {t.initial}
              </div>
              <div>
                <span className="font-mono-v2 text-[10px] tracking-[1.5px] uppercase text-foreground block">{t.name}</span>
                <span className="font-body-v2 text-[11px] text-muted-foreground">{t.role}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
