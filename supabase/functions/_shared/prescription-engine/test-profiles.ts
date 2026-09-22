// ============================================================================
// Perfis sintéticos para validar o motor sem tocar em dados reais.
// Usados pela simulação no admin e pelos testes automatizados.
// ============================================================================
import { EMPTY_OVERRIDES } from "./types.ts";
import type { EngineInputs, MuscleKey, MusclePriority } from "./types.ts";

export interface TestProfile {
  key: string;
  label: string;
  description: string;
  over: Partial<EngineInputs>;
}

export const TEST_PROFILES: TestProfile[] = [
  {
    key: "iniciante_3x_baixa_recuperacao",
    label: "Iniciante 3x/semana, recuperação baixa",
    description: "Sem histórico, sono e energia ruins. Espera-se dose conservadora.",
    over: {
      level: "iniciante",
      weeklyFrequency: 3,
      sessionMinutes: 50,
      adherencePct: null,
      sessionsLast4Weeks: 0,
      progressionSignal: "desconhecido",
      readiness: { score: 35, confidence: "media", signals: [], missing: [] },
    },
  },
  {
    key: "intermediario_4x_boa_recuperacao",
    label: "Intermediário 4x/semana, recuperação boa",
    description: "Aderência alta e carga subindo. Dose de manutenção/progressão moderada.",
    over: {
      level: "intermediario",
      weeklyFrequency: 4,
      sessionMinutes: 60,
      adherencePct: 90,
      sessionsLast4Weeks: 15,
      progressionSignal: "melhorando",
      readiness: { score: 80, confidence: "alta", signals: [], missing: [] },
    },
  },
  {
    key: "avancado_5x_dorsal_prioridade",
    label: "Avançado 5x/semana, costas prioridade",
    description: "Foco em costas sem inflar o volume total do programa.",
    over: {
      level: "avancado",
      weeklyFrequency: 5,
      sessionMinutes: 75,
      adherencePct: 95,
      sessionsLast4Weeks: 19,
      progressionSignal: "estavel",
      priorities: { costas: "alta", panturrilhas: "manutencao" } as Partial<Record<MuscleKey, MusclePriority>>,
      readiness: { score: 82, confidence: "alta", signals: [], missing: [] },
    },
  },
  {
    key: "alto_volume_performance_caindo",
    label: "Alto volume com performance caindo",
    description: "Volume alto tolerado, mas carga em queda e recuperação ruim: descarga.",
    over: {
      level: "avancado",
      weeklyFrequency: 5,
      sessionMinutes: 70,
      adherencePct: 92,
      sessionsLast4Weeks: 18,
      progressionSignal: "piorando",
      previousWeeklyVolume: { peito: 18, costas: 20, quadriceps: 18 },
      previousPlannedVolume: { peito: 18, costas: 20, quadriceps: 18 },
      readiness: { score: 36, confidence: "alta", signals: [], missing: [] },
      effort: { avgRir: 0.4, setsWithRir: 40, totalSets: 48, coveragePct: 83, reading: "muito_alto" },
    },
  },
  {
    key: "baixa_aderencia",
    label: "Baixa aderência",
    description: "Falta aos treinos: sem aumento de volume, foco em executar o que está prescrito.",
    over: {
      level: "intermediario",
      weeklyFrequency: 4,
      sessionMinutes: 60,
      adherencePct: 35,
      sessionsLast4Weeks: 5,
      progressionSignal: "estavel",
      previousWeeklyVolume: { peito: 10, costas: 12 },
      previousPlannedVolume: { peito: 12, costas: 14 },
      readiness: { score: 60, confidence: "media", signals: [], missing: [] },
    },
  },
  {
    key: "pouco_tempo_por_sessao",
    label: "Pouco tempo por sessão",
    description: "Treinos de 30 minutos: capacidade semanal limita o volume total.",
    over: {
      level: "intermediario",
      weeklyFrequency: 3,
      sessionMinutes: 30,
      adherencePct: 80,
      sessionsLast4Weeks: 10,
      progressionSignal: "estavel",
      readiness: { score: 70, confidence: "media", signals: [], missing: [] },
    },
  },
];

/** Entradas completas do motor a partir de um perfil sintético. */
export function buildTestInputs(profile: TestProfile): EngineInputs {
  const base: EngineInputs = {
    age: 32,
    sex: null,
    weightKg: 80,
    heightCm: 178,
    level: "intermediario",
    objective: "hipertrofia",
    secondaryObjectives: [],
    trainingLocation: "academia",
    equipment: ["Máquinas", "Pesos livres"],
    preferences: null,
    weeklyFrequency: 4,
    sessionMinutes: 60,
    availableDays: [],
    allowsConsecutiveDays: null,
    maxConsecutiveSessions: null,
    injuries: null,
    medicalRestrictions: null,
    painReports: [],
    priorities: {},
    previousWeeklyVolume: {},
    previousPlannedVolume: {},
    adherencePct: 85,
    sessionsLast4Weeks: 14,
    progressionSignal: "estavel",
    lastDeloadWeeksAgo: null,
    readiness: { score: 70, confidence: "media", signals: [], missing: [] },
    effort: { avgRir: null, setsWithRir: 0, totalSets: 0, coveragePct: 0, reading: "desconhecido" },
    structured: {
      weeklyFrequency: true,
      sessionMinutes: true,
      availableDays: false,
      priorities: true,
      equipment: true,
      consecutiveDays: false,
    },
    trainerDirectives: null,
    manualProtocol: false,
    overrides: structuredClone(EMPTY_OVERRIDES),
  };
  return { ...base, ...profile.over };
}
