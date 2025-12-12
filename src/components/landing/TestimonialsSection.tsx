import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Carlos Silva",
    role: "Perdeu 15kg em 3 meses",
    content: "O Metodo Renascer mudou minha vida. O suporte e personalizado e os resultados sao reais. Recomendo para todos que querem uma transformacao verdadeira.",
    rating: 5,
  },
  {
    name: "Ana Paula",
    role: "Ganhou massa muscular",
    content: "Depois de anos tentando sem sucesso, finalmente encontrei um metodo que funciona. A combinacao de treino, nutricao e mindset faz toda a diferenca.",
    rating: 5,
  },
  {
    name: "Roberto Mendes",
    role: "Transformacao completa",
    content: "Em 6 meses consegui resultados que nunca imaginei. O acompanhamento via WhatsApp e incrivel, sempre tenho suporte quando preciso.",
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-24 section-dark">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl text-foreground mb-4">
            RESULTADOS <span className="text-gradient">REAIS</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Veja o que nossos alunos tem a dizer sobre a transformacao que viveram
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={testimonial.name} 
              variant="glass" 
              className="animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6 space-y-4">
                {/* Rating */}
                <div className="flex gap-1">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>

                {/* Content */}
                <p className="text-muted-foreground text-sm leading-relaxed">
                  "{testimonial.content}"
                </p>

                {/* Author */}
                <div className="pt-4 border-t border-border">
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-primary">{testimonial.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
