import { Target, Utensils, Brain, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const pillars = [
  {
    icon: Target,
    title: "Treino",
    description: "Planos de treino personalizados para seu nivel e objetivos. Adaptamos semanalmente baseado no seu progresso.",
  },
  {
    icon: Utensils,
    title: "Nutricao",
    description: "Cardapios flexiveis que se encaixam na sua rotina. Sem dietas malucas, foco em habitos sustentaveis.",
  },
  {
    icon: Brain,
    title: "Mindset",
    description: "Tecnicas de disciplina mental e motivacao. O corpo muda quando a mente esta preparada.",
  },
  {
    icon: BookOpen,
    title: "Receitas",
    description: "Mais de 100 receitas fitness praticas e deliciosas. Comer bem nao precisa ser chato.",
  },
];

export function MethodologySection() {
  return (
    <section id="metodologia" className="py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl text-foreground mb-4">
            OS 4 <span className="text-gradient">PILARES</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Uma abordagem completa para transformacao fisica e mental
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {pillars.map((pillar, index) => (
            <Card 
              key={pillar.title} 
              variant="dashboard"
              className="group text-center animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-8 flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <pillar.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-display text-2xl text-foreground">{pillar.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {pillar.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
