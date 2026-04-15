import { forwardRef } from "react";
import { ArrowRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const STRIPE_CHECKOUT_URL = "https://buy.stripe.com/5kQ7sKbAKcY03wtd0S2B206";

export const CTASection = forwardRef<HTMLElement>((_, forwardedRef) => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <section
      ref={ref}
      className={`py-20 md:py-28 section-dark relative overflow-hidden transition-all duration-1000 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center bottom, hsl(25 100% 12% / 0.3) 0%, transparent 60%)",
        }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center flex flex-col items-center gap-8">

          {/* Reinforcement copy */}
          <div className="flex flex-col items-center gap-4 text-muted-foreground text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
            <p>
              O Método Renascer não é um desafio de 21 dias.<br />
              É um sistema contínuo de prescrição e ajuste.
            </p>
            <p>
              Você não está comprando acesso a um app.<br />
              Está entrando em um processo.
            </p>
          </div>

          {/* Headline */}
          <h2 className="font-display font-black text-foreground text-[2rem] sm:text-3xl md:text-4xl lg:text-5xl leading-[1.1] tracking-[-0.02em]">
            Corpo forte, mente disciplinada e rotina sob controle{" "}
            <span className="text-primary">mudam tudo.</span>
          </h2>

          {/* Pricing anchor */}
          <div className="flex flex-col items-center gap-3">
            <p className="text-muted-foreground text-sm">
              Acesso completo · R$497 à vista ou 12x de R$49,70
            </p>
            <p className="text-xs text-primary font-medium">Garantia de 7 dias · Sem fidelidade forçada</p>
          </div>

          {/* Primary CTA → Stripe */}
          <div className="pt-2 w-full max-w-sm">
            <a
              href={STRIPE_CHECKOUT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-fire group inline-flex w-full items-center justify-center gap-2 rounded-sm px-10 py-5 text-sm font-semibold uppercase tracking-wide hover:opacity-90 transition-opacity"
            >
              ENTRAR NO MÉTODO RENASCER
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <p className="mt-3 text-center text-[0.65rem] text-muted-foreground">
              Pagamento seguro · Acesso imediato após confirmação
            </p>
          </div>
        </div>
      </div>
    </section>
  );
});

CTASection.displayName = "CTASection";
