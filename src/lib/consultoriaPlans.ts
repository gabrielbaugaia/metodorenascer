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
  { feature: "Treino individualizado e histórico no app", values: ["Incluído", "Incluído", "Incluído"] },
  { feature: "SIS™ e indicadores de recuperação", values: ["Incluído", "Incluído", "Incluído"] },
  { feature: "Fotos e medidas", values: ["Registro a cada 30 dias", "Registro e análise a cada 30 dias", "Registro e análise aprofundada a cada 30 dias"] },
  { feature: "Ferramentas alimentares e receitas", values: ["Incluído¹", "Incluído¹", "Incluído¹"] },
  { feature: "Prescrição de dieta personalizada", values: CONSULTORIA_PLANS.map((plan) => plan.nutrition.personalizedDiet ? "Incluída" : "Não incluída") },
  { feature: "Ajustes do protocolo alimentar", values: CONSULTORIA_PLANS.map((plan) => plan.nutrition.monthlyAdjustments === 0 ? "Sem ajuste do protocolo" : `${plan.nutrition.monthlyAdjustments} ajuste por mês, caso necessário`) },
  { feature: "Feedback humano pessoal de Gabriel", values: ["Não inclui revisão semanal", "1 vez por semana no app", "Semanal + acompanhamento mais próximo"] },
  { feature: "Revisão de metas e ajustes supervisionados", values: ["Não inclui revisão semanal", "Na revisão semanal", "Conforme necessidade"] },
  { feature: "Contato", values: ["Pelo app", "Suporte pelo app", "App + WhatsApp pessoal²"] },
  { feature: "Pagamento", values: ["Cartão recorrente", "Pix ou cartão, sem renovação automática", "Pix ou cartão, sem renovação automática"] },
  { feature: "Cancelamento / renovação", values: ["Aviso de 30 dias", "Sem fidelidade; você decide renovar", "Você decide renovar a cada mês"] },
];