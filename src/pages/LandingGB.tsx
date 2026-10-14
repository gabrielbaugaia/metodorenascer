import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import "@/styles/gb-premium.css";
import gabriel from "@/assets/lp-gb/gabriel-bau.jpg";
import ev1 from "@/assets/lp-gb/evolucao-01.jpg";
import ev2 from "@/assets/lp-gb/evolucao-02.jpg";
import ev5 from "@/assets/lp-gb/evolucao-05.jpg";
import ev6 from "@/assets/lp-gb/evolucao-06.jpg";
import { ConsultoriaPlansSection } from "@/components/landing/ConsultoriaPlansSection";
import { Button } from "@/components/ui/button";

const INSTAGRAM = "https://www.instagram.com/baugabriel/";

const FAQ: [string, string][] = [
  ["Como tiro dúvidas com você?", "Pelo próprio app. O canal e a frequência das revisões variam conforme o plano escolhido."],
  ["E se eu tiver dor ou restrição de movimento?", "Você informa na avaliação e o treino é montado respeitando isso. Dor importante ou condição clínica é encaminhada para avaliação profissional antes de prescrever."],
  ["Preciso de academia completa?", "Não. Você informa os equipamentos que tem e o plano é feito para a sua estrutura real."],
  ["Como funciona o cancelamento?", "No Start (cartão recorrente), o cancelamento exige aviso de 30 dias. Evolution e Premium são pagos mês a mês por Pix ou cartão, sem renovação automática: basta não renovar."],
];

export default function LandingGB() {
  const { user } = useAuth();
  const { isAdmin, loading } = useAdminCheck();
  const navigate = useNavigate();
  useEffect(() => { if (user && !loading) navigate(isAdmin ? "/admin" : "/dashboard", { replace: true }); }, [user, isAdmin, loading, navigate]);
  useEffect(() => { document.title = "Gabriel Baú — Consultoria de Treinamento"; }, []);

  return (
    <div className="gbp">
      <header>
        <div className="w">
          <a href="#topo" className="logo">GABRIEL BAÚ</a>
          <nav className="nav">
            <a className="hide" href="#metodo">Método</a>
            <a className="hide" href="#planos">Planos</a>
            <Link className="ghost" to="/auth">Entrar</Link>
          </nav>
        </div>
      </header>

      <section className="hero" id="topo">
        <div className="hero-t">
          <span className="eb">GABRIEL BAÚ | ENGENHARIA DO MOVIMENTO</span>
          <h1 className="serif">Seu treino evolui com os seus <em>resultados.</em></h1>
          <p className="lead">Um método de treinamento individualizado que analisa suas cargas, evolução, recuperação e rotina para ajustar cada etapa do seu progresso. Tecnologia inteligente e acompanhamento profissional para você saber exatamente o que fazer e quando evoluir.</p>
          <div>
            <Button asChild className="btn hero-cta">
              <a href="#metodo" onClick={(event) => {
                const section = document.getElementById("metodo");
                if (!section) return;
                event.preventDefault();
                const headerHeight = document.querySelector(".gbp header")?.getBoundingClientRect().height ?? 64;
                window.history.replaceState(null, "", "#metodo");
                window.scrollTo({
                  top: section.getBoundingClientRect().top + window.scrollY - headerHeight - 16,
                  behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
                });
              }}>Conhecer meu método</a>
            </Button>
          </div>
          <ul className="facts">
            <li>Análise real da sua evolução</li>
            <li>SIS™ — Inteligência aplicada ao treino</li>
            <li>Acompanhamento profissional individualizado</li>
          </ul>
        </div>
        <div className="hero-img"><img src={gabriel} alt="Gabriel Baú" /></div>
      </section>

      <section>
        <div className="w">
          <span className="eb">Posicionamento</span>
          <h2 className="serif">Não é para todo mundo.</h2>
          <div className="two">
            <div>
              <span className="eb">Para quem é</span>
              <ul className="l">
                <li>Quem treina e parou de evoluir</li>
                <li>Quem tem pouco tempo e quer cada sessão valendo</li>
                <li>Quem quer saber exatamente o que fazer</li>
              </ul>
            </div>
            <div>
              <span className="eb">Para quem não é</span>
              <ul className="l no">
                <li>Quem busca resultado sem esforço</li>
                <li>Quem não vai registrar os treinos</li>
                <li>Quem quer um app genérico, sem treinador</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="metodo">
        <div className="w">
          <span className="eb">Método</span>
          <h2 className="serif">Três etapas. Sem atalho.</h2>
          <div className="steps">
            <div><span className="n">01</span><h3>Diagnóstico</h3><p>Histórico, limitações, equipamentos e dias reais disponíveis.</p></div>
            <div><span className="n">02</span><h3>Prescrição</h3><p>Volume por grupo muscular e esforço alvo, no app, com vídeos de execução.</p></div>
            <div><span className="n">03</span><h3>Ajuste</h3><p>Cargas, repetições e recuperação registradas guiam a próxima decisão.</p></div>
          </div>
        </div>
      </section>

      <section>
        <div className="w">
          <span className="eb">Resultados</span>
          <h2 className="serif">Alunos reais.</h2>
          <div className="gal">
            {[ev1, ev2, ev5, ev6].map((s, i) => <img key={i} src={s} alt="Evolução de aluno" loading="lazy" />)}
          </div>
          <p className="note">Resultados variam conforme rotina, aderência e ponto de partida.</p>
        </div>
      </section>

      <ConsultoriaPlansSection />

      <section>
        <div className="w faqg">
          <div><span className="eb">Dúvidas</span><h2 className="serif">Antes de começar.</h2></div>
          <div>{FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div>
        </div>
      </section>

      <footer>
        <div className="w">
          <span>© {new Date().getFullYear()} Gabriel Baú Consultoria</span>
          <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer">Instagram</a>
        </div>
      </footer>
    </div>
  );
}
