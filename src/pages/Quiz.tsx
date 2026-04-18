import { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import gabrielBauPhoto from "@/assets/gabriel-bau-quiz.jpeg";
import { Check, ChevronRight, Shield, Award, Activity, Brain } from "lucide-react";

const questions = [
  {
    question: "Como foi seu sono nos últimos 7 dias?",
    options: [
      { text: "6h ou menos, acordo quebrado", score: 3 },
      { text: "7-8h, mas acordo várias vezes", score: 2 },
      { text: "7-8h, sono reparador na maioria das vezes", score: 1 },
    ],
  },
  {
    question: "Numa escala de 0 a 10, qual seu nível de stress hoje?",
    options: [
      { text: "8-10: No limite, prestes a explodir", score: 3 },
      { text: "5-7: Controlado, mas muito cansativo", score: 2 },
      { text: "0-4: Tranquilo e gerenciável", score: 1 },
    ],
  },
  {
    question: "Sobre compulsão alimentar, qual frase te representa?",
    options: [
      { text: '"Quando estresso, perco o controle e só vejo depois"', score: 3 },
      { text: '"Às vezes exagero no fds, mas volto na segunda"', score: 2 },
      { text: '"Sou disciplinado, mas sinto que falta resultado proporcional ao esforço"', score: 1 },
    ],
  },
  {
    question: "Qual seu momento atual com treino?",
    options: [
      { text: "Perdido, sem treinar ou sem resultado.", score: 3 },
      { text: "Treino, mas sinto que falta avaliação técnica de verdade.", score: 2 },
      { text: "Tenho personal/nutri, mas quero uma 2ª opinião.", score: 1 },
    ],
  },
];

const CHECKOUT_URL =
  "https://buy.stripe.com/5kQ7sKbAKcY03wtd0S2B206?utm_source=quiz&utm_medium=funil";

const Quiz = () => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    document.title = "Diagnóstico Renascer | Descubra seu risco de Burnout";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        "content",
        "Diagnóstico em 60s do Método Renascer: descubra seu risco de Burnout, Compulsão Alimentar e Queda de Motivação com base em sono, stress e comportamento."
      );
    }
  }, []);

  const goTo = useCallback((s: number) => {
    setAnimKey((k) => k + 1);
    setStep(s);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleAnswer = (score: number) => {
    const next = [...answers, score];
    setAnswers(next);
    if (next.length < 4) {
      goTo(step + 1);
    } else {
      goTo(5);
    }
  };

  const riskScore = Math.round((answers.reduce((a, b) => a + b, 0) / 12) * 100);
  const riskColor =
    riskScore >= 70 ? "hsl(0 84% 60%)" : riskScore >= 40 ? "hsl(40 90% 55%)" : "hsl(142 70% 45%)";

  return (
    <div className="quiz-renascer min-h-screen bg-background text-foreground relative">
      {/* Botão Entrar — fixo, oculto no Step 9 */}
      {step !== 9 && (
        <Link
          to="/auth"
          className="fixed top-4 right-4 z-50 inline-flex items-center gap-2 border border-border bg-card/80 backdrop-blur px-4 py-2 text-[0.65rem] uppercase tracking-[0.25em] font-medium text-foreground hover:border-primary hover:text-primary transition-colors rounded-sm"
        >
          Entrar
        </Link>
      )}

      {/* Step 0 — Hero */}
      {step === 0 && (
        <section
          key={animKey}
          className="animate-fade-in-up flex min-h-screen flex-col items-center justify-center px-6 text-center"
        >
          <span className="eyebrow mb-4 inline-flex items-center gap-2">
            <span className="inline-block h-px w-6 bg-primary" />
            DIAGNÓSTICO RENASCER
          </span>
          <h1 className="font-serif-display text-[clamp(2.2rem,6vw,4rem)] font-light leading-[0.95] tracking-tight mb-6">
            Descubra seu risco de<br />
            <em className="text-primary font-light italic">Burnout, Compulsão</em><br />
            e Queda de Motivação.
          </h1>
          <p className="max-w-md text-muted-foreground text-sm leading-relaxed mb-10">
            Burnout, compulsão alimentar e queda de motivação têm uma causa fisiológica rastreável. O sistema SIS monitora seus dados de sono, stress e comportamento todo dia, para que eu identifique o que está quebrando seu equilíbrio e prescreva o protocolo exato para reverter isso.
          </p>
          <button
            onClick={() => goTo(1)}
            className="animate-pulse-subtle bg-primary text-primary-foreground px-8 py-4 text-xs uppercase tracking-[0.25em] font-bold rounded-sm hover:opacity-90 transition-opacity"
          >
            Fazer diagnóstico em 60s [grátis]
          </button>
          <p className="mt-4 text-[0.7rem] text-muted-foreground">
            Analiso apenas 20 novos alunos por semana. <span className="text-primary font-medium">7 vagas restantes.</span>
          </p>
        </section>
      )}

      {/* Steps 1–4 — Quiz */}
      {step >= 1 && step <= 4 && (
        <section
          key={animKey}
          className="animate-fade-in-up flex min-h-screen flex-col items-center justify-center px-6"
        >
          <div className="w-full max-w-md">
            <div className="mb-2 flex items-center justify-between text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground">
              <span>Diagnóstico Renascer</span>
              <span>{step} de 4</span>
            </div>
            <div className="mb-10 h-px w-full bg-border relative">
              <div
                className="absolute left-0 top-0 h-full bg-primary transition-all duration-500"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>

            <h2 className="font-serif-display text-[clamp(1.4rem,4vw,2rem)] font-light leading-tight mb-8">
              {questions[step - 1].question}
            </h2>

            <div className="flex flex-col gap-3">
              {questions[step - 1].options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(opt.score)}
                  className="group w-full border border-border bg-card text-left px-5 py-4 rounded-sm text-sm text-foreground hover:border-primary hover:bg-secondary transition-all duration-300"
                >
                  {opt.text}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Step 5 — Resultado */}
      {step === 5 && (
        <section
          key={animKey}
          className="animate-fade-in-up flex min-h-screen flex-col items-center justify-center px-6 text-center"
        >
          <div className="w-full max-w-md">
            <span className="eyebrow mb-6 inline-flex items-center gap-2">
              <span className="inline-block h-px w-6 bg-primary" />
              PRÉ-LAUDO CONCLUÍDO
            </span>

            <h2 className="font-serif-display text-[clamp(1.6rem,5vw,2.8rem)] font-light leading-tight mb-2">
              Seu Risco de Burnout e Autossabotagem:
            </h2>
            <p
              className="text-[clamp(2.5rem,8vw,4.5rem)] font-black mb-4"
              style={{ color: riskColor }}
            >
              {riskScore}%
            </p>

            <div className="h-1.5 w-full bg-border rounded-sm mb-8 overflow-hidden">
              <div
                className="h-full rounded-sm transition-all duration-700"
                style={{ width: `${riskScore}%`, backgroundColor: riskColor }}
              />
            </div>

            <div className="border border-border bg-card p-6 rounded-sm mb-8 text-left">
              <p className="font-serif-display text-lg font-light mb-2">Isso é apenas a ponta do iceberg.</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                No diagnóstico completo eu analiso seus marcadores fisiológicos de stress, sono, composição corporal e comportamento alimentar — tudo integrado. É esse cruzamento de dados que define o seu protocolo real.
              </p>
            </div>

            <button
              onClick={() => goTo(6)}
              className="animate-pulse-subtle bg-primary text-primary-foreground w-full px-8 py-4 text-xs uppercase tracking-[0.25em] font-bold rounded-sm hover:opacity-90 transition-opacity"
            >
              Quero análise completa
            </button>
          </div>
        </section>
      )}

      {/* Step 6 — Mentor */}
      {step === 6 && (
        <section
          key={animKey}
          className="animate-fade-in-up flex min-h-screen flex-col items-center justify-center px-6"
        >
          <div className="w-full max-w-lg">
            <span className="eyebrow mb-6 inline-flex items-center gap-2">
              <span className="inline-block h-px w-6 bg-primary" />
              QUEM VAI ANALISAR SEUS DADOS
            </span>

            <img
              src={gabrielBauPhoto}
              alt="Gabriel Baú — Especialista em Treinamento"
              className="w-32 h-40 rounded-sm border border-border mb-6 object-cover object-top"
            />

            <h2 className="font-serif-display text-[clamp(1.6rem,4.5vw,2.4rem)] font-light leading-tight mb-4">
              Gabriel <em className="text-primary italic">Baú</em>
            </h2>

            <p className="text-sm text-muted-foreground leading-relaxed mb-8">
              O sistema me dá os dados, mas são os meus 15 anos de trincheira que transformam isso em decisão clínica. Eu assino cada prescrição. Não sou influencer, sou especialista.
            </p>

            <div className="flex flex-col gap-3 mb-10">
              {[
                { icon: Award, text: "Mestrado em Exercício Físico" },
                { icon: Activity, text: "Especialista em Treinamento Desportivo e Reabilitação" },
                { icon: Brain, text: "+4.800 protocolos individuais prescritos" },
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-foreground">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-border rounded-sm">
                    <Icon size={16} strokeWidth={1.5} className="text-primary" />
                  </div>
                  {text}
                </div>
              ))}
            </div>

            <button
              onClick={() => goTo(7)}
              className="bg-primary text-primary-foreground w-full px-8 py-4 text-xs uppercase tracking-[0.25em] font-bold rounded-sm hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-2"
            >
              Avançar e ver o método <ChevronRight size={16} strokeWidth={1.5} />
            </button>
          </div>
        </section>
      )}

      {/* Step 7 — Método */}
      {step === 7 && (
        <section
          key={animKey}
          className="animate-fade-in-up flex min-h-screen flex-col items-center justify-center px-6"
        >
          <div className="w-full max-w-lg">
            <span className="eyebrow mb-6 inline-flex items-center gap-2">
              <span className="inline-block h-px w-6 bg-primary" />
              O MÉTODO
            </span>

            <h2 className="font-serif-display text-[clamp(1.8rem,5vw,3rem)] font-light leading-[0.95] mb-3">
              O fim da <em className="text-primary italic">tentativa e erro.</em>
            </h2>

            <div className="border border-border bg-card p-6 rounded-sm mb-8">
              <p className="text-primary text-xs uppercase tracking-[0.3em] font-medium mb-3">
                Bem-vindo ao Método Renascer
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Um método que integra Engenharia do Movimento, SIS e Behavior — sistemas que mapeiam suas variáveis diariamente para que seu progresso seja eficiente e ultra personalizado. Se algo muda no seu corpo ou rotina, sou notificado e já ajusto o protocolo.
              </p>
            </div>

            <button
              onClick={() => goTo(8)}
              className="bg-primary text-primary-foreground w-full px-8 py-4 text-xs uppercase tracking-[0.25em] font-bold rounded-sm hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-2"
            >
              Ver o que o sistema mostra <ChevronRight size={16} strokeWidth={1.5} />
            </button>
          </div>
        </section>
      )}

      {/* Step 8 — Sistema */}
      {step === 8 && (
        <section
          key={animKey}
          className="animate-fade-in-up flex min-h-screen flex-col items-center justify-center px-6"
        >
          <div className="w-full max-w-lg">
            <span className="eyebrow mb-6 inline-flex items-center gap-2">
              <span className="inline-block h-px w-6 bg-primary" />
              PROVA + COMPLIANCE
            </span>

            <h2 className="font-serif-display text-[clamp(1.6rem,4.5vw,2.4rem)] font-light leading-tight mb-3">
              Seu corpo é o seu <em className="text-primary italic">principal ativo.</em>
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-8">
              Para empreendedores e executivos, disciplina física é performance nos negócios. O Método Renascer garante que você não quebre no meio do caminho.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
              <div className="border border-border bg-card p-6 rounded-sm">
                <p className="text-primary text-xs uppercase tracking-[0.3em] font-medium mb-3">O que você vê</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Um aplicativo simples onde você lança como dormiu e como está se sentindo em menos de 1 minuto por dia.
                </p>
              </div>
              <div className="border border-primary/30 bg-card p-6 rounded-sm">
                <p className="text-primary text-xs uppercase tracking-[0.3em] font-medium mb-3">O que eu vejo</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Um dashboard clínico completo me alertando exatamente quando devemos acelerar os resultados ou focar na recuperação.
                </p>
              </div>
            </div>

            <button
              onClick={() => goTo(9)}
              className="bg-primary text-primary-foreground w-full px-8 py-4 text-xs uppercase tracking-[0.25em] font-bold rounded-sm hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-2"
            >
              Ver a proposta completa <ChevronRight size={16} strokeWidth={1.5} />
            </button>
          </div>
        </section>
      )}

      {/* Step 9 — Oferta */}
      {step === 9 && (
        <section
          key={animKey}
          className="animate-fade-in-up flex min-h-screen flex-col items-center justify-center px-6"
        >
          <div className="w-full max-w-lg">
            <span className="eyebrow mb-6 inline-flex items-center gap-2">
              <span className="inline-block h-px w-6 bg-primary" />
              FECHAMENTO
            </span>

            <h2 className="font-serif-display text-[clamp(1.8rem,5vw,3rem)] font-light leading-[0.95] mb-6">
              Diagnóstico 360º + <em className="text-primary italic">Protocolo</em>
            </h2>

            <div className="border border-border bg-card p-6 rounded-sm mb-8">
              <p className="text-primary text-xs uppercase tracking-[0.3em] font-medium mb-4">
                O que você vai receber agora:
              </p>
              <div className="flex flex-col gap-3">
                {[
                  "Análise clínica de Burnout, Compulsão e Motivação",
                  "Acesso ao Sistema SIS por 90 dias",
                  "Plano nutricional ajustado ao seu SIS Score",
                  "Protocolo de treino 100% prescrito e assinado por mim",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm text-foreground">
                    <Check size={16} strokeWidth={1.5} className="text-primary mt-0.5 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center mb-8">
              <p className="text-muted-foreground text-sm line-through mb-1">De R$ 1.997</p>
              <p className="font-serif-display text-[clamp(1.4rem,4vw,2rem)] font-light">
                12x de <span className="text-primary font-semibold">R$ 49,70</span>
              </p>
              <p className="text-muted-foreground text-xs mt-1">ou R$ 497 à vista</p>
            </div>

            <a
              href={CHECKOUT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="animate-pulse-subtle block w-full bg-primary text-primary-foreground text-center px-8 py-4 text-xs uppercase tracking-[0.25em] font-bold rounded-sm hover:opacity-90 transition-opacity"
            >
              Garantir minha vaga agora
            </a>

            <p className="mt-4 text-center text-[0.7rem] text-muted-foreground inline-flex items-center justify-center gap-2 w-full">
              <Shield size={14} strokeWidth={1.5} className="text-primary" />
              7 de 20 vagas disponíveis. Compra 100% Segura.
            </p>

            <div className="mt-10 text-center">
              <Link
                to="/auth"
                className="text-[0.65rem] uppercase tracking-[0.25em] text-muted-foreground hover:text-primary transition-colors"
              >
                Já sou aluno → Entrar
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Quiz;
