import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

// Allowed origins for CORS
const allowedOrigins = [
  "https://lxdosmjenbaugmhyfanx.lovableproject.com",
  "https://metodorenascer.lovable.app",
  "https://renascerapp.com.br",
  "http://localhost:5173",
  "http://localhost:8080",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowedOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

// ============================================================================
// GUIA DE PRESCRIÇÃO – MÉTODO RENASCER (TREINO, DIETA, MINDSET)
// ============================================================================
// 
// REGRAS GERAIS DO MÉTODO RENASCER
// - Base científica: princípios clássicos de treinamento (individualidade, sobrecarga
//   progressiva, continuidade, variabilidade consciente, conscientização), diretrizes
//   ACSM e evidência atual em força/hipertrofia, emagrecimento e mudança de comportamento.
// - Estilo do método: "básico muito bem feito" com exercícios simples, seguros e conhecidos
//   (agachamento, remada, supino, puxada, desenvolvimento, flexões, pranchas, etc.),
//   evitando exercícios mirabolantes ou difíceis de executar.
// - Periodização: ciclos de 4 semanas com progressão leve a moderada de volume/intensidade
//   e checkpoints com fotos/feedback a cada ciclo.
//
// CLASSIFICAÇÃO DE NÍVEIS (baseada na anamnese):
// - Iniciante: nunca treinou ou parado há +6 meses; baixa coordenação e condicionamento
// - Intermediário: treina há 6-24 meses de forma relativamente constante
// - Avançado: +2 anos de treino consistente, boa técnica, já fez programas estruturados
//
// OBJETIVOS E PRIORIDADES:
// 1º Emagrecimento/definição: déficit calórico, aumento de gasto, manutenção de massa magra
// 2º Hipertrofia/saúde: volume adequado de treino resistido, proteína suficiente, recuperação
//
// ============================================================================

// Mapear tipo de plano para duração em semanas
const planDurationWeeks: Record<string, number> = {
  "embaixador": 4,
  "mensal": 4,
  "trimestral": 12,
  "semestral": 24,
  "anual": 48,
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tipo, userContext, userId, adjustments, planType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Determinar duração do protocolo baseado no plano
    const durationWeeks = planDurationWeeks[planType?.toLowerCase()] || 4;
    
    // Calcular quantas semanas liberar (máximo 4 por ciclo)
    const weeksPerCycle = 4;
    const totalCycles = Math.ceil(durationWeeks / weeksPerCycle);

    let systemPrompt = "";
    let userPrompt = "";

    // ============================================================================
    // PROMPT DE TREINO
    // ============================================================================
    // REGRAS APLICADAS:
    // - Frequência: Iniciante 3-4x/sem, Intermediário 4-5x/sem, Avançado 5-6x/sem
    // - Volume por grupo muscular/semana:
    //   * Iniciante: 6-10 séries
    //   * Intermediário: 10-16 séries
    //   * Avançado: 14-20 séries
    // - Repetições:
    //   * Iniciante: 10-15 reps, 2-3 em reserva
    //   * Intermediário: 8-15 reps, alternando força/resistência
    //   * Avançado: 5-12 para principais, 10-20 para acessórios
    // - Métodos:
    //   * Iniciante: séries simples, circuitos simples, poucas superséries
    //   * Intermediário: séries múltiplas, circuito, bi-set, agonista/antagonista
    //   * Avançado: bi-set, tri-set, superséries estratégicas, variação de cadência
    // - Ambiente Casa: peso corporal, elástico, halteres, tempo sob tensão, pausas, circuitos
    // - Ambiente Musculação: básicos em máquinas e livres (agachamento, leg press, supino, etc.)
    // - Para Emagrecimento: volume moderado, grandes grupamentos, componente aeróbio
    // - Para Hipertrofia: progressão sistemática de carga/volume, mobilidade conforme necessidade
    // - Exercícios SEMPRE simples e seguros: agachamento, remada, supino, puxada, desenvolvimento,
    //   flexões, pranchas. JAMAIS exercícios de circo ou mirabolantes.
    // ============================================================================
    if (tipo === "treino") {
      systemPrompt = `Você é um Personal Trainer especializado do Método Renascer. Crie um protocolo de treino COMPLETO e PERSONALIZADO seguindo rigorosamente estas regras:

### PRINCÍPIOS DO MÉTODO RENASCER ###
- "Básico muito bem feito": APENAS exercícios simples, seguros e conhecidos
- Exercícios PERMITIDOS: agachamento, remada, supino, puxada, desenvolvimento, flexões, pranchas, afundos, leg press, terra romeno, rosca, tríceps, elevação lateral, abdominal, prancha
- Exercícios PROIBIDOS: movimentos de circo, instáveis, complexos ou que exijam muita coordenação
- Periodização em ciclos de 4 semanas com progressão leve a moderada

### CLASSIFICAÇÃO POR NÍVEL ###
INICIANTE (nunca treinou ou parado há +6 meses):
- Frequência: 3-4 sessões/semana
- Volume: 6-10 séries por grupo muscular/semana
- Repetições: 10-15 reps, fadiga controlada (2-3 reps em reserva)
- Métodos: séries simples, circuitos simples, poucas superséries
- Foco: aprender técnica, criar hábito, adaptação neural

INTERMEDIÁRIO (6-24 meses de treino constante):
- Frequência: 4-5 sessões/semana
- Volume: 10-16 séries por grupo/semana
- Repetições: 8-15 reps, alternando fases força/resistência
- Métodos: séries múltiplas, circuito, bi-set, agonista/antagonista
- Foco: progressão de carga, variação controlada

AVANÇADO (+2 anos consistentes, boa técnica):
- Frequência: 5-6 sessões/semana (conforme disponibilidade)
- Volume: 14-20 séries por grupo/semana
- Repetições: 5-12 para principais, 10-20 para acessórios
- Métodos: bi-set, tri-set, superséries estratégicas, variação de cadência
- Foco: otimização, periodização avançada

### AMBIENTE DE TREINO ###
CASA (home workout):
- Usar peso corporal, elásticos, halteres simples, móveis estáveis
- Manipular: tempo sob tensão, pausas, amplitude, circuitos/superséries para intensidade

MUSCULAÇÃO:
- Preferir básicos em máquinas e livres
- Técnica simples, evitar variações instáveis

### OBJETIVO ESPECÍFICO ###
EMAGRECIMENTO/DEFINIÇÃO:
- Volume moderado, foco em grandes grupamentos
- Incluir componente aeróbio (caminhada, steps, HIIT leve/moderado)
- Priorizar gasto calórico e manutenção de massa magra

HIPERTROFIA/SAÚDE:
- Progressão sistemática de carga/volume
- Trabalho de mobilidade/postura conforme necessidade

### ESTRUTURA OBRIGATÓRIA ###
Cada sessão deve ter:
1. Aquecimento simples (5-10 min cardio leve + mobilidade articular)
2. Bloco principal (exercícios com séries, reps, descanso, progressão semanal)
3. Finalização opcional (alongamento, aeróbio leve)

O plano deve ter ${durationWeeks} semanas no total, divididas em ciclos de ${weeksPerCycle} semanas.
O aluno envia fotos e feedback a cada ${weeksPerCycle} semanas para ajustes.

RETORNE APENAS JSON VÁLIDO sem markdown, no formato:
{
  "titulo": "Protocolo de Treino Personalizado - Método Renascer",
  "duracao_semanas": ${durationWeeks},
  "ciclo_atual": 1,
  "total_ciclos": ${totalCycles},
  "nivel": "iniciante|intermediario|avancado",
  "objetivo": "emagrecimento|hipertrofia",
  "local_treino": "casa|musculacao",
  "frequencia_semanal": 4,
  "volume_semanal_por_grupo": "X séries",
  "observacao_ajustes": "Este protocolo será ajustado após o envio das fotos e feedback a cada ${weeksPerCycle} semanas. O acompanhamento contínuo garante resultados otimizados.",
  "aquecimento": "5-10 min de cardio leve (caminhada, polichinelos) + mobilidade articular",
  "alongamento": "5-10 min de alongamento estático ao final",
  "semanas": [
    {
      "semana": 1,
      "ciclo": 1,
      "bloqueada": false,
      "foco_da_semana": "Adaptação e aprendizado técnico",
      "dias": [
        {
          "dia": "Segunda-feira",
          "foco": "Peito, Ombro e Tríceps",
          "duracao_minutos": 45,
          "exercicios": [
            {
              "nome": "Supino reto com halteres",
              "series": 3,
              "repeticoes": "12-15",
              "descanso": "60s",
              "video_url": "",
              "dicas": "Mantenha os cotovelos a 45 graus, desça controlado"
            }
          ]
        }
      ],
      "progressao": "Manter cargas leves, foco na técnica"
    }
  ],
  "observacoes_gerais": "Respeite os intervalos de descanso. Hidrate-se bem. Durma 7-8h/noite.",
  "proxima_avaliacao": "Enviar fotos (frente, lado, costas) e feedback após semana 4"
}`;

      userPrompt = `Crie um protocolo de treino PERSONALIZADO para este cliente do Método Renascer:

### DADOS DO CLIENTE ###
${JSON.stringify(userContext, null, 2)}

### PLANO ###
Tipo: ${planType || 'mensal'} (${durationWeeks} semanas)

${adjustments ? `### AJUSTES SOLICITADOS ###\n${adjustments}` : ""}

### INSTRUÇÕES ###
1. Identifique o NÍVEL do cliente (iniciante/intermediário/avançado) com base na anamnese
2. Identifique o OBJETIVO (emagrecimento ou hipertrofia) com base nos dados
3. Identifique o LOCAL DE TREINO (casa ou musculação) com base na anamnese
4. Aplique as regras de volume, frequência e métodos conforme o nível
5. Use APENAS exercícios simples e seguros do Método Renascer
6. Considere lesões, restrições e disponibilidade
7. Gere as primeiras ${weeksPerCycle} semanas detalhadas (próximas liberadas após feedback)
8. Inclua progressão semanal clara (aumento de reps, séries ou carga)`;

    // ============================================================================
    // PROMPT DE NUTRIÇÃO
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
    // ============================================================================
    } else if (tipo === "nutricao") {
      systemPrompt = `Você é um Nutricionista Esportivo do Método Renascer. Crie um plano alimentar COMPLETO e PERSONALIZADO seguindo rigorosamente estas regras:

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
1. Refeições com horários sugeridos
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

      userPrompt = `Crie um plano nutricional PERSONALIZADO para este cliente do Método Renascer:

### DADOS DO CLIENTE ###
${JSON.stringify(userContext, null, 2)}

### PLANO ###
Tipo: ${planType || 'mensal'} (${durationWeeks} semanas)

${adjustments ? `### AJUSTES SOLICITADOS ###\n${adjustments}` : ""}

### INSTRUÇÕES ###
1. Calcule as calorias de manutenção baseado nos dados (peso, altura, idade, sexo, atividade)
2. Aplique déficit ou superávit conforme o OBJETIVO (emagrecimento: -15 a -25%, hipertrofia: +5 a +10%)
3. Calcule proteína entre 1.6-2.2g/kg, distribuída nas refeições
4. Identifique o NÍVEL para ajustar complexidade do plano
5. Considere restrições alimentares e preferências
6. Use linguagem simples e prática
7. Inclua opções de substituição em todas as refeições
8. Foque em alimentos acessíveis e práticos para o dia a dia brasileiro`;

    // ============================================================================
    // PROMPT DE MINDSET
    // ============================================================================
    // REGRAS APLICADAS:
    // - Base: terapia cognitivo-comportamental e psicologia da mudança de hábitos
    // - Elementos: metas específicas, monitoramento, reestruturação de crenças, exposição
    //   gradual, reforço positivo
    // - Foco em aumentar adesão a treino e dieta, NÃO autoajuda vazia
    // - Iniciante: metas pequenas e concretas (3 treinos/sem, 2L água, 10min planejamento)
    //   1-2 tarefas diárias, 1 reflexão semanal
    // - Intermediário: planejamento, auto-monitoramento (humor, energia, fome), revisão
    //   de gatilhos e ambiente, 2-3 tarefas semanais mais densas
    // - Avançado: gestão de stress, sono, períodos de descarga, evitar perfeccionismo,
    //   métricas e revisões quinzenais/mensais
    // - Saída obrigatória:
    //   1. Mentalidade necessária: como pensar/agir nesse ciclo
    //   2. Rotina manhã/noite: 2-4 ações simples alinhadas ao objetivo
    //   3. Crenças limitantes: 2-4 crenças + reformulação + ação prática
    //   4. Afirmações: curtas, concretas, focadas em comportamento ("eu ajo assim")
    // ============================================================================
    } else if (tipo === "mindset") {
      systemPrompt = `Você é um Coach de Mentalidade e Psicologia Esportiva do Método Renascer. Crie um protocolo de mindset COMPLETO e PERSONALIZADO seguindo rigorosamente estas regras:

### PRINCÍPIOS DO MÉTODO RENASCER ###
- Base científica: terapia cognitivo-comportamental (TCC) e psicologia da mudança de hábitos
- Elementos-chave: metas específicas, monitoramento, reestruturação de crenças, exposição gradual, reforço positivo
- Foco: aumentar ADESÃO a treino e dieta (resultados práticos)
- PROIBIDO: autoajuda vazia, frases motivacionais genéricas, promessas mágicas

### ESTRUTURA POR NÍVEL ###
INICIANTE (criar hábito, vencer resistência inicial):
- Metas BEM PEQUENAS e concretas (ex: 3 treinos/semana, 2L água/dia, 10min planejamento)
- 1-2 tarefas diárias simples
- 1 reflexão semanal
- Foco em consistência, não perfeição

INTERMEDIÁRIO (manter consistência, superar platôs):
- Tarefas de planejamento e auto-monitoramento
- Check-in de humor, energia, fome
- Revisão de gatilhos e ambiente
- 2-3 tarefas semanais mais densas
- Foco em identificar padrões e ajustar

AVANÇADO (otimização, alta performance sustentável):
- Gestão de stress e sono
- Períodos de descarga mental
- Evitar perfeccionismo extremo
- Métricas e revisões quinzenais/mensais
- Foco em sustentabilidade de longo prazo

### ESTRUTURA OBRIGATÓRIA DO PROTOCOLO ###

1. MENTALIDADE NECESSÁRIA
- Explicação prática de como a pessoa precisa pensar e agir nesse ciclo
- Ligada diretamente ao objetivo (emagrecimento ou hipertrofia)
- Tom direto, sem floreios

2. ROTINA DA MANHÃ (2-4 ações simples)
- Ações que preparam o dia para o sucesso
- Máximo 10-15 minutos total
- Alinhadas ao nível e objetivo

3. ROTINA DA NOITE (2-4 ações simples)
- Ações que fecham o dia e preparam o próximo
- Máximo 10-15 minutos total
- Foco em recuperação e reflexão

4. CRENÇAS LIMITANTES (2-4 crenças)
- Crenças específicas ligadas a emagrecimento/treino/dieta
- Para cada crença: reformulação cognitiva + ação prática associada
- Baseadas no perfil da anamnese

5. AFIRMAÇÕES PERSONALIZADAS
- Curtas e concretas
- Focadas em COMPORTAMENTO ("eu faço", "eu ajo", "eu escolho")
- SEM promessas mágicas ou frases vazias

6. TAREFAS SEMANAIS RASTREÁVEIS
- Metas específicas e mensuráveis
- Podem ser marcadas como feitas ou não
- Progridem conforme o nível

RETORNE APENAS JSON VÁLIDO sem markdown, no formato:
{
  "titulo": "Protocolo de Mindset - Método Renascer",
  "duracao_semanas": ${durationWeeks},
  "nivel": "iniciante|intermediario|avancado",
  "objetivo": "emagrecimento|hipertrofia",
  "mentalidade_necessaria": {
    "titulo": "Consistência supera intensidade",
    "descricao": "Neste ciclo, seu foco é criar o hábito de treinar e comer bem, não ser perfeito. Dias ruins vão acontecer - o que importa é voltar no dia seguinte.",
    "foco_do_ciclo": "Construir base de hábitos sólidos",
    "comportamento_chave": "Não negociar com você mesmo nos dias difíceis. Fazer o mínimo é melhor que não fazer nada."
  },
  "rotina_manha": {
    "duracao_total": "10 minutos",
    "praticas": [
      {
        "nome": "Copo de água ao acordar",
        "duracao": "1 min",
        "descricao": "Beba 300ml de água antes de qualquer coisa. Reidrata e ativa o metabolismo.",
        "por_que": "Você acorda desidratado. Começar com água é o primeiro hábito vencedor do dia."
      }
    ]
  },
  "rotina_noite": {
    "duracao_total": "10 minutos",
    "praticas": [
      {
        "nome": "Preparar roupa/mochila do treino",
        "duracao": "3 min",
        "descricao": "Deixe tudo pronto para treinar amanhã. Remova obstáculos antes que apareçam.",
        "por_que": "Reduz a chance de desistir por preguiça ou falta de tempo."
      }
    ]
  },
  "crencas_limitantes": [
    {
      "crenca_original": "Não tenho tempo para treinar",
      "reformulacao": "Tenho as mesmas 24 horas que pessoas de sucesso. Minha saúde é prioridade e encontro 30-45 minutos quando decido que é importante.",
      "acao_pratica": "Bloquear o horário de treino no calendário como compromisso inegociável. Tratar como reunião de trabalho.",
      "gatilho_identificado": "Agenda cheia, demandas externas"
    }
  ],
  "afirmacoes_personalizadas": [
    {
      "afirmacao": "Eu escolho me movimentar hoje, mesmo quando não tenho vontade",
      "comportamento_alvo": "Treinar consistentemente",
      "quando_usar": "Antes de sair de casa para treinar ou quando bater preguiça"
    }
  ],
  "tarefas_semanais": [
    {
      "tarefa": "Completar 3 treinos esta semana",
      "tipo": "treino",
      "meta_numerica": 3,
      "como_medir": "Marcar cada treino feito no app"
    },
    {
      "tarefa": "Beber 2L de água por dia",
      "tipo": "habito",
      "meta_numerica": 7,
      "como_medir": "Check diário de hidratação"
    }
  ],
  "reflexao_semanal": {
    "pergunta": "O que funcionou bem esta semana e o que posso ajustar?",
    "quando": "Domingo à noite, 10 minutos",
    "objetivo": "Identificar padrões e fazer micro-ajustes"
  },
  "proxima_avaliacao": "Revisar mindset junto com treino e dieta após semana ${weeksPerCycle}"
}`;

      userPrompt = `Crie um protocolo de mindset PERSONALIZADO para este cliente do Método Renascer:

### DADOS DO CLIENTE ###
${JSON.stringify(userContext, null, 2)}

### PLANO ###
Tipo: ${planType || 'mensal'} (${durationWeeks} semanas)

${adjustments ? `### AJUSTES SOLICITADOS ###\n${adjustments}` : ""}

### INSTRUÇÕES ###
1. Identifique o NÍVEL do cliente com base na experiência de treino e histórico
2. Identifique o OBJETIVO (emagrecimento ou hipertrofia)
3. Analise os dados de estresse, sono, tentativas anteriores
4. Crie crenças limitantes ESPECÍFICAS baseadas no perfil (não genéricas)
5. Tarefas devem ser mensuráveis e rastreáveis
6. Rotinas devem caber na realidade do cliente (tempo, rotina, trabalho)
7. Afirmações focadas em AÇÃO e COMPORTAMENTO, não em sentimentos
8. Tom direto e prático, sem floreios motivacionais vazios
9. Tudo deve reforçar a adesão ao treino e à dieta`;

    } else {
      throw new Error("Tipo de protocolo inválido");
    }

    console.log(`Generating ${tipo} protocol for user ${userId}, plan: ${planType}, weeks: ${durationWeeks}`);

    // Buscar banco de vídeos de exercícios para enriquecer os protocolos de treino
    let exerciseVideos: Record<string, string> = {};
    if (tipo === "treino") {
      const { data: videos } = await supabaseClient
        .from("exercise_videos")
        .select("exercise_name, video_url");
      
      if (videos) {
        videos.forEach((v: { exercise_name: string; video_url: string }) => {
          exerciseVideos[v.exercise_name.toLowerCase()] = v.video_url;
        });
        console.log(`Loaded ${videos.length} exercise videos from database`);
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI error:", response.status, errorText);
      throw new Error("Erro ao gerar protocolo");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("Resposta vazia da IA");
    }

    // Parse JSON from response
    let protocolData;
    try {
      const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
      protocolData = JSON.parse(cleanContent);
    } catch (e) {
      console.error("Failed to parse protocol JSON:", content);
      throw new Error("Erro ao processar protocolo gerado");
    }

    // Enriquecer exercícios com URLs de vídeo do banco de dados
    if (tipo === "treino" && protocolData.semanas && Object.keys(exerciseVideos).length > 0) {
      protocolData.semanas.forEach((semana: any) => {
        if (semana.dias) {
          semana.dias.forEach((dia: any) => {
            if (dia.exercicios) {
              dia.exercicios.forEach((ex: any) => {
                if (ex.nome && !ex.video_url) {
                  // Buscar correspondência exata ou parcial
                  const nomeNormalizado = ex.nome.toLowerCase().trim();
                  
                  // Tentar correspondência exata primeiro
                  if (exerciseVideos[nomeNormalizado]) {
                    ex.video_url = exerciseVideos[nomeNormalizado];
                  } else {
                    // Tentar correspondência parcial
                    for (const [exerciseName, url] of Object.entries(exerciseVideos)) {
                      if (nomeNormalizado.includes(exerciseName) || exerciseName.includes(nomeNormalizado)) {
                        ex.video_url = url;
                        break;
                      }
                    }
                  }
                }
              });
            }
          });
        }
      });
      console.log("Exercise videos enriched from database");
    }

    // Adicionar metadados de controle de ciclos
    protocolData.plan_type = planType || 'mensal';
    protocolData.duracao_semanas = durationWeeks;
    protocolData.semanas_por_ciclo = weeksPerCycle;
    protocolData.ciclo_atual = 1;
    protocolData.total_ciclos = totalCycles;
    protocolData.data_proxima_avaliacao = new Date(Date.now() + weeksPerCycle * 7 * 24 * 60 * 60 * 1000).toISOString();
    protocolData.metodo = "Método Renascer";
    protocolData.versao_guia = "1.0";

    // Save protocol to database
    const { data: savedProtocol, error: saveError } = await supabaseClient
      .from("protocolos")
      .insert({
        user_id: userId,
        tipo: tipo,
        titulo: protocolData.titulo || `Protocolo de ${tipo}`,
        conteudo: protocolData,
        ativo: true,
      })
      .select()
      .single();

    if (saveError) {
      console.error("Error saving protocol:", saveError);
      throw new Error("Erro ao salvar protocolo");
    }

    console.log(`Protocol ${tipo} generated and saved successfully for user ${userId}`);

    return new Response(JSON.stringify({ 
      success: true, 
      protocol: savedProtocol,
      data: protocolData 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Generate protocol error:", error);
    return new Response(JSON.stringify({ error: "Erro ao gerar protocolo. Tente novamente." }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
