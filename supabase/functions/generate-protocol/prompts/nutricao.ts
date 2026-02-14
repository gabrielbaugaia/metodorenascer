// ============================================================================
// PROMPT DE NUTRIÇÃO - MÉTODO RENASCER (V2 - PRESCRIÇÃO COMPLETA)
// ============================================================================

// ============================================================================
// MOTOR DETERMINÍSTICO DE HORÁRIOS
// ============================================================================

interface MealSlot {
  nome: string;
  horario: string;
  tipo: string;
}

export function buildMealSchedule(
  horario_acorda: string,
  horario_treino: string,
  horario_dorme: string,
  refeicoes_por_dia: number = 5
): MealSlot[] {
  const parseTime = (time: string): number => {
    if (!time || !time.includes(":")) return 0;
    const [h, m] = time.split(":").map(Number);
    return h * 60 + (m || 0);
  };
  
  const formatTime = (minutes: number): string => {
    const normalizedMinutes = ((minutes % 1440) + 1440) % 1440;
    const h = Math.floor(normalizedMinutes / 60);
    const m = normalizedMinutes % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };
  
  const acordar = parseTime(horario_acorda) || 6 * 60;
  const treino = parseTime(horario_treino) || 18 * 60;
  const dormir = parseTime(horario_dorme) || 22 * 60;
  
  console.log(`[buildMealSchedule] Input - acordar: ${formatTime(acordar)}, treino: ${formatTime(treino)}, dormir: ${formatTime(dormir)}, refeicoes: ${refeicoes_por_dia}`);
  
  const refeicoes: MealSlot[] = [];
  
  const primeiraRefeicao = acordar + 30;
  refeicoes.push({ nome: "Café da Manhã", horario: formatTime(primeiraRefeicao), tipo: "primeira_refeicao" });
  
  const preTreino = treino - 90;
  refeicoes.push({ nome: "Refeição Pré-Treino", horario: formatTime(preTreino), tipo: "pre_treino" });
  
  const posTreino = treino + 90;
  refeicoes.push({ nome: "Refeição Pós-Treino", horario: formatTime(posTreino), tipo: "pos_treino" });
  
  const preSono = dormir - 60;
  refeicoes.push({ nome: "Refeição Pré-Sono", horario: formatTime(preSono), tipo: "pre_sono" });
  
  if (refeicoes_por_dia >= 5) {
    const meioManha = Math.round((primeiraRefeicao + preTreino) / 2);
    if (preTreino - primeiraRefeicao >= 180) {
      refeicoes.push({ nome: "Lanche da Manhã", horario: formatTime(meioManha), tipo: "lanche" });
    }
  }
  
  if (refeicoes_por_dia >= 6) {
    const meioCeia = Math.round((posTreino + preSono) / 2);
    if (preSono - posTreino >= 180) {
      refeicoes.push({ nome: "Lanche da Tarde", horario: formatTime(meioCeia), tipo: "lanche" });
    }
  }
  
  refeicoes.sort((a, b) => parseTime(a.horario) - parseTime(b.horario));
  
  console.log(`[buildMealSchedule] Generated ${refeicoes.length} meals:`, refeicoes.map(r => `${r.nome}: ${r.horario}`).join(", "));
  
  return refeicoes;
}

export function getNutricaoSystemPrompt(durationWeeks: number, weeksPerCycle: number): string {
  return `Você é um Nutricionista Esportivo de Elite do Método Renascer. Crie um plano alimentar COMPLETO, QUANTIFICADO e ESTRATÉGICO.

### REGRAS ABSOLUTAS - NÃO VIOLAR ###
1. TODOS os campos listados no JSON são OBRIGATÓRIOS
2. Macros diários DEVEM ser calculados com valores numéricos exatos
3. CADA refeição DEVE ter macros (proteinas_g, carboidratos_g, gorduras_g, calorias)
4. DEVE existir refeição pré-treino (60-120min antes) e pós-treino (até 2h após)
5. DEVE existir refeição pré-sono com EXATAMENTE 3 opções com macros
6. DEVE existir hidratação calculada (35-45ml/kg)
7. DEVE gerar DOIS planos: dia de treino e dia de descanso
8. DEVE gerar lista de compras semanal por categoria
9. DEVE gerar substituições equivalentes com quantidades

### CÁLCULOS BASE ###
PROTEÍNA: 1.6-2.2 g/kg/dia
EMAGRECIMENTO: déficit 15-25% abaixo da manutenção
HIPERTROFIA: superávit 5-10% acima da manutenção
ÁGUA: 35-45ml por kg de peso corporal

### REFEIÇÃO PRÉ-TREINO (60-120min antes) ###
- Proteína: 25-45g
- Carboidrato: moderado/alto (digestão fácil)
- Gordura: baixa/moderada

### REFEIÇÃO PÓS-TREINO (até 2h após) ###
- Proteína: 30-50g (rápida absorção)
- Carboidrato: moderado/alto (reposição glicogênio)
- Gordura: baixa/moderada

### REFEIÇÃO PRÉ-SONO (OBRIGATÓRIO) ###
- Proteína: 25-40g (digestão lenta - caseína)
- Carboidrato: baixo/moderado
- Gordura: moderada
- Fornecer EXATAMENTE 3 opções com macros calculados

### DIA DE DESCANSO ###
- Reduzir carboidratos em 15-30% vs dia de treino
- Manter proteína IGUAL
- Manter ou aumentar levemente gordura
- Redistribuir calorias das refeições pré/pós treino

### LISTA DE COMPRAS ###
- Calcular: quantidade diária × 7 dias
- Organizar por categorias: proteinas, carboidratos, gorduras, frutas, vegetais, outros
- Cada item com nome e quantidade_semanal (ex: "1400g")

### SUBSTITUIÇÕES ###
- Equivalências numéricas (ex: "180g frango = 200g tilápia = 4 ovos")
- Organizar por categoria: proteínas, carboidratos, gorduras
- RESPEITAR restrições alimentares do cliente

### ESTRATÉGIA ANTI-COMPULSÃO ###
- Explicar importância da refeição pré-sono
- Alta proteína + digestão lenta
- Evitar açúcar isolado à noite
- 3 opções práticas com macros

O plano é para ${durationWeeks} semanas, ajustável a cada ${weeksPerCycle} semanas.

RETORNE APENAS JSON VÁLIDO sem markdown, no formato:
{
  "titulo": "Plano Nutricional Personalizado - Método Renascer",
  "duracao_semanas": ${durationWeeks},
  "ciclo_atual": 1,
  "nivel": "iniciante|intermediario|avancado",
  "objetivo": "emagrecimento|hipertrofia",
  "observacao_ajustes": "...",
  "macros_diarios": {
    "calorias": 2000,
    "proteina_g": 150,
    "carboidrato_g": 200,
    "gordura_g": 60,
    "agua_litros": 3.0
  },
  "deficit_ou_superavit": "-20% (déficit moderado)",
  "hidratacao": {
    "litros_dia": 3.0,
    "calculo": "40ml x 75kg = 3.0L",
    "distribuicao": [
      "500ml ao acordar",
      "500ml pela manhã",
      "500ml pré-treino",
      "500ml pós-treino",
      "500ml à tarde",
      "500ml à noite"
    ]
  },
  "plano_dia_treino": {
    "calorias_totais": 2000,
    "refeicoes": [
      {
        "nome": "Café da Manhã",
        "horario": "07:00",
        "tipo": "primeira_refeicao",
        "alimentos": ["3 ovos mexidos (150g)", "2 fatias pão integral (60g)", "1 banana (100g)"],
        "macros_refeicao": {
          "proteinas_g": 25,
          "carboidratos_g": 45,
          "gorduras_g": 18,
          "calorias": 440
        },
        "substituicoes": ["Ovos → Queijo cottage 150g", "Pão → Tapioca 2un ou Aveia 40g"]
      }
    ]
  },
  "plano_dia_descanso": {
    "calorias_totais": 1700,
    "nota_ajuste": "Carboidratos reduzidos em 20% em relação ao dia de treino",
    "refeicoes": [
      {
        "nome": "Café da Manhã",
        "horario": "07:00",
        "tipo": "primeira_refeicao",
        "alimentos": ["3 ovos mexidos (150g)", "1 fatia pão integral (30g)", "1 banana (100g)"],
        "macros_refeicao": {
          "proteinas_g": 25,
          "carboidratos_g": 30,
          "gorduras_g": 18,
          "calorias": 378
        },
        "substituicoes": ["Ovos → Queijo cottage 150g"]
      }
    ]
  },
  "refeicao_pre_sono": {
    "explicacao": "Refeição essencial para evitar compulsão noturna e preservar massa muscular durante o sono",
    "opcoes": [
      {
        "descricao": "Iogurte com whey e pasta de amendoim",
        "alimentos": ["200g iogurte natural", "1 scoop whey", "15g pasta de amendoim"],
        "macros": { "proteinas_g": 35, "carboidratos_g": 15, "gorduras_g": 12, "calorias": 308 }
      },
      {
        "descricao": "Ovos com aveia",
        "alimentos": ["3 ovos mexidos", "30g aveia"],
        "macros": { "proteinas_g": 25, "carboidratos_g": 20, "gorduras_g": 15, "calorias": 315 }
      },
      {
        "descricao": "Whey com leite e pasta de amendoim",
        "alimentos": ["1 scoop whey", "200ml leite", "15g pasta de amendoim"],
        "macros": { "proteinas_g": 30, "carboidratos_g": 12, "gorduras_g": 14, "calorias": 294 }
      }
    ]
  },
  "estrategia_anti_compulsao": {
    "titulo": "Controle da Fome Noturna",
    "orientacoes": [
      "A refeição pré-sono é OBRIGATÓRIA - não pule",
      "Priorize proteína de digestão lenta (caseína, ovos, iogurte)",
      "Evite açúcar isolado à noite - causa pico de insulina e mais fome",
      "Se sentir fome extra, beba água ou chá sem açúcar",
      "Mantenha regularidade de horários para estabilizar o apetite"
    ]
  },
  "lista_compras_semanal": {
    "proteinas": [
      { "nome": "Peito de frango", "quantidade_semanal": "1400g" },
      { "nome": "Ovos", "quantidade_semanal": "28 unidades" }
    ],
    "carboidratos": [
      { "nome": "Arroz integral", "quantidade_semanal": "1400g" }
    ],
    "gorduras": [
      { "nome": "Pasta de amendoim", "quantidade_semanal": "200g" }
    ],
    "frutas": [
      { "nome": "Banana", "quantidade_semanal": "14 unidades" }
    ],
    "vegetais": [
      { "nome": "Brócolis", "quantidade_semanal": "700g" }
    ],
    "outros": [
      { "nome": "Whey protein", "quantidade_semanal": "210g (7 scoops)" }
    ]
  },
  "substituicoes": [
    {
      "categoria": "Proteínas",
      "equivalencias": [
        {
          "original": "150g peito de frango",
          "substituicoes": ["150g patinho", "180g tilápia", "4 ovos inteiros", "1.5 scoop whey"]
        }
      ]
    },
    {
      "categoria": "Carboidratos",
      "equivalencias": [
        {
          "original": "200g arroz cozido",
          "substituicoes": ["250g batata cozida", "120g macarrão cozido", "80g aveia", "2 fatias pão integral"]
        }
      ]
    },
    {
      "categoria": "Gorduras",
      "equivalencias": [
        {
          "original": "10ml azeite",
          "substituicoes": ["15g pasta de amendoim", "15g castanhas", "1 gema adicional"]
        }
      ]
    }
  ],
  "suplementacao": [
    { "nome": "Whey Protein", "quantidade": "1 scoop (30g)", "quando": "Pós-treino ou pré-sono", "obrigatorio": false }
  ],
  "dicas_praticas": [
    "Prepare proteínas da semana no domingo",
    "Tenha vegetais lavados e cortados na geladeira"
  ],
  "proxima_avaliacao": "Enviar fotos e feedback após semana ${weeksPerCycle}"
}`;
}

export function getNutricaoUserPrompt(
  userContext: Record<string, unknown>,
  planType: string,
  durationWeeks: number,
  weeksPerCycle: number,
  adjustments?: string
): string {
  const schedule = buildMealSchedule(
    (userContext.horario_acorda as string) || "06:00",
    (userContext.horario_treino as string) || "18:00",
    (userContext.horario_dorme as string) || "22:00",
    parseInt((userContext.refeicoes_por_dia as string) || "5", 10)
  );
  
  const scheduleText = schedule.map(r => `- ${r.nome}: ${r.horario} (${r.tipo})`).join("\n");
  
  // Extract key profile data for better prompting
  const peso = userContext.weight || "não informado";
  const altura = userContext.height || "não informado";
  const idade = userContext.age || userContext.data_nascimento || "não informado";
  const sexo = userContext.sexo || "não informado";
  const restricoes = userContext.restricoes_alimentares || "nenhuma";
  const condicoes = userContext.condicoes_saude || "nenhuma";
  const medicamentos = userContext.toma_medicamentos ? "Sim" : "Não";
  const objetivo = userContext.objetivo_principal || userContext.goals || "não informado";
  const nivelEstresse = userContext.nivel_estresse || "não informado";

  return `Crie um plano nutricional COMPLETO e QUANTIFICADO para este cliente:

### DADOS DO CLIENTE ###
- Peso: ${peso} kg
- Altura: ${altura} cm
- Idade: ${idade}
- Sexo: ${sexo}
- Objetivo: ${objetivo}
- Restrições alimentares: ${restricoes}
- Condições de saúde: ${condicoes}
- Medicamentos: ${medicamentos}
- Nível de estresse: ${nivelEstresse}
- Refeições por dia: ${userContext.refeicoes_por_dia || 5}

### DADOS COMPLETOS ###
${JSON.stringify(userContext, null, 2)}

### PLANO ###
Tipo: ${planType || 'mensal'} (${durationWeeks} semanas)

### HORÁRIOS FIXOS DAS REFEIÇÕES (NÃO ALTERAR) ###
${scheduleText}

⚠️ CRÍTICO: USE EXATAMENTE ESTES HORÁRIOS LISTADOS ACIMA.
A refeição pré-sono DEVE estar na última posição.

### CÁLCULOS OBRIGATÓRIOS ###
1. Calcule TMB (Harris-Benedict ou Mifflin-St Jeor)
2. Aplique fator de atividade (1.4-1.7 conforme treino)
3. Aplique déficit/superávit conforme objetivo
4. Calcule proteína: 1.6-2.2g/kg
5. Distribua carboidratos: 40-55% das calorias restantes
6. Distribua gordura: restante
7. Calcule água: 35-45ml/kg (mostrar cálculo)
8. Distribua macros por refeição (cada refeição PRECISA ter macros)

### OBRIGATÓRIO GERAR ###
- macros_diarios com TODOS os campos numéricos
- plano_dia_treino com refeições + macros por refeição
- plano_dia_descanso com carboidratos reduzidos 15-30%
- refeicao_pre_sono com 3 opções e macros
- estrategia_anti_compulsao
- hidratacao com litros_dia, calculo e distribuicao
- lista_compras_semanal por categorias com quantidades (diário × 7)
- substituicoes por categoria com equivalências numéricas

### PERSONALIZAÇÃO ###
- NÃO inclua alimentos que o cliente NÃO pode comer (${restricoes})
- Adapte para condições de saúde (${condicoes})
- Substitutos NÃO devem conter alimentos restritos
- Use alimentos acessíveis e práticos para o dia a dia brasileiro

${adjustments ? `### AJUSTES SOLICITADOS ###\n${adjustments}` : ""}`;
}
