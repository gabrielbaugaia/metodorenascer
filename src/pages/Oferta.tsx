import { useEffect } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { captureUtmParameters } from "@/hooks/useAnalytics";
import { useAnalytics } from "@/hooks/useAnalytics";

const STRIPE_TRIAL_LINK = "https://buy.stripe.com/9B67sKeMW4ru2sp7Gy2B201";

export default function Oferta() {
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    captureUtmParameters();
    trackEvent("oferta_page_view", "oferta");
  }, []);

  const handleCheckout = () => {
    trackEvent("trial_cta_clicked", "oferta");
    window.open(STRIPE_TRIAL_LINK, "_blank");
  };

  const included = [
    "Treino personalizado para sua rotina e objetivos",
    "Plano alimentar flexível e sustentável",
    "Acompanhamento de evolução com fotos e métricas",
    "Suporte direto com o mentor",
    "Acesso completo à plataforma"
  ];

  const forWho = [
    "Quer resultados reais e duradouros",
    "Está cansado de tentar sozinho",
    "Busca um método que funcione na sua rotina",
    "Quer acompanhamento real, não só PDF genérico"
  ];

  const notForWho = [
    "Busca fórmulas mágicas ou resultados em 7 dias",
    "Não está disposto a seguir um processo",
    "Quer apenas um treino genérico da internet",
    "Não tem comprometimento com a própria transformação"
  ];

  const steps = [
    { number: "1", title: "Ative seu trial", description: "Cadastre seu cartão e comece grátis" },
    { number: "2", title: "Preencha a anamnese", description: "Conte sobre você, seus objetivos e rotina" },
    { number: "3", title: "Receba seu protocolo", description: "Treino e dieta personalizados em até 48h" }
  ];

  const faqs = [
    {
      question: "Vou ser cobrado nos 7 dias grátis?",
      answer: "Não. Se cancelar antes do término do período, não será cobrado."
    },
    {
      question: "Posso cancelar quando quiser?",
      answer: "Sim. Não existe fidelidade. Você pode cancelar a qualquer momento diretamente pela plataforma."
    },
    {
      question: "Como funciona o acompanhamento?",
      answer: "Você terá acesso direto ao mentor através da plataforma, podendo tirar dúvidas e receber orientações personalizadas."
    },
    {
      question: "Em quanto tempo vou ver resultados?",
      answer: "Depende do seu comprometimento. A maioria dos alunos começa a perceber mudanças nas primeiras 2-4 semanas seguindo o protocolo."
    },
    {
      question: "O plano alimentar é restritivo?",
      answer: "Não. Trabalhamos com flexibilidade alimentar. Você vai aprender a comer de forma sustentável, sem cortar grupos alimentares."
    },
    {
      question: "Preciso de academia?",
      answer: "Não necessariamente. Montamos treinos adaptados ao seu ambiente, seja academia, casa ou ao ar livre."
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="py-6 px-4 border-b border-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-xl font-bold tracking-tight">Método Renascer</span>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-black leading-tight mb-6">
            TESTE 7 DIAS GRÁTIS.
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8">
            Experimente o Método Renascer sem compromisso. Cancele quando quiser.
          </p>
          <Button
            onClick={handleCheckout}
            className="bg-orange-500 hover:bg-orange-600 text-white text-lg px-8 py-6 h-auto font-bold rounded-lg"
          >
            Começar meus 7 dias grátis
          </Button>
          <div className="flex flex-wrap justify-center gap-4 md:gap-8 mt-6 text-sm text-gray-400">
            <span>✔ 7 dias grátis</span>
            <span>✔ Sem compromisso</span>
            <span>✔ Cancele antes e não paga nada</span>
          </div>
        </div>
      </section>

      {/* Problema */}
      <section className="py-16 px-4 border-t border-gray-800">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            SE VOCÊ JÁ TENTOU VÁRIAS VEZES E DESISTIU...
          </h2>
          <p className="text-gray-300 text-center text-lg">
            Não é sua culpa. Você só não tinha o método certo e o acompanhamento necessário. 
            O Método Renascer foi criado para pessoas reais, com rotinas reais, que querem 
            resultados de verdade.
          </p>
        </div>
      </section>

      {/* O que está incluído */}
      <section className="py-16 px-4 border-t border-gray-800">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
            O QUE ESTÁ INCLUÍDO
          </h2>
          <ul className="space-y-4">
            {included.map((item, index) => (
              <li key={index} className="flex items-start gap-3">
                <Check className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-200 text-lg">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Para quem é / Para quem não é */}
      <section className="py-16 px-4 border-t border-gray-800">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            <div>
              <h3 className="text-xl font-bold mb-6 text-orange-500">PARA QUEM É</h3>
              <ul className="space-y-3">
                {forWho.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-6 text-gray-500">PARA QUEM NÃO É</h3>
              <ul className="space-y-3">
                {notForWho.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <X className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-500">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="py-16 px-4 border-t border-gray-800">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            COMO FUNCIONA
          </h2>
          <div className="space-y-8">
            {steps.map((step) => (
              <div key={step.number} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center font-bold text-lg flex-shrink-0">
                  {step.number}
                </div>
                <div>
                  <h4 className="font-bold text-lg">{step.title}</h4>
                  <p className="text-gray-400">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Card de preço */}
      <section className="py-16 px-4 border-t border-gray-800">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-4">
            <span className="inline-block bg-orange-500 text-white text-sm font-bold px-4 py-1 rounded-full uppercase tracking-wider">
              Grátis
            </span>
          </div>
          <div className="border-2 border-orange-500 rounded-xl p-8 text-center">
            <h3 className="text-xl font-bold mb-2">7 Dias Grátis</h3>
            <div className="mb-2">
              <span className="text-4xl md:text-5xl font-black">R$0</span>
              <span className="text-gray-400 ml-2">por 7 dias</span>
            </div>
            <p className="text-sm text-gray-400 mb-6">Depois R$49,90/mês</p>
            <Button
              onClick={handleCheckout}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white text-lg py-6 h-auto font-bold rounded-lg"
            >
              Ativar meus 7 dias grátis
            </Button>
            <p className="text-sm text-gray-500 mt-4">
              Cancele antes dos 7 dias e não paga nada.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 border-t border-gray-800">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
            PERGUNTAS FREQUENTES
          </h2>
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`faq-${index}`}
                className="border border-gray-700 rounded-lg px-4"
              >
                <AccordionTrigger className="text-left text-white hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-400">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 px-4 border-t border-gray-800">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            SUA TRANSFORMAÇÃO COMEÇA AGORA
          </h2>
          <p className="text-gray-400 mb-8">
            Não deixe para depois o que pode mudar sua vida hoje.
          </p>
          <Button
            onClick={handleCheckout}
            className="bg-orange-500 hover:bg-orange-600 text-white text-lg px-8 py-6 h-auto font-bold rounded-lg"
          >
            Quero meus 7 dias grátis
          </Button>
        </div>
      </section>

      <footer className="py-8 px-4 border-t border-gray-800">
        <div className="max-w-4xl mx-auto text-center text-gray-500 text-sm">
          Método Renascer © 2026
        </div>
      </footer>
    </div>
  );
}
