import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useEffect, useState } from "react";

const pillars = [
  { name: "Mecânico", ico: "⚡", pct: 82, desc: "Volume de treino progressivo — sobrecarga real, não estimada.", weight: "25%" },
  { name: "Recuperação", ico: "😴", pct: 74, desc: "Sono + estresse + dados do wearable combinados.", weight: "20%" },
  { name: "Cognitivo", ico: "🧠", pct: 68, desc: "9 métricas de estado mental e emocional medidas todo dia.", weight: "15%" },
  { name: "Consistência", ico: "📅", pct: 91, desc: "Proporção de dias com treino e check-in nos últimos 14 dias.", weight: "20%" },
  { name: "Nutrição", ico: "🥗", pct: 77, desc: "Aderência às metas calóricas e de macros do protocolo.", weight: "20%" },
];

const CIRCUMFERENCE = 2 * Math.PI * 160; // r=160

export function V2SisScoreSection() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.15 });
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    if (isVisible) {
      const t = setTimeout(() => setAnimated(true), 200);
      return () => clearTimeout(t);
    }
  }, [isVisible]);

  const scoreValue = 78;
  const dashOffset = animated ? CIRCUMFERENCE * (1 - scoreValue / 100) : CIRCUMFERENCE;

  return (
    <section ref={ref} className="py-[110px] px-7 md:px-[60px]">
      <div className={`transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-7"}`}>
        <div className="flex items-center gap-3.5 font-mono-v2 text-[10px] tracking-[4px] uppercase text-primary mb-[18px]">
          02 — Score Central
          <span className="w-10 h-[1px] bg-primary" />
        </div>
        <h2 className="font-display-v2 text-[clamp(44px,5.5vw,72px)] tracking-[2px] leading-[.96] text-foreground mb-5">
          SHAPE INTELLIGENCE<br />SCORE™
        </h2>
        <p className="font-body-v2 text-[16px] text-muted-foreground font-light max-w-[580px] leading-[1.8] mb-16">
          Um número. Cinco dimensões. Calculado todos os dias.<br />
          Ele sabe mais sobre seu estado real do que qualquer avaliação mensal.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-20 items-center">
        {/* Dial */}
        <div className="relative w-[280px] h-[280px] md:w-[320px] md:h-[320px] mx-auto lg:mx-0 flex-shrink-0">
          <svg className="-rotate-90 w-full h-full" viewBox="0 0 340 340">
            <circle cx="170" cy="170" r="160" fill="none" stroke="hsl(var(--secondary))" strokeWidth="16" />
            <circle
              cx="170" cy="170" r="160" fill="none"
              stroke="hsl(var(--primary))" strokeWidth="16" strokeLinecap="butt"
              strokeDasharray={`${CIRCUMFERENCE}`}
              strokeDashoffset={dashOffset}
              className="transition-all duration-[1800ms]"
              style={{ transitionTimingFunction: "cubic-bezier(.23,1,.32,1)" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display-v2 text-[80px] text-foreground leading-none tracking-[2px]">
              {animated ? scoreValue : 0}
            </span>
            <span className="font-mono-v2 text-[9px] tracking-[3px] text-primary mt-0.5">SIS SCORE</span>
          </div>
        </div>

        {/* Pillars */}
        <div className="flex flex-col gap-5">
          {pillars.map((p) => (
            <div key={p.name}>
              <div className="grid grid-cols-[150px_1fr_44px] items-center gap-4 md:gap-[18px]">
                <span className="font-mono-v2 text-[10px] tracking-[1.5px] text-foreground/80 uppercase flex items-center gap-2">
                  {p.ico} {p.name}
                </span>
                <div className="h-1 bg-secondary relative overflow-hidden">
                  <div
                    className="h-full transition-all duration-[1400ms]"
                    style={{
                      width: animated ? `${p.pct}%` : "0%",
                      background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary) / 0.7))",
                      transitionTimingFunction: "cubic-bezier(.23,1,.32,1)",
                    }}
                  />
                </div>
                <span className="font-mono-v2 text-[12px] text-primary text-right">{p.pct}%</span>
              </div>
              <p className="font-body-v2 text-[12px] text-muted-foreground mt-1 ml-0 md:ml-[168px]">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
