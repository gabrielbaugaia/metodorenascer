import { useEffect, useRef, useState, KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import "@/styles/gbs-landing.css";
import marca from "@/assets/lp-gb/marca-gb.jpg";
import treinoCliente from "@/assets/lp-gb/treino-cliente.jpg";
import conversa from "@/assets/lp-gb/conversa-treino.jpg";
import encontro from "@/assets/lp-gb/encontro-academia.jpg";
import gabriel from "@/assets/lp-gb/gabriel-bau.jpg";
import ev1 from "@/assets/lp-gb/evolucao-01.jpg";
import ev2 from "@/assets/lp-gb/evolucao-02.jpg";
import ev3 from "@/assets/lp-gb/evolucao-03.jpg";
import ev4 from "@/assets/lp-gb/evolucao-04.jpg";
import ev5 from "@/assets/lp-gb/evolucao-05.jpg";
import ev6 from "@/assets/lp-gb/evolucao-06.jpg";

const INSTAGRAM = "https://www.instagram.com/baugabriel/";

const RESULTS = [
  { src: ev1, w: 1440, h: 1351, caption: "Antes e depois" },
  { src: ev2, w: 608, h: 543, caption: "Antes e depois" },
  { src: ev3, w: 741, h: 429, caption: "Antes e depois" },
  { src: ev4, w: 609, h: 318, caption: "Etapas da evolução" },
  { src: ev5, w: 1290, h: 782, caption: "Antes e depois" },
  { src: ev6, w: 992, h: 864, caption: "Antes e depois" },
];

const GOALS: Record<string, string> = {
  Emagrecimento: "Vamos entender sua rotina e como organizar o treino para esse objetivo.",
  Hipertrofia: "Vamos entender sua experiência e as prioridades para o seu planejamento.",
  Performance: "Vamos conhecer os desafios e as capacidades que você quer desenvolver.",
  "Retomar a rotina": "Vamos encontrar uma frequência possível e construir consistência.",
};

const FEATURES = {
  treino: { label: "Treino", k: "EXECUÇÃO COM CLAREZA", t: "Saiba o que fazer quando chegar para treinar.", p: "Consulte o ciclo de treino, veja os vídeos dos exercícios e tenha séries, repetições e intervalos à mão. Registre cargas e anotações para dar continuidade ao processo.", l: ["Vídeos para consultar a execução", "Séries, repetições e intervalos", "Cargas e anotações do treino", "Plano disponível também em PDF"] },
  nutricao: { label: "Nutrição", k: "ORGANIZAÇÃO DA ALIMENTAÇÃO", t: "Leve o planejamento para a sua rotina.", p: "A área nutricional reúne refeições, metas e opções de substituição. O diário permite registrar a alimentação e consultar os totais do dia. Os serviços incluídos são definidos na contratação.", l: ["Plano alimentar e macronutrientes", "Refeições e opções de substituição", "Diário nutricional", "Lista de compras e PDF"] },
  evolucao: { label: "Evolução", k: "HISTÓRICO, NÃO ACHISMO", t: "Enxergue o caminho que você está construindo.", p: "Compare fotos no mesmo ângulo e acompanhe o histórico de peso e check-ins. Suas observações ajudam a contextualizar o período e a leitura da evolução.", l: ["Fotos de frente, lado e costas", "Comparação entre períodos", "Peso e histórico de check-ins", "Observações e leitura da evolução"] },
  rotina: { label: "Rotina", k: "CONSISTÊNCIA NA PRÁTICA", t: "Saiba qual é o próximo passo.", p: "O painel Hoje organiza a prioridade do dia e o progresso da semana. Aeróbico, receitas, vídeos e mindset complementam a experiência na plataforma.", l: ["Painel com foco do dia", "Visão de consistência semanal", "Registro de sessões aeróbicas", "Receitas, vídeos e mindset"] },
} as const;
type FeatureKey = keyof typeof FEATURES;
const FEATURE_KEYS = Object.keys(FEATURES) as FeatureKey[];

const FAQ: [string, string][] = [
  ["Preciso ter experiência com musculação?", "O ponto de partida faz parte da avaliação. Informe seu nível de experiência e suas dificuldades para que o planejamento considere o que você precisa aprender e desenvolver."],
  ["Preciso treinar em uma academia específica?", "A proposta da consultoria é acompanhar você online. Informe onde treina e quais equipamentos tem disponíveis para avaliar a viabilidade do plano para sua estrutura."],
  ["Como funcionam os feedbacks e os ajustes?", "Você registra sua rotina e envia check-ins e evolução pelo aplicativo. A área de evolução permite consultar fotos, peso, observações e a leitura do período. A frequência das revisões e o canal de suporte são alinhados conforme o plano escolhido."],
  ["O que encontro na área de nutrição?", "O aplicativo dispõe de plano alimentar, metas de macronutrientes, refeições e substituições, além de diário nutricional e lista de compras. A disponibilidade e a responsabilidade pelo serviço nutricional devem ser alinhadas na contratação."],
  ["Como acompanho minha evolução?", "Na área Evolução, você consulta registros de peso, fotos comparativas e histórico de check-ins. O aplicativo também reúne os registros da rotina para mostrar sua consistência ao longo do período. O calendário de envios e revisões depende do seu acompanhamento."],
  ["Existem conteúdos de apoio?", "Sim. A área do aluno possui seções de receitas, vídeos e mindset, além dos módulos de treino, nutrição, evolução e aeróbico."],
  ["Qual é o valor da consultoria?", "Converse com Gabriel para conhecer as modalidades, os valores e o que está incluído em cada plano. Assim, você escolhe sabendo exatamente como será o acompanhamento."],
  ["Já sou aluno. Como acesso meu treino?", "Use o botão Entrar, no topo da página, com os dados do seu cadastro."],
];

export default function LandingGB() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [goal, setGoal] = useState("Emagrecimento");
  const [notice, setNotice] = useState("A mensagem não é enviada automaticamente. Cole no direct de @baugabriel para conversar sobre planos e condições.");
  const [feature, setFeature] = useState<FeatureKey>("treino");
  const [photo, setPhoto] = useState<{ src: string; caption: string } | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.title = "Gabriel Baú — Consultoria Online";
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape" && menuOpen) { setMenuOpen(false); menuBtnRef.current?.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (photo && !d.open) { d.showModal(); document.body.style.overflow = "hidden"; }
  }, [photo]);

  const openPhoto = (el: HTMLElement, src: string, caption: string) => { triggerRef.current = el; setPhoto({ src, caption }); };
  const onDialogClose = () => { document.body.style.overflow = ""; setPhoto(null); triggerRef.current?.focus(); };

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const n = FEATURE_KEYS.length; let next: number;
    if (e.key === "ArrowRight") next = (i + 1) % n;
    else if (e.key === "ArrowLeft") next = (i + n - 1) % n;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = n - 1;
    else return;
    e.preventDefault(); setFeature(FEATURE_KEYS[next]); tabRefs.current[next]?.focus();
  };

  const contact = async () => {
    const msg = `Olá, Gabriel! Conheci sua consultoria online e quero saber mais. Meu objetivo principal é ${goal.toLowerCase()}. Como funciona o acompanhamento e quais são os planos?`;
    const tab = window.open(INSTAGRAM, "_blank");
    if (tab) tab.opener = null;
    try { await navigator.clipboard.writeText(msg); setNotice("Mensagem copiada! Cole no direct de @baugabriel. Se o Instagram não abriu, use o link no rodapé."); }
    catch { setNotice("Copie esta mensagem e envie pelo Instagram: " + msg); }
  };

  const f = FEATURES[feature];
  const navLinks = [["#metodo", "O método"], ["#acompanhamento", "A consultoria"], ["#resultados", "Resultados"], ["#duvidas", "Dúvidas"]];

  return (
    <div className="gbs">
      <header>
        <a className="brand brand-with-mark" href="#topo" aria-label="Gabriel Baú início">
          <img src={marca} width={717} height={406} alt="" />
          <span>GABRIEL BAÚ<small>ENGENHARIA DO MOVIMENTO</small></span>
        </a>
        <nav className="nav" aria-label="Menu principal">
          <span className="nav-links">{navLinks.map(([h, l]) => <a key={h} href={h}>{l}</a>)}</span>
          <button ref={menuBtnRef} type="button" className="mobile-menu-btn" aria-expanded={menuOpen} aria-controls="gbs-mobile-nav" aria-label="Abrir menu de navegação" onClick={() => setMenuOpen((o) => !o)}>Menu <span aria-hidden="true" style={{ marginLeft: 8 }}>☰</span></button>
          <Link className="login" to="/auth">Entrar</Link>
        </nav>
        {menuOpen && (
          <nav id="gbs-mobile-nav" className="mobile-nav" aria-label="Menu para celular e tablet">
            {[...navLinks.slice(0, 2), ["#por-dentro", "Por dentro do app"], ...navLinks.slice(2), ["#comecar", "Quero começar ↗"]].map(([h, l]) => (
              <a key={h} href={h} onClick={() => setMenuOpen(false)}>{l}</a>
            ))}
          </nav>
        )}
      </header>

      <main id="topo">
        <section className="wrap hero">
          <div>
            <div className="eyebrow">Consultoria online · Gabriel Baú</div>
            <h1>Seu treino precisa<br />fazer sentido<br /><em>para você.</em></h1>
            <p className="intro">Eu sou Gabriel Baú. Na minha consultoria online, seu objetivo e sua rotina são o ponto de partida. Você recebe o planejamento pelo aplicativo e acompanha sua evolução com registros, fotos e check-ins.</p>
            <a className="btn" href="#comecar">Quero conhecer a consultoria <span>↗</span></a>
            <div className="micro">Converse comigo sobre o seu momento e o que você quer mudar.</div>
          </div>
          <figure className="hero-photo">
            <img src={treinoCliente} width={1024} height={1536} alt="Gabriel Baú acompanhando uma cliente durante a remada na academia" />
            <figcaption>Gabriel Baú · Acompanhamento de perto, no treino.</figcaption>
          </figure>
        </section>

        <section className="light" id="metodo">
          <div className="wrap">
            <div className="section-head">
              <div><div className="eyebrow">Como vamos trabalhar</div><h2>Primeiro, eu preciso<br />entender você.</h2></div>
              <p>Como você treina hoje? Quanto tempo tem? O que está difícil de manter? Essas respostas ajudam a construir um plano que caiba na sua vida.</p>
            </div>
            <div className="method">
              <article><span className="num">CONHECER</span><h3>Antes do treino, você.</h3><p>A anamnese reúne seu ponto de partida. Objetivo, experiência, rotina e dias disponíveis ajudam a orientar o planejamento.</p></article>
              <article><span className="num">PLANEJAR</span><h3>Um plano possível.</h3><p>Seu ciclo de treino fica organizado no aplicativo, com exercícios, séries, repetições, intervalos e vídeos para consulta.</p></article>
              <article><span className="num">ACOMPANHAR</span><h3>Evolução acompanhada.</h3><p>Check-ins, fotos, peso e registros de rotina mostram o que você está conseguindo executar. Esse histórico dá contexto à leitura da sua evolução.</p></article>
            </div>
          </div>
        </section>

        <section className="wrap online" id="acompanhamento">
          <figure className="coaching-photo">
            <img src={conversa} width={1290} height={2241} alt="Gabriel Baú conversando com uma cliente entre os exercícios" loading="lazy" decoding="async" />
            <figcaption>Ouvir também faz parte do acompanhamento.</figcaption>
          </figure>
          <div>
            <div className="eyebrow">Na prática</div>
            <h2>Você treina daí.<br />Eu acompanho daqui.</h2>
            <ul className="features">
              <li>Treino com vídeos, séries, repetições e intervalos</li>
              <li>Consulta e registro de cargas e anotações</li>
              <li>Check-ins e histórico de consistência</li>
              <li>Fotos comparativas, peso e leitura da evolução</li>
            </ul>
            <a className="link" href="#comecar">Encontrar meu ponto de partida ↗</a>
          </div>
        </section>

        <section className="results-section" id="resultados">
          <div className="wrap">
            <div className="section-head">
              <div><div className="eyebrow">Antes e depois</div><h2>Cada pessoa tem<br />a sua história.</h2></div>
              <p>Alguns registros de evolução de alunos. Por trás das fotos, existe uma rotina construída ao longo do tempo.</p>
            </div>
            <div className="results-grid">
              {RESULTS.map((r, i) => (
                <figure className="result-frame" key={i}>
                  <button type="button" className="result-image" aria-label={`Ampliar comparativo ${i + 1}`} onClick={(e) => openPhoto(e.currentTarget, r.src, r.caption)}>
                    <img src={r.src} width={r.w} height={r.h} alt={`Comparativo de evolução ${i + 1} fornecido por Gabriel Baú`} loading="lazy" decoding="async" />
                  </button>
                  <figcaption><span>{r.caption}</span><button type="button" className="enlarge" aria-label={`Ampliar comparativo ${i + 1}`} onClick={(e) => openPhoto(e.currentTarget, r.src, r.caption)}>Ampliar ↗</button></figcaption>
                </figure>
              ))}
            </div>
            <p className="results-note">Resultados individuais. O tempo e a evolução variam conforme o ponto de partida, a rotina e a adesão de cada pessoa.</p>
            <a className="link" href="#comecar">Quero conversar sobre meu objetivo</a>
          </div>
        </section>

        <section className="light" id="por-dentro">
          <div className="wrap">
            <div className="section-head">
              <div><div className="eyebrow">Por dentro da consultoria</div><h2>Um plano para seguir.<br />Um lugar para acompanhar.</h2></div>
              <p>Conheça os recursos da área do aluno. O escopo do acompanhamento e os serviços incluídos são alinhados na contratação.</p>
            </div>
            <div className="product-tabs" role="tablist" aria-label="Recursos do aplicativo">
              {FEATURE_KEYS.map((k, i) => (
                <button key={k} ref={(el) => (tabRefs.current[i] = el)} role="tab" id={`tab-${k}`} aria-controls="feature-panel" aria-selected={feature === k} tabIndex={feature === k ? 0 : -1} onClick={() => setFeature(k)} onKeyDown={(e) => onTabKey(e, i)}>{FEATURES[k].label}</button>
              ))}
            </div>
            <div className="feature-panel" id="feature-panel" role="tabpanel" aria-labelledby={`tab-${feature}`} tabIndex={0}>
              <div><span className="num">{f.k}</span><h3>{f.t}</h3><p>{f.p}</p></div>
              <ul>{f.l.map((t) => <li key={t}>{t}</li>)}</ul>
            </div>
          </div>
        </section>

        <section className="wrap journey">
          <div className="section-head">
            <div><div className="eyebrow">O acompanhamento na prática</div><h2>A evolução aparece<br />no que você registra.</h2></div>
            <p style={{ color: "#aeb5a4" }}>Cada informação ajuda a entender a relação entre o plano, a execução e a resposta do seu corpo.</p>
          </div>
          <div className="journey-grid">
            <article><span className="num">NO DIA A DIA</span><h3>Uma prioridade por vez.</h3><p>O painel Hoje organiza o foco do dia. Treino, aeróbico, alimentação e check-ins compõem a visão da sua rotina.</p></article>
            <article><span className="num">AO LONGO DA SEMANA</span><h3>Consistência visível.</h3><p>Veja treinos concluídos e registros da semana. O check-in semanal reúne peso e percepção geral do período.</p></article>
            <article><span className="num">AO LONGO DOS CICLOS</span><h3>Compare com contexto.</h3><p>Fotos de frente, lado e costas, peso e observações formam seu histórico. Compare períodos e consulte a leitura da evolução.</p></article>
          </div>
        </section>

        <section className="wrap real-life">
          <div className="real-life-copy">
            <div className="eyebrow">Fora da tela</div>
            <h2>Treino também<br />é gente.</h2>
            <p>Entre uma série e outra, tem conversa, dúvida e conquista. É dessa convivência com os alunos que vem o cuidado com cada planejamento.</p>
            <p className="photo-context">Registros do trabalho e do dia a dia de Gabriel na academia.</p>
          </div>
          <figure><img src={encontro} width={1152} height={1536} alt="Gabriel Baú ao lado de um cliente na academia" loading="lazy" decoding="async" /></figure>
        </section>

        <section className="wrap profile" id="gabriel">
          <div className="trainer-story">
            <figure><img src={gabriel} width={1024} height={1536} alt="Retrato profissional de Gabriel Baú" loading="lazy" decoding="async" /></figure>
            <div className="trainer-copy">
              <div className="eyebrow">Seu treinador</div>
              <h2>Prazer,<br />Gabriel Baú.</h2>
              <p>Gosto de entender quem está do outro lado do treino. O que você quer mudar, o que já tentou e o que acontece quando a rotina aperta.</p>
              <p>Na consultoria, o aplicativo organiza nosso trabalho: você consulta o plano, registra o que fez e conta como está se sentindo. Essas informações ajudam a acompanhar seu caminho.</p>
              <p>Você não precisa chegar com tudo resolvido. Precisa estar disposto a começar e a participar do processo.</p>
              <a className="link" href="#comecar">Vamos conversar sobre seu treino</a>
              <div className="signature">Gabriel Baú<span>Engenharia do Movimento</span></div>
            </div>
          </div>
        </section>

        <section className="apply" id="comecar">
          <div className="wrap apply-grid">
            <div>
              <div className="eyebrow" style={{ color: "#8a7258" }}>Vamos conversar</div>
              <h2>Qual é o seu<br />próximo objetivo?</h2>
              <p>Selecione sua prioridade e leve esse ponto de partida para uma conversa sobre a consultoria.</p>
            </div>
            <div>
              <label>Hoje, eu quero focar em:</label>
              <div className="choices">
                {Object.keys(GOALS).map((g) => (
                  <button key={g} type="button" className="choice" aria-pressed={goal === g} onClick={() => setGoal(g)}>{g} ↗</button>
                ))}
              </div>
              <p className="result" aria-live="polite">Seu ponto de partida: {goal.toLowerCase()}. {GOALS[goal]}</p>
              <button type="button" className="btn" onClick={contact}>Copiar mensagem e abrir Instagram <span>↗</span></button>
              <p className="micro notice" aria-live="polite" style={{ fontSize: 10, marginBottom: 0, maxWidth: "none" }}>{notice}</p>
            </div>
          </div>
        </section>

        <section className="wrap faq" id="duvidas">
          <div><div className="eyebrow">Sem dúvidas para começar</div><h2>Vamos esclarecer.</h2></div>
          <div>{FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div>
        </section>
      </main>

      <footer className="wrap">
        <a href="#topo" className="brand">GABRIEL BAÚ</a>
        <span>Engenharia do Movimento · Consultoria online</span>
        <div className="footerlinks"><a href={INSTAGRAM} target="_blank" rel="noopener noreferrer">Instagram ↗</a></div>
      </footer>

      <dialog ref={dialogRef} className="photo-dialog" aria-labelledby="gbs-photo-title" onClose={onDialogClose}
        onClick={(e) => { if (e.target === e.currentTarget) { const r = e.currentTarget.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) e.currentTarget.close(); } }}>
        <div className="photo-dialog-header"><span id="gbs-photo-title">{photo?.caption}</span><button type="button" className="photo-dialog-close" aria-label="Fechar foto ampliada" onClick={() => dialogRef.current?.close()}>Fechar</button></div>
        {photo && <img src={photo.src} alt="Comparativo de evolução ampliado" />}
      </dialog>
    </div>
  );
}
