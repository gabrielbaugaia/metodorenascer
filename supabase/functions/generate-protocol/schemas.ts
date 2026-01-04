// ============================================================================
// SCHEMAS DE VALIDAÇÃO - PROTOCOLOS MÉTODO RENASCER
// ============================================================================
// Validação estrutural dos JSONs gerados pela IA para garantir consistência

// Exercício individual
export interface ExercicioSchema {
  nome: string;
  series: number;
  repeticoes: string;
  descanso: string;
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

// Protocolo de Treino completo
export interface TreinoProtocolSchema {
  titulo: string;
  duracao_semanas: number;
  ciclo_atual: number;
  total_ciclos: number;
  nivel: "iniciante" | "intermediario" | "avancado";
  objetivo: "emagrecimento" | "hipertrofia";
  local_treino: "casa" | "musculacao";
  frequencia_semanal: number;
  volume_semanal_por_grupo?: string;
  observacao_ajustes?: string;
  aquecimento?: string;
  alongamento?: string;
  semanas: SemanaSchema[];
  observacoes_gerais?: string;
  proxima_avaliacao?: string;
}

// Refeição
export interface RefeicaoSchema {
  nome: string;
  horario: string;
  alimentos: string[];
  calorias_aproximadas?: number;
  macros_refeicao?: {
    proteinas: string;
    carboidratos: string;
    gorduras: string;
  };
  substituicoes?: string[];
}

// Protocolo de Nutrição completo
export interface NutricaoProtocolSchema {
  titulo: string;
  duracao_semanas: number;
  ciclo_atual?: number;
  nivel: "iniciante" | "intermediario" | "avancado";
  objetivo: "emagrecimento" | "hipertrofia";
  observacao_ajustes?: string;
  calorias_diarias: number;
  deficit_ou_superavit?: string;
  macros: {
    proteinas_g: number;
    proteinas_por_kg?: string;
    carboidratos_g: number;
    gorduras_g: number;
  };
  distribuicao_proteina?: string;
  refeicoes: RefeicaoSchema[];
  hidratacao?: {
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
  lista_compras_semanal?: string[];
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

// Validação simples sem dependência externa
export function validateTreinoProtocol(data: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const protocol = data as Record<string, unknown>;

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
  if (!protocol.semanas || !Array.isArray(protocol.semanas) || protocol.semanas.length === 0) {
    errors.push("semanas é obrigatório e deve ter ao menos uma semana");
  } else {
    (protocol.semanas as Array<Record<string, unknown>>).forEach((semana, sIndex) => {
      if (!semana.dias || !Array.isArray(semana.dias)) {
        errors.push(`semana ${sIndex + 1}: dias é obrigatório`);
      } else {
        (semana.dias as Array<Record<string, unknown>>).forEach((dia, dIndex) => {
          if (!dia.exercicios || !Array.isArray(dia.exercicios)) {
            errors.push(`semana ${sIndex + 1}, dia ${dIndex + 1}: exercicios é obrigatório`);
          } else {
            (dia.exercicios as Array<Record<string, unknown>>).forEach((ex, eIndex) => {
              if (!ex.nome) errors.push(`semana ${sIndex + 1}, dia ${dIndex + 1}, exercício ${eIndex + 1}: nome é obrigatório`);
              if (typeof ex.series !== "number") errors.push(`semana ${sIndex + 1}, dia ${dIndex + 1}, exercício ${eIndex + 1}: series deve ser número`);
            });
          }
          // Validar duracao_minutos como número
          if (dia.duracao_minutos !== undefined && typeof dia.duracao_minutos !== "number") {
            // Tentar converter de string
            const parsed = parseInt(String(dia.duracao_minutos));
            if (isNaN(parsed)) {
              errors.push(`semana ${sIndex + 1}, dia ${dIndex + 1}: duracao_minutos deve ser número`);
            }
          }
        });
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

export function validateNutricaoProtocol(data: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const protocol = data as Record<string, unknown>;

  if (!protocol.titulo || typeof protocol.titulo !== "string") {
    errors.push("titulo é obrigatório e deve ser string");
  }
  if (!protocol.calorias_diarias || typeof protocol.calorias_diarias !== "number") {
    errors.push("calorias_diarias é obrigatório e deve ser número");
  }
  if (!protocol.macros || typeof protocol.macros !== "object") {
    errors.push("macros é obrigatório");
  } else {
    const macros = protocol.macros as Record<string, unknown>;
    if (typeof macros.proteinas_g !== "number") errors.push("macros.proteinas_g deve ser número");
    if (typeof macros.carboidratos_g !== "number") errors.push("macros.carboidratos_g deve ser número");
    if (typeof macros.gorduras_g !== "number") errors.push("macros.gorduras_g deve ser número");
  }
  if (!protocol.refeicoes || !Array.isArray(protocol.refeicoes) || protocol.refeicoes.length === 0) {
    errors.push("refeicoes é obrigatório e deve ter ao menos uma refeição");
  } else {
    (protocol.refeicoes as Array<Record<string, unknown>>).forEach((refeicao, index) => {
      if (!refeicao.nome) errors.push(`refeição ${index + 1}: nome é obrigatório`);
      if (!refeicao.alimentos || !Array.isArray(refeicao.alimentos)) {
        errors.push(`refeição ${index + 1}: alimentos é obrigatório`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

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

// Normalizar duracao_minutos para número
export function normalizeTreinoProtocol(data: Record<string, unknown>): void {
  if (data.semanas && Array.isArray(data.semanas)) {
    (data.semanas as Array<Record<string, unknown>>).forEach((semana) => {
      if (semana.dias && Array.isArray(semana.dias)) {
        (semana.dias as Array<Record<string, unknown>>).forEach((dia) => {
          if (dia.duracao_minutos !== undefined && typeof dia.duracao_minutos !== "number") {
            const parsed = parseInt(String(dia.duracao_minutos).replace(/\D/g, ""));
            dia.duracao_minutos = isNaN(parsed) ? 45 : parsed;
          }
          if (dia.duracao_minutos === undefined) {
            dia.duracao_minutos = 45;
          }
        });
      }
    });
  }
}
