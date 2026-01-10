import { Card, CardContent } from "@/components/ui/card";
import { XCircle, TrendingDown, UserX } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
const problems = [{
  icon: XCircle,
  title: "Autoestima Destruída",
  description: "Você já seguiu a dieta da moda. Já contratou o treinador online que te enviou uma planilha genérica. O resultado? Frustração e desistência."
}, {
  icon: TrendingDown,
  title: "Corpo Estagnado",
  description: "O efeito sanfona constante. Perde peso, ganha tudo de volta. Seu metabolismo parece lutar contra você a cada tentativa."
}, {
  icon: UserX,
  title: "Desiste Sozinho",
  description: "Sem suporte real, sem estratégia. Enquanto tratar seu corpo como hobby, continuará tendo resultados amadores."
}];
export function ProblemSection() {
  const {
    ref,
    isVisible
  } = useScrollAnimation({
    threshold: 0.1
  });
  return <section ref={ref} className={`py-20 md:py-28 bg-background transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-14 max-w-3xl mx-auto flex flex-col items-center gap-4">
          <h2 className="font-display font-black text-foreground text-[2.5rem] sm:text-4xl lg:text-6xl leading-[1.1] tracking-[-0.02em] text-justify md:text-6xl">Para homens e mulheres acima de 30 que estão sedentários ou cansaram de tentar sozinho e não ter resultado.<span className="text-primary">FALHOU</span> com Você
          </h2>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed text-center max-w-xl">O problema não é a falta de esforço , é a falta de estratégia.</p>
        </div>

        {/* Problem Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {problems.map((problem, index) => <Card key={problem.title} className="bg-card border-border/50 animate-fade-in group hover:border-primary/30 transition-all duration-300 h-full" style={{
          animationDelay: `${index * 0.1}s`
        }}>
              <CardContent className="p-7 flex flex-col items-center text-center h-full">
                <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-5 group-hover:bg-destructive/20 transition-colors">
                  <problem.icon className="w-7 h-7 text-destructive" />
                </div>
                <h3 className="font-display text-xl md:text-2xl text-foreground mb-3">{problem.title}</h3>
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed">{problem.description}</p>
              </CardContent>
            </Card>)}
        </div>

        {/* Bottom Message */}
        <div className="text-center mt-14 max-w-3xl mx-auto">
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-2">
            O Método Renascer não é um convite para tentar mais uma vez.
          </p>
          <p className="text-base md:text-lg text-primary font-semibold">
            É um ultimato para mudar sua vida para sempre.
          </p>
        </div>
      </div>
    </section>;
}