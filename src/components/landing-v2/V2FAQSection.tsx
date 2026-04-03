import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const faqs = [
  { q: "Preciso de wearable para usar?", a: "Não é obrigatório — você pode usar apenas o check-in manual. Mas com um Apple Watch ou Garmin, a precisão do sistema aumenta consideravelmente pois os dados de VFC e FC automatizam boa parte da análise." },
  { q: "Em quanto tempo vejo resultado?", a: "O sistema começa a funcionar no primeiro dia. Padrões claros surgem entre a 2ª e 3ª semana. Transformações físicas mensuráveis acontecem no ciclo de 90 dias — com dados e fotos comparativas documentando cada mudança." },
  { q: "O que diferencia do treino online comum?", a: "Treino online prescreve o mesmo protocolo para todos. O Renascer prescreve com base nos seus dados daquele dia — VFC, sono, estresse, estado mental. São prescrições completamente diferentes para a mesma pessoa em dias distintos." },
  { q: "Posso cancelar a qualquer momento?", a: "Sim. Os planos são mensais e você cancela quando quiser, sem multa. Apenas pedimos 7 dias de aviso para organizar o encerramento do ciclo de forma adequada para você." },
  { q: "O sistema funciona para reabilitação?", a: "Sim — e é um dos diferenciais do método. Baú tem mestrado em patologias ortopédicas com foco em joelho, coluna e quadril. O sistema integra dados fisiológicos com protocolo de reabilitação personalizado." },
  { q: "Qual o plano certo para mim?", a: "Faça o diagnóstico inicial gratuito. Com base no seu perfil, histórico e objetivos, indicamos o plano com melhor custo-benefício para o seu momento. Sem pressão de venda — apenas dados e honestidade." },
];

export function V2FAQSection() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <section id="v2-faq" ref={ref} className="py-[110px] px-7 md:px-[60px] bg-card/50">
      <div className={`transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-7"}`}>
        <div className="flex items-center gap-3.5 font-mono-v2 text-[10px] tracking-[4px] uppercase text-primary mb-[18px]">
          07 — Dúvidas
          <span className="w-10 h-[1px] bg-primary" />
        </div>
        <h2 className="font-display-v2 text-[clamp(44px,5.5vw,72px)] tracking-[2px] leading-[.96] text-foreground mb-5">
          PERGUNTAS<br />FREQUENTES
        </h2>
        <p className="font-body-v2 text-[16px] text-muted-foreground font-light max-w-[580px] leading-[1.8] mb-16">
          Transparência total sobre o método e o que esperar.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-[2px] max-w-[900px] mx-auto">
        {faqs.map((f) => (
          <div key={f.q} className="bg-card border border-border p-7 hover:border-primary transition-colors">
            <div className="font-display-v2 text-[18px] tracking-[1px] text-foreground mb-2.5 flex justify-between items-start gap-3">
              {f.q}
              <span className="text-primary text-[22px] flex-shrink-0">+</span>
            </div>
            <p className="font-body-v2 text-[13px] text-muted-foreground leading-[1.7]">{f.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
