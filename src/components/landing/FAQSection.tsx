import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Button } from "@/components/ui/button";

const faqs = [
  {
    question: "Como funciona o Método Renascer?",
    answer: "O Método Renascer é uma consultoria online completa que combina treino personalizado, nutrição estratégica e acompanhamento comportamental. Após a inscrição, você preenche uma anamnese detalhada e recebe seu plano personalizado em até 48h. Todo o suporte é feito via WhatsApp com resposta em até 24h.",
  },
  {
    question: "Os planos substituem um profissional?",
    answer: "Não. O Método Renascer é uma consultoria conduzida pelo Personal Trainer Gabriel Baú, profissional formado e registrado. Você terá acompanhamento real de um especialista, não apenas planilhas genéricas.",
  },
  {
    question: "Como funciona o pagamento?",
    answer: "O pagamento é feito via cartão de crédito ou PIX de forma segura. Após a confirmação, você recebe acesso imediato à plataforma e inicia o processo de anamnese para criar seu plano personalizado.",
  },
  {
    question: "Posso cancelar a qualquer momento?",
    answer: "Sim! Você pode cancelar sua assinatura a qualquer momento sem multas ou taxas adicionais. Basta entrar em contato com nosso suporte via WhatsApp.",
  },
  {
    question: "Preciso de equipamentos especiais?",
    answer: "Não necessariamente. Adaptamos seu treino de acordo com os equipamentos que você tem disponível, seja em casa ou na academia. Muitos dos nossos alunos treinam apenas com o peso do corpo.",
  },
  {
    question: "Como recebo meu plano personalizado?",
    answer: "Após preencher a anamnese completa com seus dados, objetivos e limitações, seu plano é elaborado em até 48 horas e disponibilizado diretamente na plataforma, com vídeos explicativos de cada exercício.",
  },
  {
    question: "Terei suporte para tirar dúvidas?",
    answer: "Sim! Você tem acesso ao suporte via WhatsApp 24h com nosso coach de IA e atendimento humano em horário comercial. Todas as dúvidas são respondidas em até 24h.",
  },
  {
    question: "O método serve para iniciantes, pessoas com limitações ou atletas avançados?",
    answer: "Sim para todos! O plano é 100% personalizado para seu nível atual, objetivos e possíveis limitações físicas. Seja iniciante completo ou atleta experiente, o método se adapta a você.",
  },
  {
    question: "O que acontece após o término do plano? Posso renovar?",
    answer: "A renovação é automática para sua conveniência, mas você pode cancelar a qualquer momento. Recomendamos continuar para manter os resultados e evoluir ainda mais.",
  },
  {
    question: "Posso refazer a anamnese?",
    answer: "Sim! A cada mês você pode atualizar sua anamnese com novos dados de peso, medidas e objetivos. Isso garante que seu plano evolua junto com você.",
  },
];

export const FAQSection = () => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <section 
      ref={ref} 
      className={`py-20 md:py-28 bg-background transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
    >
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-14 max-w-3xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-foreground mb-5 tracking-wide">
            Perguntas <span className="text-primary">Frequentes</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
            Tire suas dúvidas sobre o Método Renascer
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card border border-border/50 rounded-lg px-5 overflow-hidden data-[state=open]:border-primary/40"
              >
                <AccordionTrigger className="text-left text-foreground font-medium text-sm md:text-base hover:text-primary hover:no-underline py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm pb-4 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground text-sm mb-4">Ainda tem dúvidas?</p>
          <Button variant="fire" size="lg" asChild>
            <a
              href="https://wa.me/5511999999999"
              target="_blank"
              rel="noopener noreferrer"
            >
              FALE CONOSCO NO WHATSAPP
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
