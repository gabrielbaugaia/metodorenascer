import { Shield, Flame, Target, Zap, TrendingUp, CheckCircle } from "lucide-react";

// Único link de pagamento do projeto
const CHECKOUT_URL = "https://buy.stripe.com/5kQ7sKbAKcY03wtd0S2B206";

const Index = () => (
  <div className="min-h-screen bg-background text-foreground">

    {/* ── HERO ── */}
    <section className="animate-fade-in-up flex min-h-screen flex-col items-center justify-center px-6 py-20 text-center">
      <div className="w-full max-w-xl">
        <span className="eyebrow mb-6 inline-flex items-center gap-3">
          <span className="inline-block h-px w-8 bg-primary" />
          MÉTODO RENASCER
          <span className="inline-block h-px w-8 bg-primary" />
        </span>

        <h1 className="font-display font-black text-[clamp(2.2rem,6vw,4rem)] leading-[1.05] tracking-tight mb-6">
          O protocolo que{" "}
          <span className="text-primary">destravan</span>{" "}
          o que o esforço sozinho nunca vai resolver.
        </h1>

        <p className="text-muted-foreground text-base leading-relaxed mb-8 max-w-lg mx-auto">
          Treino, nutrição e mentalidade prescritos para o seu perfil.
          Não é um app. Não é um desafio. É um processo.
        </p>

        <a
          href={CHECKOUT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-fire animate-pulse-subtle inline-block w-full sm:w-auto rounded-sm px-12 py-5 text-sm hover:opacity-90 transition-opacity"
        >
          Quero destravar meu resultado agora
        </a>

        <p className="mt-4 text-xs text-muted-foreground">
          R$497 à vista · Acesso imediato · Garantia de 7 dias
        </p>
      </div>
    </section>

    {/* ── O QUE VOCÊ RECEBE ── */}
    <section className="px-6 py-20 border-t border-border">
      <div className="mx-auto max-w-xl">
        <p className="eyebrow mb-10 text-center">O que você recebe</p>
        <div className="flex flex-col gap-5">
          {[
            { icon: Target,     text: "Protocolo de treino prescrito para o seu perfil — não um plano genérico" },
            { icon: TrendingUp, text: "Periodização inteligente que evolui conforme o seu corpo se adapta" },
            { icon: Flame,      text: "Plano alimentar adaptado — sem dieta genérica de planilha" },
            { icon: Zap,        text: "Acompanhamento contínuo — você nunca fica sozinho no processo" },
          ].map(({ icon: Icon, text }, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-border">
                <Icon size={16} strokeWidth={1.5} className="text-primary" />
              </div>
              <p className="text-sm leading-relaxed text-foreground pt-2">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── DEPOIMENTOS ── */}
    <section className="px-6 py-20 border-t border-border bg-card">
      <div className="mx-auto max-w-xl">
        <p className="eyebrow mb-8 text-center">Resultados reais</p>
        <div className="flex flex-col gap-4">
          {[
            "\'Perdi 12kg em 3 meses seguindo o protocolo. Nunca achei que ia funcionar tão rápido.\'",
            "\'Depois de 2 anos estagnado na academia, em 6 semanas voltei a evoluir de verdade.\'",
            "\'A parte da mentalidade foi o que faltava. Agora consigo manter a consistência.\'",
          ].map((quote, i) => (
            <div key={i} className="rounded-sm border border-border p-5">
              <p className="text-sm italic text-muted-foreground leading-relaxed">{quote}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── CTA FINAL ── */}
    <section className="px-6 py-24 text-center border-t border-border">
      <div className="mx-auto max-w-sm">
        <p className="eyebrow mb-6">Única oferta disponível</p>

        <h2 className="font-display font-black text-[clamp(1.8rem,5vw,2.8rem)] leading-tight mb-8">
          Acesso completo ao{" "}
          <span className="text-primary">Método Renascer</span>
        </h2>

        <div className="card-dashboard mb-8 text-left">
          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-4xl font-black text-primary">R$497</span>
            <span className="text-sm text-muted-foreground">à vista</span>
          </div>
          <div className="flex flex-col gap-3">
            {[
              "Prescrição de treino personalizada",
              "Plano nutricional adaptado",
              "Acompanhamento de evolução",
              "Suporte direto com a equipe",
              "Acesso vitalicio ao conteúdo",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-foreground">
                <CheckCircle size={14} strokeWidth={2} className="text-primary shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <a
          href={CHECKOUT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-fire animate-pulse-subtle block w-full rounded-sm px-8 py-5 text-center text-sm hover:opacity-90 transition-opacity mb-4"
        >
          Quero destravar meu resultado agora
        </a>

        <p className="inline-flex items-center justify-center gap-2 text-[0.65rem] text-muted-foreground">
          <Shield size={12} strokeWidth={1.5} className="text-primary" />
          Pagamento seguro · Garantia de 7 dias · Acesso imediato
        </p>
      </div>
    </section>

  </div>
);

export default Index;
