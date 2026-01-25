// ============================================================================
// PROMPT DE NUTRIÇÃO - MÉTODO RENASCER
// ============================================================================
// REGRAS APLICADAS:
// - Déficit/superávit calculado por peso, altura, sexo, idade, atividade e objetivo
// - Proteína: 1.6-2.2 g/kg/dia para emagrecimento/hipertrofia, distribuída ao longo do dia
// - Carboidratos e gorduras ajustados conforme preferência, tolerância e rotina
// - NADA de estratégias extremas (jejum prolongado, cetogênica rígida) sem indicação
// - Para Emagrecimento: déficit moderado 15-25% abaixo da manutenção
// - Para Hipertrofia: leve superávit ou manutenção conforme % gordura
// - Iniciante: estrutura simples (3-4 refeições), linguagem didática, hábitos básicos
// - Intermediário: mais detalhes de macros, ajustes semanais
// - Avançado: distribuição precisa, estratégias de refeição livre, ajustes finos
// - Saída: número de refeições, exemplos de combinações, quantidades, substituições
// - HORÁRIOS são calculados deterministicamente pela função buildMealSchedule
// ============================================================================

// ============================================================================
// MOTOR DETERMINÍSTICO DE HORÁRIOS - SEM IA INVENTAR HORÁRIOS
// ============================================================================

interface MealSlot {
  nome: string;
  horario: string;
  tipo: string;
}

/**
 * Calcula horários das refeições baseado na rotina do cliente.
 * Esta função é DETERMINÍSTICA - os mesmos inputs sempre geram os mesmos outputs.
 * A IA NÃO deve alterar esses horários, apenas preencher o conteúdo.
 */
export function buildMealSchedule(
  horario_acorda: string,
  horario_treino: string,
  horario_dorme: string,
  refeicoes_por_dia: number = 5
): MealSlot[] {
  // Parse HH:mm para minutos desde meia-noite
  const parseTime = (time: string): number => {
    if (!time || !time.includes(":")) return 0;
    const [h, m] = time.split(":").map(Number);
    return h * 60 + (m || 0);
  };
  
  // Formatar minutos para HH:mm
  const formatTime = (minutes: number): string => {
    // Handle overflow past midnight
    const normalizedMinutes = ((minutes % 1440) + 1440) % 1440;
    const h = Math.floor(normalizedMinutes / 60);
    const m = normalizedMinutes % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };
  
  // Defaults se não fornecidos
  const acordar = parseTime(horario_acorda) || 6 * 60;  // 06:00
  const treino = parseTime(horario_treino) || 18 * 60;  // 18:00
  const dormir = parseTime(horario_dorme) || 22 * 60;   // 22:00
  
  console.log(`[buildMealSchedule] Input - acordar: ${formatTime(acordar)}, treino: ${formatTime(treino)}, dormir: ${formatTime(dormir)}, refeicoes: ${refeicoes_por_dia}`);
  
  const refeicoes: MealSlot[] = [];
  
  // 1. Primeira refeição: 30 min após acordar
  const primeiraRefeicao = acordar + 30;
  refeicoes.push({
    nome: "Café da Manhã",
    horario: formatTime(primeiraRefeicao),
    tipo: "primeira_refeicao"
  });
  
  // 2. Pré-treino: 90 min ANTES do treino
  const preTreino = treino - 90;
  refeicoes.push({
    nome: "Refeição Pré-Treino",
    horario: formatTime(preTreino),
    tipo: "pre_treino"
  });
  
  // 3. Pós-treino: 60 min APÓS treino (considerando 1h de duração)
  const posTreino = treino + 90;
  refeicoes.push({
    nome: "Refeição Pós-Treino",
    horario: formatTime(posTreino),
    tipo: "pos_treino"
  });
  
  // 4. Última refeição (ceia): 60 min antes de dormir
  const ultimaRefeicao = dormir - 60;
  refeicoes.push({
    nome: "Ceia",
    horario: formatTime(ultimaRefeicao),
    tipo: "ultima_refeicao"
  });
  
  // 5. Se precisar de mais refeições, adicionar lanches intermediários
  if (refeicoes_por_dia >= 5) {
    // Calcular ponto médio entre café e pré-treino
    const meioManha = Math.round((primeiraRefeicao + preTreino) / 2);
    // Só adicionar se houver espaço (mínimo 2h de diferença)
    if (preTreino - primeiraRefeicao >= 180) {
      refeicoes.push({
        nome: "Lanche da Manhã",
        horario: formatTime(meioManha),
        tipo: "lanche"
      });
    }
  }
  
  if (refeicoes_por_dia >= 6) {
    // Calcular ponto médio entre pós-treino e ceia
    const meioCeia = Math.round((posTreino + ultimaRefeicao) / 2);
    if (ultimaRefeicao - posTreino >= 180) {
      refeicoes.push({
        nome: "Lanche da Tarde",
        horario: formatTime(meioCeia),
        tipo: "lanche"
      });
    }
  }
  
  // Ordenar por horário
  refeicoes.sort((a, b) => parseTime(a.horario) - parseTime(b.horario));
  
  console.log(`[buildMealSchedule] Generated ${refeicoes.length} meals:`, refeicoes.map(r => `${r.nome}: ${r.horario}`).join(", "));
  
  return refeicoes;
}

export function getNutricaoSystemPrompt(durationWeeks: number, weeksPerCycle: number): string {
  return `Você é um Nutricionista Esportivo do Método Renascer. Crie um plano alimentar COMPLETO e PERSONALIZADO seguindo rigorosamente estas regras:

### PRINCÍPIOS DO MÉTODO RENASCER ###
- Base científica: déficit/superávit calculado, proteína adequada, aderência a longo prazo
- Nada de estratégias extremas sem indicação (jejum prolongado, cetogênica rígida, etc.)
- Foco em alimentos minimamente processados, fibras e saciedade
- Plano prático e sustentável para o dia a dia

### CÁLCULOS BASE ###
PROTEÍNA: 1.6-2.2 g/kg/dia (distribuída em todas as refeições principais)
EMAGRECIMENTO/DEFINIÇÃO:
- Déficit moderado: 15-25% abaixo da manutenção
- NÃO fazer cortes agressivos (preservar massa magra e adesão)
- Priorizar saciedade: fibras, vegetais, proteínas

HIPERTROFIA/SAÚDE:
- Leve superávit ou manutenção (conforme % gordura atual)
- Carboidratos adequados para energia no treino
- Atenção à praticidade pós-treino, não regras rígidas

### ESTRUTURA POR NÍVEL ###
INICIANTE:
- Estrutura simples: 3-4 refeições principais
- Linguagem didática e clara
- Foco em hábitos básicos: beber água, incluir proteína em todas refeições, vegetais
- Instruções de substituição simples

INTERMEDIÁRIO:
- Pode receber mais detalhes de macros
- Ajustes semanais conforme feedback
- Opções de variação para evitar monotonia

AVANÇADO:
- Distribuição precisa de macros por refeição
- Estratégias de refeição livre controlada
- Ajustes finos semanais baseados em resposta
- Periodização nutricional conforme fase do treino

### ESTRUTURA OBRIGATÓRIA DO PLANO ###
1. Refeições com horários FIXOS (fornecidos abaixo - NÃO ALTERAR)
2. Exemplos práticos de alimentos e porções
3. Quantidades em medidas caseiras E gramas
4. Instruções claras de substituição (ex: trocar arroz por batata, frango por peixe)
5. Dicas de preparo e organização semanal

O plano é para ${durationWeeks} semanas, ajustável a cada ${weeksPerCycle} semanas após fotos e feedback.

RETORNE APENAS JSON VÁLIDO sem markdown, no formato:
{
  "titulo": "Plano Nutricional Personalizado - Método Renascer",
  "duracao_semanas": ${durationWeeks},
  "ciclo_atual": 1,
  "nivel": "iniciante|intermediario|avancado",
  "objetivo": "emagrecimento|hipertrofia",
  "observacao_ajustes": "Este plano será ajustado a cada ${weeksPerCycle} semanas conforme seu progresso e envio de fotos.",
  "calorias_diarias": 2000,
  "deficit_ou_superavit": "-20% (déficit moderado para emagrecimento)",
  "macros": {
    "proteinas_g": 150,
    "proteinas_por_kg": "2.0g/kg",
    "carboidratos_g": 180,
    "gorduras_g": 60
  },
  "distribuicao_proteina": "Dividida em 4 refeições (~35-40g por refeição)",
  "refeicoes": [
    {
      "nome": "Café da manhã",
      "horario": "07:00",
      "alimentos": [
        "3 ovos mexidos (150g)",
        "2 fatias de pão integral (60g)",
        "1 banana média (100g)"
      ],
      "calorias_aproximadas": 450,
      "macros_refeicao": {
        "proteinas": "25g",
        "carboidratos": "45g",
        "gorduras": "18g"
      },
      "substituicoes": [
        "Ovos → Queijo cottage 150g ou Whey 1 scoop",
        "Pão integral → Tapioca 2 unidades ou Aveia 40g",
        "Banana → Maçã ou Mamão 100g"
      ]
    }
  ],
  "hidratacao": {
    "quantidade": "35ml por kg de peso corporal (mínimo 2.5L/dia)",
    "dicas": ["Beber água ao acordar", "Garrafa sempre por perto", "Água antes das refeições"]
  },
  "suplementacao": [
    {
      "nome": "Whey Protein",
      "quantidade": "1 scoop (30g)",
      "quando": "Pós-treino ou entre refeições quando necessário",
      "obrigatorio": false
    }
  ],
  "dicas_praticas": [
    "Prepare as proteínas da semana no domingo",
    "Tenha vegetais já lavados e cortados na geladeira",
    "Coma devagar, mastigue bem",
    "Evite distrações (celular, TV) durante as refeições"
  ],
  "lista_compras_semanal": ["Ovos", "Frango", "Arroz integral", "Vegetais variados", "Frutas"],
  "proxima_avaliacao": "Enviar fotos e feedback após semana ${weeksPerCycle} para ajustes"
}`;
}

export function getNutricaoUserPrompt(
  userContext: Record<string, unknown>,
  planType: string,
  durationWeeks: number,
  weeksPerCycle: number,
  adjustments?: string
): string {
  // Calcular schedule determinístico baseado na rotina do cliente
  const schedule = buildMealSchedule(
    (userContext.horario_acorda as string) || "06:00",
    (userContext.horario_treino as string) || "18:00",
    (userContext.horario_dorme as string) || "22:00",
    parseInt((userContext.refeicoes_por_dia as string) || "5", 10)
  );
  
  const scheduleText = schedule.map(r => `- ${r.nome}: ${r.horario} (${r.tipo})`).join("\n");
  
  return `Crie um plano nutricional PERSONALIZADO para este cliente do Método Renascer:

### DADOS DO CLIENTE ###
${JSON.stringify(userContext, null, 2)}

### PLANO ###
Tipo: ${planType || 'mensal'} (${durationWeeks} semanas)

### HORÁRIOS FIXOS DAS REFEIÇÕES (NÃO ALTERAR) ###
${scheduleText}

⚠️ CRÍTICO: USE EXATAMENTE ESTES HORÁRIOS LISTADOS ACIMA.
Cada refeição no JSON deve ter o "horario" exatamente igual ao listado.
NÃO invente outros horários. Apenas defina O QUE COMER em cada horário.

${adjustments ? `### AJUSTES SOLICITADOS ###\n${adjustments}` : ""}

### INSTRUÇÕES ###
1. Calcule as calorias de manutenção baseado nos dados (peso, altura, idade, sexo, atividade)
2. Aplique déficit ou superávit conforme o OBJETIVO (emagrecimento: -15 a -25%, hipertrofia: +5 a +10%)
3. Calcule proteína entre 1.6-2.2g/kg, distribuída nas refeições
4. Identifique o NÍVEL para ajustar complexidade do plano
5. Considere restrições alimentares e preferências
6. Use linguagem simples e prática
7. Inclua opções de substituição em todas as refeições
8. Foque em alimentos acessíveis e práticos para o dia a dia brasileiro
9. A refeição PRÉ-TREINO deve ter carboidratos de fácil digestão + proteína moderada
10. A refeição PÓS-TREINO deve ter proteína de rápida absorção + carboidratos para reposição

### CRÍTICO - PERSONALIZAÇÃO BASEADA NA ANAMNESE ###
- ANALISE o campo "restricoes_alimentares" para EVITAR completamente alimentos que o cliente não pode/não gosta de comer
- ANALISE o campo "condicoes_saude" para adaptar a dieta (ex: diabético = baixo índice glicêmico, hipertenso = baixo sódio)
- ANALISE o campo "toma_medicamentos" e "medicamentos" - se o cliente toma medicamentos, considere interações alimentares conhecidas
- NUNCA sugira alimentos que o cliente indicou como restrição ou intolerância
- PRIORIZE alimentos que o cliente indicou gostar ou ter facilidade de acesso
- Se houver condições de saúde específicas, ADAPTE macros e escolhas alimentares adequadamente`;
}
