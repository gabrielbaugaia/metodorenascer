import { Card, CardContent } from "@/components/ui/card";
import { XCircle, TrendingDown, UserX } from "lucide-react";

const problems = [
  {
    icon: XCircle,
    title: "Autoestima Destruida",
    description: "Voce ja seguiu a dieta da moda. Ja contratou o treinador online que te enviou uma planilha generica. O resultado? Frustracao e desistencia."
  },
  {
    icon: TrendingDown,
    title: "Corpo Estagnado",
    description: "O efeito sanfona constante. Perde peso, ganha tudo de volta. Seu metabolismo parece lutar contra voce a cada tentativa."
  },
  {
    icon: UserX,
    title: "Desiste Sozinho",
    description: "Sem suporte real, sem estrategia. Enquanto tratar seu corpo como hobby, continuara tendo resultados amadores."
  }
];

export function ProblemSection() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-6xl text-foreground mb-4 italic">
            O FITNESS TRADICIONAL <span className="text-primary">FALHOU</span> COM VOCE
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            O problema nao e a falta de esforco. O problema e a falta de estrategia.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {problems.map((problem, index) => (
            <Card 
              key={problem.title} 
              className="bg-card border-border/50 animate-fade-in group hover:border-primary/30 transition-all duration-300"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-8 space-y-4 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center group-hover:bg-destructive/20 transition-colors">
                  <problem.icon className="w-8 h-8 text-destructive" />
                </div>
                <h3 className="font-display text-2xl text-foreground">{problem.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{problem.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-16">
          <p className="text-xl md:text-2xl text-foreground font-medium">
            O Metodo Renascer nao e um convite para tentar mais uma vez.
          </p>
          <p className="text-xl md:text-2xl text-primary font-bold mt-2">
            E um ultimato para mudar sua vida para sempre.
          </p>
        </div>
      </div>
    </section>
  );
}
