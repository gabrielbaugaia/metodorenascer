import { Link } from "react-router-dom";

export function LandingAppQuizCallout() {
  return (
    <section className="py-16 md:py-24 px-7 md:px-[60px] border-y border-border/50 bg-card/30">
      <div className="max-w-[900px] mx-auto text-center">
        <div className="inline-flex items-center font-mono-v2 text-[10px] tracking-[3px] uppercase text-primary border border-primary/40 px-[18px] py-[7px] mb-7">
          Não sabe por onde começar?
        </div>
        <h2 className="font-display-v2 text-[clamp(36px,5vw,60px)] leading-[1] tracking-[2px] text-foreground mb-5">
          DESCUBRA SEU PERFIL<br />EM 60 SEGUNDOS<span className="text-primary">.</span>
        </h2>
        <p className="font-body-v2 text-[15px] md:text-[16px] text-muted-foreground/80 font-light leading-[1.8] max-w-[520px] mx-auto mb-10">
          9 perguntas rápidas avaliam seu sono, stress, compulsão e disciplina —
          e mostram exatamente onde o Método pode te ajudar primeiro.
        </p>
        <Link
          to="/quiz"
          className="font-mono-v2 text-[11px] tracking-[2.5px] uppercase bg-transparent text-primary px-10 py-4 border border-primary hover:bg-primary hover:text-primary-foreground transition-all duration-200 inline-block"
        >
          Fazer Diagnóstico Gratuito
        </Link>
      </div>
    </section>
  );
}
