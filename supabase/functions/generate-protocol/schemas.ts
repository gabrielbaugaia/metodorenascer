// ============================================================================
// SCHEMAS DE VALIDAÇÃO - PROTOCOLOS MÉTODO RENASCER
// ============================================================================

// Exercício individual
export interface ExercicioSchema {
  nome: string;
  series: number;
  repeticoes: string;
  descanso: string;
  carga_inicial?: string;
  instrucao_tecnica?: string;
  video_url?: string;
  dicas?: string;
}

// Dia de treino
export interface DiaSchema {
  dia: string;
  foco: string;
  duracao_minutos: number;
  exercicios: ExercicioSchema[];
}

// Semana de treino
export interface SemanaSchema {
  semana: number;
  ciclo: number;
  bloqueada: boolean;
  foco_da_semana?: string;
  dias: DiaSchema[];
  progressao?: string;
}

// Treino individual por letra (A, B, C, D) - formato novo
export interface TreinoDivisaoSchema {
  letra: string;
  foco: string;
  duracao_minutos: number;
  exercicios: ExercicioSchema[];
}

// Treino individual (formato legado antigo)
export interface TreinoLegadoSchema {
  nome: string;
  duracao_minutos: number;
  calorias_estimadas?: number;
  exercicios: ExercicioSchema[];
}

// Protocolo de Treino completo
export interface TreinoProtocolSchema {
  titulo: string;
  duracao_semanas: number;
  ciclo_atual?: number;
  total_ciclos?: number;
  nivel: "iniciante" | "intermediario" | "avancado";
  objetivo: "emagrecimento" | "hipertrofia";
  local_treino: "casa" | "musculacao" | "academia";
  frequencia_semanal: number;
  volume_semanal_por_grupo?: string;
  observacao_ajustes?: string;
  aquecimento?: string;
  alongamento?: string;
  treinos?: TreinoDivisaoSchema[];
  semanas?: SemanaSchema[];
  observacoes_gerais?: string;
  proxima_avaliacao?: string;
  // 5 itens obrigatórios
  estrutura_semanal?: Record<string, string>;
  volume_semanal_detalhado?: Record<string, number>;
  progressao_4_semanas?: Array<{ semana: number; foco: string; instrucao: string }>;
  justificativa?: { volume: string; divisao: string; progressao: string };
}

// ============================================================================
// NUTRIÇÃO - SCHEMAS EXPANDIDOS
// ============================================================================

// Macros por refeição (obrigatório)
export interface MacrosRefeicao {
  proteinas_g: number;
  carboidratos_g: number;
  gorduras_g: number;
  calorias: number;
}

// Refeição expandida com macros obrigatórios
export interface RefeicaoSchema {
  nome: string;
  horario: string;
  tipo?: string; // pre_treino, pos_treino, pre_sono, etc.
  alimentos: string[];
  macros_refeicao: MacrosRefeicao;
  calorias_aproximadas?: number;
  substituicoes?: string[];
}

// Opção pré-sono com macros
export interface OpcaoPreSono {
  descricao: string;
  alimentos: string[];
  macros: MacrosRefeicao;
}

// Item da lista de compras
export interface ItemCompras {
  nome: string;
  quantidade_semanal: string;
}

// Categoria de substituição
export interface SubstituicaoCategoria {
  categoria: string;
  equivalencias: Array<{
    original: string;
    substituicoes: string[];
  }>;
}

// Macros diários completos
export interface MacrosDiarios {
  calorias: number;
  proteina_g: number;
  carboidrato_g: number;
  gordura_g: number;
  agua_litros: number;
}

// Protocolo de Nutrição completo EXPANDIDO
export interface NutricaoProtocolSchema {
  titulo: string;
  duracao_semanas: number;
  ciclo_atual?: number;
  nivel: "iniciante" | "intermediario" | "avancado";
  objetivo: "emagrecimento" | "hipertrofia";
  observacao_ajustes?: string;
  
  // Macros diários obrigatórios (novo formato)
  macros_diarios: MacrosDiarios;
  deficit_ou_superavit?: string;
  
  // Compatibilidade com formato antigo
  calorias_diarias?: number;
  macros?: {
    proteinas_g: number;
    proteinas_por_kg?: string;
    carboidratos_g: number;
    gorduras_g: number;
  };
  
  // Hidratação obrigatória
  hidratacao: {
    litros_dia: number;
    calculo: string; // "40ml x 75kg = 3.0L"
    distribuicao: string[]; // ["500ml ao acordar", "500ml manhã", ...]
  };
  
  // Planos diferenciados (novo - obrigatório)
  plano_dia_treino: {
    calorias_totais: number;
    refeicoes: RefeicaoSchema[];
  };
  plano_dia_descanso: {
    calorias_totais: number;
    nota_ajuste: string; // "Carboidratos reduzidos em 20%"
    refeicoes: RefeicaoSchema[];
  };
  
  // Refeição pré-sono obrigatória
  refeicao_pre_sono: {
    explicacao: string;
    opcoes: OpcaoPreSono[];
  };
  
  // Estratégia anti-compulsão
  estrategia_anti_compulsao: {
    titulo: string;
    orientacoes: string[];
  };
  
  // Lista de compras semanal
  lista_compras_semanal: {
    proteinas: ItemCompras[];
    carboidratos: ItemCompras[];
    gorduras: ItemCompras[];
    frutas: ItemCompras[];
    vegetais: ItemCompras[];
    outros: ItemCompras[];
  };
  
  // Substituições equivalentes
  substituicoes: SubstituicaoCategoria[];
  
  // Campos legados mantidos para compatibilidade
  distribuicao_proteina?: string;
  refeicoes?: RefeicaoSchema[];
  hidratacao_legacy?: {
    quantidade: string;
    dicas: string[];
  };
  suplementacao?: Array<{
    nome: string;
    quantidade: string;
    quando: string;
    obrigatorio: boolean;
  }>;
  dicas_praticas?: string[];
  lista_compras_semanal_legacy?: string[];
  proxima_avaliacao?: string;
}

// Prática de rotina
export interface PraticaSchema {
  nome: string;
  duracao?: string;
  descricao?: string;
  por_que?: string;
}

// Crença limitante
export interface CrencaSchema {
  crenca_original: string;
  reformulacao: string;
  acao_pratica: string;
  gatilho_identificado?: string;
}

// Afirmação
export interface AfirmacaoSchema {
  afirmacao: string;
  comportamento_alvo?: string;
  quando_usar?: string;
}

// Tarefa semanal
export interface TarefaSchema {
  tarefa: string;
  tipo: string;
  meta_numerica?: number;
  como_medir?: string;
}

// Protocolo de Mindset completo
export interface MindsetProtocolSchema {
  titulo: string;
  duracao_semanas: number;
  nivel: "iniciante" | "intermediario" | "avancado";
  objetivo: "emagrecimento" | "hipertrofia";
  mentalidade_necessaria: {
    titulo: string;
    descricao: string;
    foco_do_ciclo?: string;
    comportamento_chave?: string;
  };
  rotina_manha: {
    duracao_total: string;
    praticas: PraticaSchema[];
  };
  rotina_noite: {
    duracao_total: string;
    praticas: PraticaSchema[];
  };
  crencas_limitantes: CrencaSchema[];
  afirmacoes_personalizadas: (string | AfirmacaoSchema)[];
  tarefas_semanais?: TarefaSchema[];
  reflexao_semanal?: {
    pergunta: string;
    quando: string;
    objetivo: string;
  };
  proxima_avaliacao?: string;
}

// ============================================================================
// VALIDAÇÃO DE TREINO
// ============================================================================

export interface TreinoValidationResult {
  valid: boolean;
  errors: string[];
  criteria: {
    estrutura_semanal: boolean;
    exercicios_completos: boolean;
    volume_semanal_detalhado: boolean;
    progressao_4_semanas: boolean;
    justificativa: boolean;
  };
  failedCriteria: string[];
}

export function validateTreinoProtocol(data: unknown): TreinoValidationResult {
  const errors: string[] = [];
  const protocol = data as Record<string, unknown>;

  const criteria = {
    estrutura_semanal: false,
    exercicios_completos: false,
    volume_semanal_detalhado: false,
    progressao_4_semanas: false,
    justificativa: false,
  };

  if (!protocol.titulo || typeof protocol.titulo !== "string") {
    errors.push("titulo é obrigatório e deve ser string");
  }
  if (!protocol.duracao_semanas || typeof protocol.duracao_semanas !== "number") {
    errors.push("duracao_semanas é obrigatório e deve ser número");
  }
  if (!protocol.nivel || !["iniciante", "intermediario", "avancado"].includes(protocol.nivel as string)) {
    errors.push("nivel deve ser iniciante, intermediario ou avancado");
  }
  if (!protocol.objetivo || !["emagrecimento", "hipertrofia"].includes(protocol.objetivo as string)) {
    errors.push("objetivo deve ser emagrecimento ou hipertrofia");
  }

  const hasTreinos = protocol.treinos && Array.isArray(protocol.treinos) && protocol.treinos.length > 0;
  const hasSemanas = protocol.semanas && Array.isArray(protocol.semanas) && protocol.semanas.length > 0;

  if (!hasTreinos && !hasSemanas) {
    errors.push("treinos ou semanas é obrigatório e deve ter ao menos um item");
  }

  // ITEM 1: Estrutura semanal
  const estrutura = protocol.estrutura_semanal as Record<string, string> | undefined;
  if (estrutura && typeof estrutura === "object" && !Array.isArray(estrutura)) {
    const dias = Object.keys(estrutura);
    if (dias.length >= 5) {
      criteria.estrutura_semanal = true;
    }
  }
  if (!criteria.estrutura_semanal) errors.push("estrutura_semanal é obrigatório (mapeamento de dias da semana para treinos)");

  // ITEM 2: Exercícios com estrutura completa (carga_inicial + instrucao_tecnica)
  let totalExercicios = 0;
  let exerciciosCompletos = 0;
  
  if (hasTreinos) {
    (protocol.treinos as Array<Record<string, unknown>>).forEach((treino, tIndex) => {
      if (!treino.letra && !treino.nome && !treino.foco) {
        errors.push(`treino ${tIndex + 1}: letra ou foco é obrigatório`);
      }
      if (!treino.exercicios || !Array.isArray(treino.exercicios)) {
        errors.push(`treino ${tIndex + 1}: exercicios é obrigatório`);
      } else {
        (treino.exercicios as Array<Record<string, unknown>>).forEach((ex, eIndex) => {
          totalExercicios++;
          if (!ex.nome) errors.push(`treino ${tIndex + 1}, exercício ${eIndex + 1}: nome é obrigatório`);
          if (typeof ex.series !== "number") errors.push(`treino ${tIndex + 1}, exercício ${eIndex + 1}: series deve ser número`);
          
          const hasCarga = !!ex.carga_inicial;
          const hasInstrucao = !!ex.instrucao_tecnica;
          if (hasCarga && hasInstrucao && ex.nome && typeof ex.series === "number") {
            exerciciosCompletos++;
          }
        });
      }
      if (treino.duracao_minutos !== undefined && typeof treino.duracao_minutos !== "number") {
        const parsed = parseInt(String(treino.duracao_minutos));
        if (isNaN(parsed)) {
          errors.push(`treino ${tIndex + 1}: duracao_minutos deve ser número`);
        }
      }
    });
  }

  if (hasSemanas && !hasTreinos) {
    (protocol.semanas as Array<Record<string, unknown>>).forEach((semana, sIndex) => {
      if (!semana.dias || !Array.isArray(semana.dias)) {
        errors.push(`semana ${sIndex + 1}: dias é obrigatório`);
      } else {
        (semana.dias as Array<Record<string, unknown>>).forEach((dia, dIndex) => {
          if (!dia.exercicios || !Array.isArray(dia.exercicios)) {
            errors.push(`semana ${sIndex + 1}, dia ${dIndex + 1}: exercicios é obrigatório`);
          } else {
            (dia.exercicios as Array<Record<string, unknown>>).forEach((ex) => {
              totalExercicios++;
              const hasCarga = !!(ex as Record<string, unknown>).carga_inicial;
              const hasInstrucao = !!(ex as Record<string, unknown>).instrucao_tecnica;
              if (hasCarga && hasInstrucao) exerciciosCompletos++;
            });
            validateExercicios(dia.exercicios as Array<Record<string, unknown>>, errors, `semana ${sIndex + 1}, dia ${dIndex + 1}`);
          }
        });
      }
    });
  }

  if (totalExercicios > 0 && exerciciosCompletos / totalExercicios >= 0.8) {
    criteria.exercicios_completos = true;
  }
  if (!criteria.exercicios_completos) errors.push("exercícios devem ter carga_inicial e instrucao_tecnica (mínimo 80% dos exercícios)");

  // ITEM 3: Volume semanal detalhado
  const volumeDetalhado = protocol.volume_semanal_detalhado as Record<string, number> | undefined;
  if (volumeDetalhado && typeof volumeDetalhado === "object" && !Array.isArray(volumeDetalhado)) {
    const grupos = Object.keys(volumeDetalhado);
    const allNumbers = grupos.every(g => typeof volumeDetalhado[g] === "number");
    if (grupos.length >= 4 && allNumbers) {
      criteria.volume_semanal_detalhado = true;
    }
  }
  if (!criteria.volume_semanal_detalhado) errors.push("volume_semanal_detalhado é obrigatório (séries por grupo muscular como objeto numérico)");

  // ITEM 4: Progressão 4 semanas
  const progressao = protocol.progressao_4_semanas as Array<Record<string, unknown>> | undefined;
  if (Array.isArray(progressao) && progressao.length >= 4) {
    const hasDeload = progressao.some(p => 
      String(p.foco || "").toLowerCase().includes("deload") || 
      String(p.instrucao || "").toLowerCase().includes("deload") ||
      String(p.instrucao || "").toLowerCase().includes("reduzir volume")
    );
    if (hasDeload) {
      criteria.progressao_4_semanas = true;
    }
  }
  if (!criteria.progressao_4_semanas) errors.push("progressao_4_semanas é obrigatório (4 semanas com DELOAD na semana 4)");

  // ITEM 5: Justificativa
  const justificativa = protocol.justificativa as Record<string, string> | undefined;
  if (justificativa && typeof justificativa === "object") {
    if (justificativa.volume && justificativa.divisao && justificativa.progressao) {
      criteria.justificativa = true;
    }
  }
  if (!criteria.justificativa) errors.push("justificativa é obrigatório (volume, divisao, progressao)");

  const failedCriteria = Object.entries(criteria)
    .filter(([_, v]) => !v)
    .map(([k]) => k);

  return { valid: failedCriteria.length === 0, errors, criteria, failedCriteria };
}

function validateExercicios(exercicios: Array<Record<string, unknown>>, errors: string[], context: string): void {
  exercicios.forEach((ex, eIndex) => {
    if (!ex.nome) errors.push(`${context}, exercício ${eIndex + 1}: nome é obrigatório`);
    if (typeof ex.series !== "number") errors.push(`${context}, exercício ${eIndex + 1}: series deve ser número`);
  });
}

// ============================================================================
// VALIDAÇÃO DE NUTRIÇÃO EXPANDIDA
// ============================================================================

export interface NutricaoValidationResult {
  valid: boolean;
  errors: string[];
  criteria: {
    macros_diarios: boolean;
    macros_por_refeicao: boolean;
    pre_treino_presente: boolean;
    pos_treino_presente: boolean;
    pre_sono_presente: boolean;
    hidratacao_definida: boolean;
    dia_treino_vs_descanso: boolean;
    lista_compras_gerada: boolean;
    substituicoes_geradas: boolean;
  };
  failedCriteria: string[];
}

export function validateNutricaoProtocol(data: unknown): NutricaoValidationResult {
  const errors: string[] = [];
  const protocol = data as Record<string, unknown>;
  
  const criteria = {
    macros_diarios: false,
    macros_por_refeicao: false,
    pre_treino_presente: false,
    pos_treino_presente: false,
    pre_sono_presente: false,
    hidratacao_definida: false,
    dia_treino_vs_descanso: false,
    lista_compras_gerada: false,
    substituicoes_geradas: false,
  };

  if (!protocol.titulo || typeof protocol.titulo !== "string") {
    errors.push("titulo é obrigatório e deve ser string");
  }

  // 1. Macros diários definidos
  const macrosDiarios = protocol.macros_diarios as Record<string, unknown> | undefined;
  if (macrosDiarios && typeof macrosDiarios === "object") {
    if (typeof macrosDiarios.calorias === "number" && 
        typeof macrosDiarios.proteina_g === "number" &&
        typeof macrosDiarios.carboidrato_g === "number" && 
        typeof macrosDiarios.gordura_g === "number") {
      criteria.macros_diarios = true;
    }
  }
  // Fallback: check legacy macros field
  if (!criteria.macros_diarios) {
    const macros = protocol.macros as Record<string, unknown> | undefined;
    const cal = protocol.calorias_diarias;
    if (macros && typeof cal === "number" && typeof macros.proteinas_g === "number") {
      criteria.macros_diarios = true;
    }
  }
  if (!criteria.macros_diarios) errors.push("macros_diarios é obrigatório com calorias, proteina_g, carboidrato_g, gordura_g");

  // 2-4. Check plano_dia_treino and its meals
  const planoDiaTreino = protocol.plano_dia_treino as Record<string, unknown> | undefined;
  const planoDiaDescanso = protocol.plano_dia_descanso as Record<string, unknown> | undefined;

  if (planoDiaTreino && Array.isArray(planoDiaTreino.refeicoes)) {
    const refeicoes = planoDiaTreino.refeicoes as Array<Record<string, unknown>>;
    
    // Check macros por refeição
    const allHaveMacros = refeicoes.every(r => {
      const m = r.macros_refeicao as Record<string, unknown> | undefined;
      return m && typeof m.proteinas_g === "number";
    });
    if (allHaveMacros && refeicoes.length > 0) criteria.macros_por_refeicao = true;
    
    // Check pre/pos treino
    criteria.pre_treino_presente = refeicoes.some(r => 
      (r.tipo as string)?.includes("pre_treino") || 
      (r.nome as string)?.toLowerCase().includes("pré-treino") ||
      (r.nome as string)?.toLowerCase().includes("pre-treino") ||
      (r.nome as string)?.toLowerCase().includes("pré treino")
    );
    criteria.pos_treino_presente = refeicoes.some(r => 
      (r.tipo as string)?.includes("pos_treino") || 
      (r.nome as string)?.toLowerCase().includes("pós-treino") ||
      (r.nome as string)?.toLowerCase().includes("pos-treino") ||
      (r.nome as string)?.toLowerCase().includes("pós treino")
    );
  }
  // Fallback: check legacy refeicoes
  if (!criteria.macros_por_refeicao && protocol.refeicoes && Array.isArray(protocol.refeicoes)) {
    const refeicoes = protocol.refeicoes as Array<Record<string, unknown>>;
    if (refeicoes.length > 0) {
      criteria.macros_por_refeicao = refeicoes.every(r => {
        const m = r.macros_refeicao as Record<string, unknown> | undefined;
        return m && (typeof m.proteinas_g === "number" || typeof (m as any).proteinas === "string");
      });
    }
    if (!criteria.pre_treino_presente) {
      criteria.pre_treino_presente = refeicoes.some(r => 
        (r.nome as string)?.toLowerCase().includes("pré-treino") || (r.nome as string)?.toLowerCase().includes("pre-treino")
      );
    }
    if (!criteria.pos_treino_presente) {
      criteria.pos_treino_presente = refeicoes.some(r => 
        (r.nome as string)?.toLowerCase().includes("pós-treino") || (r.nome as string)?.toLowerCase().includes("pos-treino")
      );
    }
  }

  if (!criteria.macros_por_refeicao) errors.push("macros por refeição obrigatórios (proteinas_g, carboidratos_g, gorduras_g, calorias)");
  if (!criteria.pre_treino_presente) errors.push("refeição pré-treino é obrigatória");
  if (!criteria.pos_treino_presente) errors.push("refeição pós-treino é obrigatória");

  // 5. Pre-sono
  const preSono = protocol.refeicao_pre_sono as Record<string, unknown> | undefined;
  if (preSono && Array.isArray(preSono.opcoes) && (preSono.opcoes as unknown[]).length >= 3) {
    criteria.pre_sono_presente = true;
  }
  if (!criteria.pre_sono_presente) errors.push("refeição pré-sono com 3 opções é obrigatória");

  // 6. Hidratação
  const hidratacao = protocol.hidratacao as Record<string, unknown> | undefined;
  if (hidratacao && typeof hidratacao === "object") {
    if (typeof hidratacao.litros_dia === "number" || typeof hidratacao.quantidade === "string") {
      criteria.hidratacao_definida = true;
    }
    if (Array.isArray(hidratacao.distribuicao) && (hidratacao.distribuicao as unknown[]).length >= 3) {
      criteria.hidratacao_definida = true;
    }
  }
  if (!criteria.hidratacao_definida) errors.push("hidratação calculada é obrigatória");

  // 7. Dia treino vs descanso
  if (planoDiaTreino && planoDiaDescanso && 
      Array.isArray(planoDiaTreino.refeicoes) && Array.isArray(planoDiaDescanso.refeicoes) &&
      (planoDiaTreino.refeicoes as unknown[]).length > 0 && (planoDiaDescanso.refeicoes as unknown[]).length > 0) {
    criteria.dia_treino_vs_descanso = true;
  }
  if (!criteria.dia_treino_vs_descanso) errors.push("planos de dia de treino e dia de descanso são obrigatórios");

  // 8. Lista de compras
  const listaCompras = protocol.lista_compras_semanal as Record<string, unknown> | undefined;
  if (listaCompras && typeof listaCompras === "object" && !Array.isArray(listaCompras)) {
    const hasCategories = ["proteinas", "carboidratos", "gorduras"].some(cat => 
      Array.isArray(listaCompras[cat]) && (listaCompras[cat] as unknown[]).length > 0
    );
    if (hasCategories) criteria.lista_compras_gerada = true;
  }
  // Fallback: accept array format
  if (!criteria.lista_compras_gerada && Array.isArray(protocol.lista_compras_semanal) && (protocol.lista_compras_semanal as unknown[]).length > 0) {
    criteria.lista_compras_gerada = true;
  }
  if (!criteria.lista_compras_gerada) errors.push("lista de compras semanal é obrigatória");

  // 9. Substituições
  if (Array.isArray(protocol.substituicoes) && (protocol.substituicoes as unknown[]).length > 0) {
    criteria.substituicoes_geradas = true;
  }
  if (!criteria.substituicoes_geradas) errors.push("substituições equivalentes são obrigatórias");

  const failedCriteria = Object.entries(criteria)
    .filter(([_, v]) => !v)
    .map(([k]) => k);

  return { 
    valid: failedCriteria.length === 0, 
    errors, 
    criteria,
    failedCriteria 
  };
}

// ============================================================================
// VALIDAÇÃO DE MINDSET
// ============================================================================

export function validateMindsetProtocol(data: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const protocol = data as Record<string, unknown>;

  if (!protocol.titulo || typeof protocol.titulo !== "string") {
    errors.push("titulo é obrigatório e deve ser string");
  }
  if (!protocol.mentalidade_necessaria || typeof protocol.mentalidade_necessaria !== "object") {
    errors.push("mentalidade_necessaria é obrigatório");
  } else {
    const mentalidade = protocol.mentalidade_necessaria as Record<string, unknown>;
    if (!mentalidade.titulo) errors.push("mentalidade_necessaria.titulo é obrigatório");
    if (!mentalidade.descricao) errors.push("mentalidade_necessaria.descricao é obrigatório");
  }
  if (!protocol.rotina_manha || typeof protocol.rotina_manha !== "object") {
    errors.push("rotina_manha é obrigatório");
  } else {
    const rotina = protocol.rotina_manha as Record<string, unknown>;
    if (!rotina.praticas || !Array.isArray(rotina.praticas)) {
      errors.push("rotina_manha.praticas é obrigatório");
    }
  }
  if (!protocol.rotina_noite || typeof protocol.rotina_noite !== "object") {
    errors.push("rotina_noite é obrigatório");
  }
  if (!protocol.crencas_limitantes || !Array.isArray(protocol.crencas_limitantes)) {
    errors.push("crencas_limitantes é obrigatório");
  }
  if (!protocol.afirmacoes_personalizadas || !Array.isArray(protocol.afirmacoes_personalizadas)) {
    errors.push("afirmacoes_personalizadas é obrigatório");
  }

  return { valid: errors.length === 0, errors };
}

// ============================================================================
// NORMALIZAÇÃO
// ============================================================================

export function normalizeTreinoProtocol(data: Record<string, unknown>): void {
  if (data.treinos && Array.isArray(data.treinos)) {
    (data.treinos as Array<Record<string, unknown>>).forEach((treino) => {
      normalizeDuracaoMinutos(treino);
      if (treino.exercicios && Array.isArray(treino.exercicios)) {
        (treino.exercicios as Array<Record<string, unknown>>).forEach((ex) => {
          normalizeSeriesField(ex);
        });
      }
    });
  }

  if (data.semanas && Array.isArray(data.semanas)) {
    (data.semanas as Array<Record<string, unknown>>).forEach((semana) => {
      if (semana.dias && Array.isArray(semana.dias)) {
        (semana.dias as Array<Record<string, unknown>>).forEach((dia) => {
          normalizeDuracaoMinutos(dia);
          if (dia.exercicios && Array.isArray(dia.exercicios)) {
            (dia.exercicios as Array<Record<string, unknown>>).forEach((ex) => {
              normalizeSeriesField(ex as Record<string, unknown>);
            });
          }
        });
      }
    });
  }
}

function normalizeDuracaoMinutos(item: Record<string, unknown>): void {
  if (item.duracao_minutos !== undefined && typeof item.duracao_minutos !== "number") {
    const parsed = parseInt(String(item.duracao_minutos).replace(/\D/g, ""));
    item.duracao_minutos = isNaN(parsed) ? 45 : parsed;
  }
  if (item.duracao_minutos === undefined) {
    item.duracao_minutos = 45;
  }
}

function normalizeSeriesField(ex: Record<string, unknown>): void {
  if (ex.series !== undefined && typeof ex.series !== "number") {
    const parsed = parseInt(String(ex.series).replace(/\D/g, ""));
    ex.series = isNaN(parsed) ? 3 : parsed;
  }
}
