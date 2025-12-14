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
  return <section ref={ref} className={`py-24 bg-background transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-6xl text-foreground mb-4 italic">O FITNESS TRADICIONAL <span className="text-primary">FALHOU</span> COM VOCÊ
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">O problema não é a falta de esforço. O problema é a falta de estratégia.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {problems.map((problem, index) => <Card key={problem.title} className="bg-card border-border/50 animate-fade-in group hover:border-primary/30 transition-all duration-300" style={{
          animationDelay: `${index * 0.1}s`
        }}>
              <CardContent className="p-8 space-y-4 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center group-hover:bg-destructive/20 transition-colors">
                  <problem.icon className="w-8 h-8 text-destructive" />
                </div>
                <h3 className="font-display text-2xl text-foreground">{problem.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{problem.description}</p>
              </CardContent>
            </Card>)}
        </div>

        <div className="text-center mt-16">
          <p className="text-xl md:text-2xl text-foreground font-medium">O Método Renascer não é um convite para tentar mais uma vez.</p>
          <p className="text-xl md:text-2xl text-primary font-bold mt-2">É um ultimato para mudar sua vida para sempre.</p>
        </div>
      </div>
    </section>;
}