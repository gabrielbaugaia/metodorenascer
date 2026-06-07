import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import gabrielBauPhoto from "@/assets/gabriel-bau.png";
import transform1 from "@/assets/transformations/transform-1.jpeg";
import transform2 from "@/assets/transformations/transform-2.jpeg";
import transform3 from "@/assets/transformations/transform-3.jpeg";
import transform4 from "@/assets/transformations/transform-4.jpeg";
import transform5 from "@/assets/transformations/transform-5.jpeg";

/* ============================================================
 * LP HEADER — transparente; blur ao rolar
 * ============================================================ */
export function LPHeader() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "lp-header-scrolled" : ""
      }`}
      style={{
        backdropFilter: scrolled ? "blur(20px) saturate(140%)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(20px) saturate(140%)" : "none",
        background: scrolled ? "rgba(11,11,11,0.72)" : "transparent",
        borderBottom: scrolled ? "1px solid rgba(167,167,167,0.08)" : "1px solid transparent",
      }}
    >
      <div className="flex items-center justify-between px-6 md:px-14 h-[72px]">
        <a href="#top" className="lp-mono text-[11px] tracking-[3px] uppercase lp-text">
          RENASCER<span className="lp-accent">.</span>
        </a>
        <nav className="hidden md:flex items-center gap-10">
          {[
            ["Método", "#metodo"],
            ["Sistema", "#sistema"],
            ["Resultados", "#resultados"],
            ["Planos", "#planos"],
          ].map(([label, href]) => (
            <a key={href} href={href} className="lp-mono text-[10px] tracking-[2.5px] uppercase lp-muted hover:lp-text transition-colors">
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3 md:gap-5">
          <Link to="/auth" className="lp-btn-primary lp-mono text-[10px] tracking-[2px] uppercase">
            Entrar
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ============================================================
 * SECTION 01 — HERO
 * ============================================================ */
function HeroParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
    };
    resize();
    window.addEventListener("resize", resize);
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vy: -0.05 - Math.random() * 0.15,
      vx: (Math.random() - 0.5) * 0.05,
      r: Math.random() * 1.2 + 0.3,
      a: Math.random() * 0.5 + 0.1,
    }));
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * dpr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,90,31,${p.a})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

export function LPHero() {
  return (
    <section
      id="top"
      className="relative min-h-[100svh] flex flex-col overflow-hidden pt-28 md:pt-36 pb-10 md:pb-14"
      style={{ background: "linear-gradient(180deg, #0B0B0B 0%, #0B0B0B 70%, #0E0E0E 100%)" }}
    >
      {/* Gabriel photo — desktop background right */}
      <div
        className="absolute inset-y-0 right-0 w-full md:w-[55%] lg:w-[50%] opacity-[0.22] md:opacity-100 pointer-events-none"
        style={{
          backgroundImage: `url(${gabrielBauPhoto})`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
          maskImage:
            "linear-gradient(90deg, transparent 0%, #000 35%, #000 100%), linear-gradient(180deg, #000 60%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(90deg, transparent 0%, #000 35%, #000 100%), linear-gradient(180deg, #000 60%, transparent 100%)",
          maskComposite: "intersect",
          WebkitMaskComposite: "source-in",
        }}
      />
      {/* Hero gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 70% at 15% 50%, rgba(255,90,31,0.08), transparent 70%), linear-gradient(90deg, #0B0B0B 0%, #0B0B0B 35%, transparent 70%)",
        }}
      />
      <HeroParticles />

      <div className="relative z-10 w-full px-6 md:px-14 flex-1 flex flex-col justify-between gap-12 md:gap-16">
        <div className="max-w-[640px]">
          <div className="lp-mono text-[10px] tracking-[4px] uppercase lp-accent mb-6 lp-fade-up">
            Método Renascer · Est. Alphaville
          </div>
          <h1
            className="lp-display lp-text leading-[0.9] tracking-[-0.03em] mb-6 lp-fade-up"
            style={{ fontSize: "clamp(44px, 8vw, 120px)", animationDelay: "0.1s" }}
          >
            PARE DE<br />
            <span className="italic font-light" style={{ color: "#A7A7A7" }}>recomeçar</span>.
          </h1>
          <p
            className="lp-body lp-muted leading-[1.6] max-w-[520px] mb-8 md:mb-10 lp-fade-up"
            style={{ fontSize: "clamp(15px, 1.3vw, 18px)", animationDelay: "0.2s" }}
          >
            O Método Renascer combina ciência, acompanhamento humano e inteligência de dados
            para criar a direção que faltava para seu corpo voltar a evoluir.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 lp-fade-up" style={{ animationDelay: "0.3s" }}>
            <a
              href="#planos"
              className="lp-btn-primary lp-mono text-[11px] tracking-[2.5px] uppercase w-full sm:w-auto text-center"
            >
              Começar meu diagnóstico
            </a>
            <a
              href="#sistema"
              className="lp-btn-ghost lp-mono text-[11px] tracking-[2.5px] uppercase w-full sm:w-auto text-center"
            >
              Como funciona
            </a>
          </div>
        </div>

        {/* Social proof bar — in natural flow, pinned to hero bottom by justify-between */}
        <div
          className="pt-8 border-t border-white/5 grid grid-cols-1 sm:flex sm:flex-wrap items-baseline gap-x-10 md:gap-x-14 gap-y-4 lp-fade-up"
          style={{ animationDelay: "0.5s" }}
        >
          {[
            ["+15", "anos de experiência"],
            ["+1000", "alunos impactados"],
            ["100%", "baseado em ciência"],
          ].map(([n, l]) => (
            <div key={l} className="flex items-baseline gap-3">
              <span className="lp-display lp-text text-[22px] tracking-tight">{n}</span>
              <span className="lp-mono text-[9px] tracking-[2.5px] uppercase lp-muted">{l}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


/* ============================================================
 * SECTION 02 — THE REAL PROBLEM
 * ============================================================ */
export function LPProblem() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.2 });
  return (
    <section ref={ref} className="relative py-[120px] md:py-[200px] px-6 md:px-14 overflow-hidden" style={{ background: "#0B0B0B" }}>
      <div className="max-w-[1200px] mx-auto">
        <div className="lp-mono text-[10px] tracking-[4px] uppercase lp-accent mb-10">01 — O Problema</div>
        <h2
          className={`lp-display lp-text leading-[0.94] tracking-[-0.03em] max-w-[900px] mb-20 md:mb-28 transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
          style={{ fontSize: "clamp(44px, 6.5vw, 96px)" }}
        >
          O problema<br />não é <span className="italic font-light lp-muted">você</span>.
        </h2>

        <div className="grid md:grid-cols-2 gap-px" style={{ background: "rgba(167,167,167,0.08)" }}>
          <div
            className={`p-10 md:p-16 transition-all duration-1000 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-6"}`}
            style={{ background: "#0B0B0B", transitionDelay: "0.1s" }}
          >
            <div className="lp-mono text-[10px] tracking-[3px] uppercase lp-muted mb-6">Antes</div>
            <h3 className="lp-display lp-text leading-[1] mb-8" style={{ fontSize: "clamp(36px, 4.5vw, 64px)" }}>
              Caos.
            </h3>
            <ul className="space-y-4 lp-body lp-muted text-[15px] leading-[1.7]">
              <li>Você já tentou dieta.</li>
              <li>Já tentou academia.</li>
              <li>Já tentou motivação.</li>
              <li className="lp-text">Mas continua recomeçando.</li>
            </ul>
          </div>
          <div
            className={`p-10 md:p-16 transition-all duration-1000 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-6"}`}
            style={{
              background: "linear-gradient(135deg, #161616 0%, #0B0B0B 100%)",
              transitionDelay: "0.3s",
            }}
          >
            <div className="lp-mono text-[10px] tracking-[3px] uppercase lp-accent mb-6">Depois</div>
            <h3 className="lp-display lp-text leading-[1] mb-8" style={{ fontSize: "clamp(36px, 4.5vw, 64px)" }}>
              Direção.
            </h3>
            <p className="lp-body lp-text text-[17px] leading-[1.7] max-w-[400px]">
              Porque ninguém te ensinou a construir <em className="lp-accent not-italic">um sistema</em>.
            </p>
            <div className="mt-10 h-px w-16 lp-accent-bg" />
            <p className="lp-mono text-[10px] tracking-[2.5px] uppercase lp-muted mt-6">
              O sistema é o método. O método é o Renascer.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
 * SECTION 03 — ABOUT GABRIEL BAÚ
 * ============================================================ */
export function LPMentor() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.15 });
  return (
    <section ref={ref} id="metodo" className="relative py-[120px] md:py-[200px] px-6 md:px-14 overflow-hidden" style={{ background: "#0B0B0B" }}>
      <div className="max-w-[1280px] mx-auto grid md:grid-cols-12 gap-12 md:gap-20 items-center">
        <div className={`md:col-span-6 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="relative aspect-[4/5] overflow-hidden">
            <div className="absolute inset-0 lp-accent-bg opacity-20 blur-3xl scale-90" />
            <img
              src={gabrielBauPhoto}
              alt="Gabriel Baú — criador do Método Renascer"
              className="relative w-full h-full object-cover object-top grayscale-[20%]"
              loading="lazy"
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 50%, rgba(11,11,11,0.6) 100%)" }} />
            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
              <div>
                <div className="lp-mono text-[9px] tracking-[3px] uppercase lp-accent mb-1">Mentor</div>
                <div className="lp-display lp-text text-[22px] tracking-tight">Gabriel Baú</div>
              </div>
              <div className="lp-mono text-[9px] tracking-[2px] uppercase lp-muted">Alphaville · BR</div>
            </div>
          </div>
        </div>

        <div className={`md:col-span-6 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`} style={{ transitionDelay: "0.2s" }}>
          <div className="lp-mono text-[10px] tracking-[4px] uppercase lp-accent mb-8">02 — Autoridade</div>
          <h2 className="lp-display lp-text leading-[0.94] tracking-[-0.03em] mb-10" style={{ fontSize: "clamp(40px, 5.5vw, 80px)" }}>
            Quem está<br />por trás<br /><span className="italic font-light lp-muted">do método</span>.
          </h2>
          <p className="lp-body lp-text text-[18px] leading-[1.7] mb-6">
            Mestre em Ciência do Exercício. Especialista em performance e reabilitação.
          </p>
          <p className="lp-body lp-muted text-[16px] leading-[1.8] max-w-[500px]">
            Mais de 15 anos ajudando pessoas a reconstruírem corpo, saúde e confiança —
            transformando o que parecia bagunça em direção mensurável.
          </p>
          <div className="grid grid-cols-3 gap-6 mt-12 max-w-[440px]">
            {[
              ["Mestrado", "Ciência do Exercício"],
              ["15+", "anos de prática"],
              ["1.000+", "vidas transformadas"],
            ].map(([n, l]) => (
              <div key={l}>
                <div className="lp-display lp-text text-[28px] leading-none mb-1">{n}</div>
                <div className="lp-mono text-[8px] tracking-[2px] uppercase lp-muted leading-[1.4]">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
 * SECTION 04 — 5 PILLARS (vertical timeline)
 * ============================================================ */
const PILLARS = [
  { n: "01", title: "Clareza", text: "Diagnóstico fisiológico, cognitivo e comportamental. Você vê seu corpo pela primeira vez como dado." },
  { n: "02", title: "Movimento", text: "Treino prescrito por objetivo, histórico e prontidão diária. Sem planilha genérica." },
  { n: "03", title: "Nutrição", text: "Estratégia alimentar adaptável à sua rotina real — não a uma rotina ideal que ninguém vive." },
  { n: "04", title: "Rotina", text: "Sono, recuperação, estresse e disciplina como variáveis do sistema. Não como autoajuda." },
  { n: "05", title: "Ajuste", text: "Revisão contínua. O método aprende com você e recalibra a direção a cada semana." },
];

export function LPPillars() {
  return (
    <section id="sistema" className="relative py-[120px] md:py-[200px] px-6 md:px-14" style={{ background: "#0B0B0B" }}>
      <div className="max-w-[1200px] mx-auto">
        <div className="lp-mono text-[10px] tracking-[4px] uppercase lp-accent mb-10">03 — Método</div>
        <h2 className="lp-display lp-text leading-[0.94] tracking-[-0.03em] mb-20 md:mb-32 max-w-[900px]" style={{ fontSize: "clamp(44px, 6vw, 88px)" }}>
          Os 5 pilares<br />
          <span className="italic font-light lp-muted">do Renascer</span>.
        </h2>

        <div className="relative">
          {/* Vertical accent line */}
          <div className="absolute left-[18px] md:left-[80px] top-0 bottom-0 w-px" style={{ background: "linear-gradient(180deg, rgba(255,90,31,0.5) 0%, rgba(167,167,167,0.1) 100%)" }} />
          <div className="space-y-20 md:space-y-32">
            {PILLARS.map((p, i) => (
              <PillarRow key={p.n} {...p} delay={i * 100} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PillarRow({ n, title, text, delay }: { n: string; title: string; text: string; delay: number }) {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.3 });
  return (
    <div
      ref={ref}
      className={`relative pl-12 md:pl-[140px] transition-all duration-1000 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="absolute left-0 md:left-[60px] top-2 w-10 h-10 flex items-center justify-center">
        <div className="absolute inset-0 lp-accent-bg rounded-full opacity-100" style={{ width: 8, height: 8, top: 16, left: 14 }} />
      </div>
      <div className="lp-mono text-[11px] tracking-[3px] uppercase lp-accent mb-4">{n}</div>
      <h3 className="lp-display lp-text leading-[1] mb-6" style={{ fontSize: "clamp(40px, 5vw, 72px)" }}>
        {title}
      </h3>
      <p className="lp-body lp-muted text-[17px] leading-[1.7] max-w-[560px]">{text}</p>
    </div>
  );
}

/* ============================================================
 * SECTION 05 — WHY IT WORKS (dashboard mockup)
 * ============================================================ */
export function LPDashboard() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.15 });
  const metrics = [
    { label: "Sono", value: 87, hint: "8h 12m médio" },
    { label: "Treino", value: 92, hint: "4 sessões / semana" },
    { label: "Recuperação", value: 78, hint: "HRV estável" },
    { label: "Nutrição", value: 84, hint: "Aderência consistente" },
    { label: "Consistência", value: 95, hint: "21 dias seguidos" },
  ];
  return (
    <section ref={ref} className="relative py-[120px] md:py-[200px] px-6 md:px-14 overflow-hidden" style={{ background: "linear-gradient(180deg, #0B0B0B 0%, #0E0E0E 50%, #0B0B0B 100%)" }}>
      <div className="max-w-[1280px] mx-auto grid md:grid-cols-12 gap-16 items-center">
        <div className={`md:col-span-5 transition-all duration-1000 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-6"}`}>
          <div className="lp-mono text-[10px] tracking-[4px] uppercase lp-accent mb-8">04 — Inteligência</div>
          <h2 className="lp-display lp-text leading-[0.94] tracking-[-0.03em] mb-10" style={{ fontSize: "clamp(40px, 5.5vw, 80px)" }}>
            Você<br />para<br /><span className="italic font-light lp-muted">de adivinhar</span>.
          </h2>
          <div className="space-y-4 lp-body lp-text text-[17px] leading-[1.6] max-w-[420px]">
            <p>Quando você <span className="lp-accent">mede</span>, você entende.</p>
            <p>Quando você <span className="lp-accent">entende</span>, você ajusta.</p>
            <p>Quando você <span className="lp-accent">ajusta</span>, você evolui.</p>
          </div>
        </div>

        <div className={`md:col-span-7 transition-all duration-1000 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-6"}`} style={{ transitionDelay: "0.2s" }}>
          <div
            className="relative p-8 md:p-10"
            style={{
              background: "linear-gradient(160deg, rgba(22,22,22,0.95) 0%, rgba(11,11,11,0.9) 100%)",
              border: "1px solid rgba(167,167,167,0.12)",
              borderRadius: 4,
              boxShadow: "0 40px 80px -20px rgba(0,0,0,0.6), 0 0 80px -40px rgba(255,90,31,0.15)",
              backdropFilter: "blur(20px)",
            }}
          >
            <div className="flex items-center justify-between mb-8 pb-6" style={{ borderBottom: "1px solid rgba(167,167,167,0.1)" }}>
              <div>
                <div className="lp-mono text-[9px] tracking-[3px] uppercase lp-muted mb-1">SIS Score™</div>
                <div className="lp-display lp-text text-[40px] leading-none">
                  87<span className="lp-mono text-[12px] lp-muted ml-2">/100</span>
                </div>
              </div>
              <div className="text-right">
                <div className="lp-mono text-[9px] tracking-[3px] uppercase lp-accent mb-1">Tendência</div>
                <div className="lp-body lp-text text-[14px]">↑ 12% em 30 dias</div>
              </div>
            </div>
            <div className="space-y-6">
              {metrics.map((m, i) => (
                <div key={m.label} className="lp-fade-up" style={{ animationDelay: `${0.3 + i * 0.08}s` }}>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="lp-mono text-[10px] tracking-[2.5px] uppercase lp-text">{m.label}</span>
                    <span className="lp-mono text-[10px] tracking-[1px] lp-muted">{m.hint}</span>
                  </div>
                  <div className="relative h-[2px]" style={{ background: "rgba(167,167,167,0.1)" }}>
                    <div
                      className="absolute inset-y-0 left-0 lp-accent-bg transition-all duration-1000"
                      style={{ width: isVisible ? `${m.value}%` : "0%", transitionDelay: `${0.5 + i * 0.1}s` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
 * SECTION 06 — REAL TRANSFORMATIONS
 * ============================================================ */
const TRANSFORMATIONS = [
  { img: transform1, name: "Alan", role: "Pizzaiolo", result: "-10kg em 60 dias", note: "Medicamentos suspensos pelo médico." },
  { img: transform2, name: "Marcelo", role: "Executivo", result: "Retomou controle total", note: "Sono e energia em níveis de uma década atrás." },
  { img: transform3, name: "Patrícia", role: "Empreendedora", result: "Reconstrução completa", note: "Disciplina sustentada sem rigidez." },
  { img: transform4, name: "Rafael", role: "Engenheiro", result: "Composição corporal restaurada", note: "Saiu do platô após anos." },
  { img: transform5, name: "Camila", role: "Médica", result: "Performance e longevidade", note: "Treino prescrito por dado, não por achismo." },
];

export function LPTransformations() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });
  return (
    <section ref={ref} id="resultados" className="relative py-[120px] md:py-[180px] px-6 md:px-14" style={{ background: "#0B0B0B" }}>
      <div className="max-w-[1280px] mx-auto">
        <div className="lp-mono text-[10px] tracking-[4px] uppercase lp-accent mb-10">05 — Provas</div>
        <h2 className="lp-display lp-text leading-[0.94] tracking-[-0.03em] mb-20 max-w-[800px]" style={{ fontSize: "clamp(44px, 6vw, 88px)" }}>
          Resultados<br /><span className="italic font-light lp-muted">reais</span>.
        </h2>

        <div className="space-y-24 md:space-y-40">
          {TRANSFORMATIONS.map((t, i) => (
            <div
              key={t.name}
              className={`grid md:grid-cols-12 gap-10 md:gap-16 items-center transition-all duration-1000 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              } ${i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""}`}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <div className="md:col-span-7">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img src={t.img} alt={`Transformação ${t.name}`} className="w-full h-full object-cover object-top" loading="lazy" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 60%, rgba(11,11,11,0.7) 100%)" }} />
                </div>
              </div>
              <div className="md:col-span-5">
                <div className="lp-mono text-[10px] tracking-[3px] uppercase lp-accent mb-4">Caso 0{i + 1}</div>
                <h3 className="lp-display lp-text leading-[1] mb-3" style={{ fontSize: "clamp(36px, 4vw, 56px)" }}>
                  {t.name}
                </h3>
                <div className="lp-mono text-[10px] tracking-[2.5px] uppercase lp-muted mb-6">{t.role}</div>
                <div className="h-px w-12 lp-accent-bg mb-6" />
                <p className="lp-display lp-text leading-[1.1] mb-4" style={{ fontSize: "clamp(20px, 2vw, 28px)" }}>
                  {t.result}
                </p>
                <p className="lp-body lp-muted text-[15px] leading-[1.7]">{t.note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
 * SECTION 07 — WHO THIS IS FOR
 * ============================================================ */
const IDENTITIES = [
  { num: "I", title: "Quero voltar a ter controle.", text: "Para quem perdeu a referência do próprio corpo e precisa de um ponto zero confiável." },
  { num: "II", title: "Quero emagrecer sem recomeçar.", text: "Para quem já tentou tudo e quer um caminho que se sustente além das primeiras semanas." },
  { num: "III", title: "Quero performance e longevidade.", text: "Para quem já está em movimento e busca precisão de um sistema de alto nível." },
];

export function LPIdentity() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.15 });
  return (
    <section ref={ref} className="relative py-[120px] md:py-[180px] px-6 md:px-14" style={{ background: "#0B0B0B" }}>
      <div className="max-w-[1280px] mx-auto">
        <div className="lp-mono text-[10px] tracking-[4px] uppercase lp-accent mb-10">06 — Para você</div>
        <h2 className="lp-display lp-text leading-[0.94] tracking-[-0.03em] mb-20 max-w-[900px]" style={{ fontSize: "clamp(40px, 5.5vw, 80px)" }}>
          Em qual<br />ponto <span className="italic font-light lp-muted">você está</span>?
        </h2>
        <div className="grid md:grid-cols-3 gap-px" style={{ background: "rgba(167,167,167,0.08)" }}>
          {IDENTITIES.map((id, i) => (
            <div
              key={id.num}
              className={`p-10 md:p-14 transition-all duration-1000 group hover:bg-[#101010] ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              style={{ background: "#0B0B0B", transitionDelay: `${i * 120}ms`, minHeight: 380 }}
            >
              <div className="lp-display lp-accent leading-none mb-12" style={{ fontSize: "clamp(60px, 6vw, 96px)", fontStyle: "italic", fontWeight: 300 }}>
                {id.num}
              </div>
              <h3 className="lp-display lp-text leading-[1.1] mb-6" style={{ fontSize: "clamp(24px, 2.2vw, 32px)" }}>
                {id.title}
              </h3>
              <p className="lp-body lp-muted text-[15px] leading-[1.7]">{id.text}</p>
              <div className="mt-10 h-px w-12 transition-all duration-500 group-hover:w-24" style={{ background: "rgba(167,167,167,0.3)" }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
 * SECTION 08 — PLANS
 * ============================================================ */
const PLANS = [
  {
    tier: "I",
    name: "Essencial",
    price: "97",
    outcome: "Comece a medir antes de adivinhar.",
    body: "Acesso completo ao sistema. Direção contínua guiada por dados. Para quem quer autonomia com precisão.",
    cta: "Começar Essencial",
    featured: false,
    href: "/auth?plan=essencial",
  },
  {
    tier: "II",
    name: "PRO",
    price: "297",
    outcome: "Direção semanal direta do Baú.",
    body: "Tudo do Essencial mais acompanhamento humano. Ajustes ativos. Resposta priorizada. Para acelerar com método.",
    cta: "Começar PRO",
    featured: true,
    href: "/auth?plan=pro",
  },
  {
    tier: "III",
    name: "Elite",
    price: "697",
    outcome: "Presença direta. Precisão executiva.",
    body: "Acompanhamento 1:1 quinzenal, acesso direto, presencial em Alphaville. Para quem exige o máximo.",
    cta: "Falar com Baú",
    featured: false,
    href: "/auth?plan=elite",
  },
];

export function LPPlans() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });
  return (
    <section ref={ref} id="planos" className="relative py-[120px] md:py-[180px] px-6 md:px-14" style={{ background: "linear-gradient(180deg, #0B0B0B 0%, #0E0E0E 50%, #0B0B0B 100%)" }}>
      <div className="max-w-[1280px] mx-auto">
        <div className="lp-mono text-[10px] tracking-[4px] uppercase lp-accent mb-10">07 — Investimento</div>
        <h2 className="lp-display lp-text leading-[0.94] tracking-[-0.03em] mb-6 max-w-[900px]" style={{ fontSize: "clamp(40px, 5.5vw, 80px)" }}>
          Escolha como<br /><span className="italic font-light lp-muted">quer ser conduzido</span>.
        </h2>
        <p className="lp-body lp-muted text-[16px] leading-[1.7] max-w-[480px] mb-20">
          Três níveis de profundidade. Mesmo sistema. Mesma autoridade. O que muda é a presença.
        </p>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {PLANS.map((p, i) => (
            <a
              key={p.name}
              href={p.href}
              className={`relative block p-10 md:p-12 transition-all duration-700 hover:-translate-y-1 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              } ${p.featured ? "lp-plan-featured" : "lp-plan"}`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              {p.featured && (
                <div className="absolute -top-3 left-10 lp-accent-bg lp-mono text-[9px] tracking-[2.5px] uppercase text-black px-3 py-1">
                  Mais escolhido
                </div>
              )}
              <div className="lp-mono text-[10px] tracking-[3px] uppercase lp-accent mb-4">Nível {p.tier}</div>
              <h3 className="lp-display lp-text leading-none mb-10" style={{ fontSize: "clamp(40px, 4vw, 56px)" }}>
                {p.name}
              </h3>
              <div className="mb-10">
                <div className="flex items-baseline gap-2">
                  <span className="lp-mono text-[10px] tracking-[2px] lp-muted">R$</span>
                  <span className="lp-display lp-text leading-none" style={{ fontSize: "clamp(56px, 5vw, 80px)" }}>
                    {p.price}
                  </span>
                  <span className="lp-mono text-[10px] tracking-[1.5px] lp-muted ml-1">/mês</span>
                </div>
              </div>
              <p className="lp-display lp-text leading-[1.2] mb-6" style={{ fontSize: "20px" }}>
                {p.outcome}
              </p>
              <p className="lp-body lp-muted text-[14px] leading-[1.7] mb-12">{p.body}</p>
              <div className={`lp-mono text-[10px] tracking-[2.5px] uppercase inline-block py-3 border-b ${p.featured ? "lp-accent" : "lp-text"}`} style={{ borderColor: p.featured ? "#FF5A1F" : "#A7A7A7" }}>
                {p.cta} →
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
 * SECTION 09 — FREE DIAGNOSTIC
 * ============================================================ */
export function LPDiagnostic() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.2 });
  return (
    <section ref={ref} className="relative py-[120px] md:py-[180px] px-6 md:px-14 overflow-hidden" style={{ background: "#0B0B0B" }}>
      <div className="max-w-[1280px] mx-auto grid md:grid-cols-12 gap-16 items-center">
        <div className={`md:col-span-6 transition-all duration-1000 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-6"}`}>
          <div className="lp-mono text-[10px] tracking-[4px] uppercase lp-accent mb-8">08 — Diagnóstico</div>
          <h2 className="lp-display lp-text leading-[0.94] tracking-[-0.03em] mb-10" style={{ fontSize: "clamp(40px, 5.5vw, 80px)" }}>
            Descubra se<br />o método é<br /><span className="italic font-light lp-muted">para você</span>.
          </h2>
          <p className="lp-body lp-text text-[17px] leading-[1.7] mb-3">Antes de qualquer plano, você recebe um diagnóstico inicial.</p>
          <p className="lp-body lp-muted text-[15px] leading-[1.7] mb-12">Sem custo. Sem compromisso. Apenas direção.</p>
          <Link to="/quiz" className="lp-btn-primary lp-mono text-[11px] tracking-[2.5px] uppercase">
            Fazer diagnóstico gratuito
          </Link>
        </div>

        <div className={`md:col-span-6 transition-all duration-1000 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-6"}`} style={{ transitionDelay: "0.2s" }}>
          <div
            className="relative p-10"
            style={{
              background: "linear-gradient(160deg, rgba(22,22,22,0.95), rgba(11,11,11,0.9))",
              border: "1px solid rgba(167,167,167,0.12)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 40px 80px -20px rgba(0,0,0,0.6)",
            }}
          >
            <div className="lp-mono text-[9px] tracking-[3px] uppercase lp-muted mb-8">Diagnóstico Renascer™</div>
            <div className="space-y-5">
              {[
                ["Q1", "Como está seu sono nas últimas semanas?"],
                ["Q2", "Quantos dias por semana você se movimenta?"],
                ["Q3", "Qual seu maior travamento atual?"],
                ["Q4", "Onde você quer estar em 90 dias?"],
              ].map(([n, q], i) => (
                <div key={n} className="flex gap-5 items-start pb-5" style={{ borderBottom: i < 3 ? "1px solid rgba(167,167,167,0.08)" : "none" }}>
                  <span className="lp-mono text-[10px] tracking-[2px] lp-accent mt-1">{n}</span>
                  <span className="lp-body lp-text text-[14px] leading-[1.6] flex-1">{q}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-6" style={{ borderTop: "1px solid rgba(167,167,167,0.1)" }}>
              <div className="flex items-center justify-between">
                <span className="lp-mono text-[9px] tracking-[2.5px] uppercase lp-muted">9 perguntas · 60 segundos</span>
                <span className="lp-mono text-[9px] tracking-[2.5px] uppercase lp-accent">100% gratuito</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
 * SECTION 10 — FAQ
 * ============================================================ */
const FAQS = [
  { q: "Em quanto tempo vejo resultado?", a: "Os primeiros sinais aparecem entre 14 e 30 dias — energia, sono e disciplina. A transformação estrutural acontece a partir de 90 dias, com revisão contínua do sistema." },
  { q: "Preciso de academia ou equipamento?", a: "Não. O protocolo se adapta ao seu contexto: academia, casa, hotel. O que importa é a prescrição correta, não o ambiente." },
  { q: "E se eu já tentei de tudo antes?", a: "É exatamente para quem já tentou. O método assume que motivação não basta — e constrói o sistema que faltava." },
  { q: "Como funciona o acompanhamento?", a: "Sistema disponível 24/7 com IA. Acompanhamento humano semanal nos planos PRO e Elite. Calls diretas com Baú no Elite." },
  { q: "Posso cancelar quando quiser?", a: "Sim. Assinatura mensal sem fidelidade. Você fica enquanto fizer sentido." },
];

export function LPFaq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="relative py-[120px] md:py-[180px] px-6 md:px-14" style={{ background: "#0B0B0B" }}>
      <div className="max-w-[900px] mx-auto">
        <div className="lp-mono text-[10px] tracking-[4px] uppercase lp-accent mb-10">09 — Dúvidas</div>
        <h2 className="lp-display lp-text leading-[0.94] tracking-[-0.03em] mb-20" style={{ fontSize: "clamp(40px, 5.5vw, 80px)" }}>
          Perguntas<br /><span className="italic font-light lp-muted">frequentes</span>.
        </h2>
        <div className="space-y-px" style={{ background: "rgba(167,167,167,0.08)" }}>
          {FAQS.map((f, i) => (
            <div key={i} style={{ background: "#0B0B0B" }}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full text-left flex items-center justify-between py-8 md:py-10 group"
              >
                <span className="lp-display lp-text leading-[1.2] pr-6" style={{ fontSize: "clamp(20px, 2vw, 26px)" }}>
                  {f.q}
                </span>
                <span
                  className="lp-mono text-[18px] lp-accent flex-shrink-0 transition-transform duration-500"
                  style={{ transform: open === i ? "rotate(45deg)" : "rotate(0deg)" }}
                >
                  +
                </span>
              </button>
              <div
                className="overflow-hidden transition-all duration-500"
                style={{ maxHeight: open === i ? 240 : 0, opacity: open === i ? 1 : 0 }}
              >
                <p className="lp-body lp-muted text-[15px] md:text-[16px] leading-[1.8] pb-10 max-w-[680px]">{f.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
 * FINAL SECTION — CLOSING MANIFESTO
 * ============================================================ */
export function LPClosing() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.3 });
  return (
    <section ref={ref} className="relative min-h-[100svh] flex items-center px-6 md:px-14 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${gabrielBauPhoto})`,
          backgroundSize: "cover",
          backgroundPosition: "center 20%",
          filter: "grayscale(60%) brightness(0.35)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(11,11,11,0.6) 0%, rgba(11,11,11,0.95) 80%), linear-gradient(180deg, rgba(11,11,11,0.7) 0%, rgba(11,11,11,0.95) 100%)",
        }}
      />
      <div className={`relative z-10 max-w-[1100px] mx-auto w-full transition-all duration-1500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
        <div className="lp-mono text-[10px] tracking-[4px] uppercase lp-accent mb-10">10 — Decisão</div>
        <h2 className="lp-display lp-text leading-[0.9] tracking-[-0.03em] mb-16" style={{ fontSize: "clamp(48px, 7.5vw, 120px)" }}>
          Você pode continuar<br />
          <span className="italic font-light lp-muted">recomeçando</span>.
          <br />
          Ou pode construir<br />
          <span className="lp-accent">um sistema</span>.
        </h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <a href="#planos" className="lp-btn-primary lp-mono text-[11px] tracking-[2.5px] uppercase">
            Começar meu Renascer
          </a>
          <Link to="/quiz" className="lp-btn-ghost lp-mono text-[11px] tracking-[2.5px] uppercase">
            Fazer diagnóstico gratuito
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
 * FOOTER + STICKY MOBILE CTA
 * ============================================================ */
export function LPFooter() {
  return (
    <footer className="px-6 md:px-14 py-16" style={{ background: "#0B0B0B", borderTop: "1px solid rgba(167,167,167,0.08)" }}>
      <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div>
          <div className="lp-mono text-[11px] tracking-[3px] uppercase lp-text mb-3">
            RENASCER<span className="lp-accent">.</span>
          </div>
          <p className="lp-mono text-[9px] tracking-[2px] uppercase lp-muted">Sistema · Direção · Resultado</p>
        </div>
        <div className="flex flex-wrap gap-8 lp-mono text-[9px] tracking-[2px] uppercase lp-muted">
          <a href="#metodo" className="hover:lp-text transition-colors">Método</a>
          <a href="#planos" className="hover:lp-text transition-colors">Planos</a>
          <Link to="/quiz" className="hover:lp-text transition-colors">Diagnóstico</Link>
          <Link to="/auth" className="hover:lp-text transition-colors">Entrar</Link>
        </div>
        <div className="lp-mono text-[9px] tracking-[2px] uppercase lp-muted">
          © {new Date().getFullYear()} Método Renascer
        </div>
      </div>
    </footer>
  );
}

export function LPStickyMobileCTA() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div
      className={`md:hidden fixed bottom-0 left-0 right-0 z-40 transition-transform duration-500 ${show ? "translate-y-0" : "translate-y-full"}`}
      style={{
        background: "rgba(11,11,11,0.92)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(167,167,167,0.1)",
        padding: "14px 20px calc(14px + env(safe-area-inset-bottom))",
      }}
    >
      <a href="#planos" className="lp-btn-primary lp-mono text-[11px] tracking-[2.5px] uppercase block text-center">
        Começar meu diagnóstico
      </a>
    </div>
  );
}
