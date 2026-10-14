// Presentation only. Slugs remain identical to the existing Asaas contracts.
export const CONSULTORIA_PLANS = [
  {
    slug: "start", name: "Start", price: 197, modes: ["subscription"],
    nutrition: { personalizedDiet: true, monthlyAdjustments: 0 },
    intro: "Seu treino individualizado, com dados para acompanhar cada etapa.",
    cta: "Começar com Start",
    payment: "Cartão de crédito recorrente. R$ 197 por mês. Cancelamento com aviso de 30 dias.",
    features: [
      "Treino individualizado no app, para sua rotina e estrutura disponível",
      "Registro e histórico de séries, repetições e cargas",
      "SIS™: sono, estresse, energia e indicadores de recuperação para orientar a intensidade",
      "Acompanhamento de fotos e medidas em ciclos de 30 dias",
      "Diário alimentar e ferramentas de organização da alimentação",
      "Lista de compras quando incluída no protocolo e gerador de receitas",
      "Prescrição de dieta personalizada, sem ajuste do protocolo alimentar",
    ],
  },
  {
    slug: "mensal", name: "Evolution", price: 297, modes: ["pix", "card"], recommended: true,
    nutrition: { personalizedDiet: true, monthlyAdjustments: 1 },
    intro: "Dados do app com a leitura pessoal de Gabriel, toda semana.",
    cta: "Quero acompanhamento semanal",
    payment: "Pix ou cartão de crédito. R$ 297 por mês, sem fidelidade e sem renovação automática.",
    features: [
      "Tudo do Start",
      "Prescrição de dieta personalizada com 1 ajuste do protocolo alimentar por mês, caso necessário",
      "Análise e feedback humano pessoal de Gabriel, 1 vez por semana no app",
      "Avaliação de cargas, consistência e recuperação",
      "Revisão da evolução fotográfica e das medidas a cada 30 dias",
      "Revisão de metas e ajustes de treino supervisionados",
      "Suporte pelo app",
    ],
  },
  {
    slug: "premium", name: "Premium", price: 697, modes: ["pix", "card"],
    nutrition: { personalizedDiet: true, monthlyAdjustments: 1 },
    intro: "Contato direto e uma análise mais próxima do seu processo.",
    cta: "Quero acompanhamento Premium",
    payment: "Pix ou cartão de crédito. R$ 697 por mês, sem renovação automática.",
    features: [
      "Tudo do Evolution",
      "Prescrição de dieta personalizada com 1 ajuste do protocolo alimentar por mês, caso necessário",
      "WhatsApp direto e pessoal com Gabriel",
      "Prioridade em dias úteis, durante o horário comercial",
      "Acompanhamento mais próximo e ajustes de treino conforme necessidade",
      "Análise aprofundada de estagnação e hábitos alimentares",
    ],
  },
];

export function getConsultoriaPlan(slug: string | null) {
  return CONSULTORIA_PLANS.find((plan) => plan.slug === (slug === "elite" ? "premium" : slug)) ?? CONSULTORIA_PLANS[0];
}

export const CONSULTORIA_COMPARISON = [
  { feature: "Treino e histórico no app", values: ["Incluído", "Incluído", "Incluído"] },
  { feature: "SIS™ e recuperação", values: ["Incluído", "Incluído", "Incluído"] },
  { feature: "Fotos e medidas · 30 dias", values: ["Registro", "Registro + análise", "Análise aprofundada"] },
  { feature: "Diário alimentar e receitas", values: ["Incluído", "Incluído", "Incluído"] },
  { feature: "Lista de compras", values: ["No protocolo¹", "No protocolo¹", "No protocolo¹"] },
  { feature: "Prescrição de dieta personalizada", values: CONSULTORIA_PLANS.map((plan) => plan.nutrition.personalizedDiet ? "Incluída" : "Não incluída") },
  { feature: "Ajuste alimentar, se necessário", values: CONSULTORIA_PLANS.map((plan) => plan.nutrition.monthlyAdjustments === 0 ? "Não incluído" : `${plan.nutrition.monthlyAdjustments}/mês`) },
  { feature: "Feedback de Gabriel no app", values: ["Sem revisão semanal", "1×/semana", "Semanal + próximo"] },
  { feature: "Metas e ajustes de treino", values: ["Sem revisão semanal", "Revisão semanal", "Conforme necessidade"] },
  { feature: "Contato", values: ["App", "App", "App + WhatsApp²"] },
  { feature: "Pagamento", values: ["Cartão", "Pix ou cartão", "Pix ou cartão"] },
  { feature: "Renovação", values: ["Automática", "Você renova", "Você renova"] },
  { feature: "Cancelamento / fidelidade", values: ["Aviso de 30 dias", "Sem fidelidade", "Sem recorrência"] },
];