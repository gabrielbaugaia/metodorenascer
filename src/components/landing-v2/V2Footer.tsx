export function V2Footer() {
  return (
    <footer className="px-7 md:px-[60px] py-[52px] border-t border-border grid grid-cols-1 md:grid-cols-[1fr_auto] items-center gap-8">
      <div>
        <div className="font-display-v2 text-[28px] tracking-[4px] text-foreground">
          MÉTODO RENASCER<span className="text-primary">.</span>
        </div>
        <p className="font-mono-v2 text-[9px] tracking-[2px] uppercase text-muted-foreground mt-1.5">
          Sistema de Inteligência em Performance — © 2026
        </p>
      </div>
      <div className="font-mono-v2 text-[9px] tracking-[2px] uppercase text-muted-foreground text-left md:text-right leading-[2]">
        <a href="https://metodo.renascerapp.com.br" className="text-primary hover:underline">metodo.renascerapp.com.br</a><br />
        @renascerapp · @BAUGABRIEL<br />
        Dados · Precisão · Resultado
      </div>
    </footer>
  );
}
