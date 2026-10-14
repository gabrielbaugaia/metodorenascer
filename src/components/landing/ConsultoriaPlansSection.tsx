import { Link } from "react-router-dom";
import { Check, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CONSULTORIA_PLANS, CONSULTORIA_COMPARISON } from "@/lib/consultoriaPlans";

export function ConsultoriaPlansSection() {
  return (
    <section id="planos" className="consultoria-plans" aria-labelledby="consultoria-plans-title">
      <div className="w">
        <div className="cp-heading">
          <span className="eb">Consultoria online</span>
          <h2 id="consultoria-plans-title" className="serif">Escolha o nível de acompanhamento ideal para você</h2>
          <p>A base é individualizada em todos os planos. O que muda é a profundidade das análises e a proximidade do contato humano com Gabriel.</p>
        </div>
        <div className="cp-grid">
          {CONSULTORIA_PLANS.map((plan) => (
            <article key={plan.slug} className={`cp-plan${"recommended" in plan && plan.recommended ? " cp-recommended" : ""}`} aria-labelledby={`plan-${plan.slug}`}>
              <div className="cp-badge-slot">{"recommended" in plan && plan.recommended && <span className="cp-badge">Mais recomendado</span>}</div>
              <h3 id={`plan-${plan.slug}`} className="cp-name">{plan.name}</h3>
              <p className="cp-price"><span>R$ {plan.price}</span><span className="cp-period">/mês</span></p>
              <p className="cp-intro">{plan.intro}</p>
              <ul className="cp-checklist">
                {plan.features.map((feature) => <li key={feature}><Check aria-hidden="true" /><span>{feature}</span></li>)}
              </ul>
              {plan.slug === "premium" && <p className="cp-limits">Contato assíncrono, conforme a agenda de atendimentos. Sem plantão, resposta imediata ou atendimento 24h. Mensagens fora do expediente são tratadas no próximo período de atendimento.</p>}
              <div className="cp-plan-bottom">
                <Button asChild variant={"recommended" in plan && plan.recommended ? "default" : "outline"} className="cp-cta">
                  <Link to={`/checkout?plano=${plan.slug}`}>{plan.cta}<ArrowUpRight aria-hidden="true" /></Link>
                </Button>
                <p className="cp-payment">{plan.payment}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="cp-comparison">
          <h3>Compare o acompanhamento</h3>
          <table>
            <caption className="sr-only">Comparação dos planos de consultoria online</caption>
            <thead><tr><th scope="col">O que está incluído</th>{CONSULTORIA_PLANS.map((plan) => <th scope="col" key={plan.slug}>{plan.name}</th>)}</tr></thead>
            <tbody>{CONSULTORIA_COMPARISON.map((row) => <tr key={row.feature}><th scope="row">{row.feature}</th>{row.values.map((value, i) => <td key={i}>{value === "Incluído" || value === "Incluída" ? <><Check className="cp-included" aria-hidden="true" /><span className="sr-only">{value}</span></> : value}</td>)}</tr>)}</tbody>
          </table>
          <dl className="cp-footnotes">
            <div><dt>¹ Lista de compras</dt><dd>Disponível quando incluída no protocolo.</dd></div>
            <div><dt>SIS™ e treino</dt><dd>Leitura de recuperação, sem diagnóstico ou previsão clínica. Ajustes conforme prescrição; supervisão de Gabriel no Evolution e Premium.</dd></div>
            <div><dt>² WhatsApp Premium</dt><dd>Dias úteis, horário comercial, conforme agenda. Fora do expediente: próximo período de atendimento. Sem urgências, resposta imediata ou plantão 24h.</dd></div>
          </dl>
        </div>
        <div className="cp-presencial">
          <div><span className="eb">Personal presencial</span><p>Procura acompanhamento presencial? Essa modalidade é tratada separadamente e não está incluída nos planos online.</p></div>
          <Button asChild variant="outline" className="cp-cta cp-presencial-cta"><a href="https://www.instagram.com/baugabriel/" target="_blank" rel="noopener noreferrer">Consultar presencial<ArrowUpRight aria-hidden="true" /></a></Button>
        </div>
      </div>
    </section>
  );
}