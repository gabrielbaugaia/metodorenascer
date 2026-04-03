export function V2GuaranteeStrip() {
  return (
    <div className="bg-primary/8 border-y border-primary/20 px-7 md:px-[60px] py-12 flex items-center justify-center gap-12 flex-wrap">
      <span className="text-[42px]">🛡️</span>
      <div>
        <h3 className="font-display-v2 text-[28px] tracking-[2px] text-foreground mb-1.5">
          DIAGNÓSTICO INICIAL GRATUITO
        </h3>
        <p className="font-body-v2 text-[14px] text-muted-foreground max-w-[520px] leading-[1.7]">
          Antes de assinar qualquer plano, você passa por uma análise completa do seu perfil de saúde e performance.
          <strong className="text-foreground"> Sem custo, sem compromisso.</strong> Se o método não for para você, a análise fica como presente.
        </p>
      </div>
    </div>
  );
}
