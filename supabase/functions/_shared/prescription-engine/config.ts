// ============================================================================
// ENGENHARIA DO MOVIMENTO — PRESCRIPTION ENGINE v1
// Configuração central do motor. NADA de número mágico espalhado pelo código:
// tudo que é regra de dose fica aqui e pode ser sobrescrito pela tabela
// public.prescription_engine_config (mesma forma de objeto, merge raso).
// ============================================================================

import type { ExperienceLevel, MuscleKey, Objective, VolumeRange } from "./types.ts";

export const ENGINE_VERSION = "engenharia-do-movimento-v1.0.0";

export const MUSCLE_LABELS: Record<MuscleKey, string> = {
  peito: "Peitoral",
  costas: "Costas / Dorsais",
  deltoide_anterior: "Deltoide anterior",
  deltoide_lateral: "Deltoide lateral",
  deltoide_posterior: "Deltoide posterior",
  biceps: "Bíceps",
  triceps: "Tríceps",
  quadriceps: "Quadríceps",
  posterior_coxa: "Posteriores de coxa",
  gluteos: "Glúteos",
  panturrilhas: "Panturrilhas",
  abdomen: "Abdômen / Core",
};

/** Séries efetivas por grupo muscular por semana (hipertrofia geral). */
export const VOLUME_RANGES: Record<MuscleKey, VolumeRange> = {
  peito: { min: 8, defaultLow: 10, defaultHigh: 14, max: 18 },
  costas: { min: 10, defaultLow: 12, defaultHigh: 16, max: 20 },
  deltoide_anterior: { min: 4, defaultLow: 4, defaultHigh: 6, max: 10 },
  deltoide_lateral: { min: 8, defaultLow: 10, defaultHigh: 16, max: 18 },
  deltoide_posterior: { min: 6, defaultLow: 8, defaultHigh: 12, max: 16 },
  biceps: { min: 6, defaultLow: 8, defaultHigh: 12, max: 16 },
  triceps: { min: 6, defaultLow: 8, defaultHigh: 12, max: 16 },
  quadriceps: { min: 8, defaultLow: 10, defaultHigh: 14, max: 18 },
  posterior_coxa: { min: 6, defaultLow: 8, defaultHigh: 12, max: 16 },
  gluteos: { min: 8, defaultLow: 10, defaultHigh: 16, max: 20 },
  panturrilhas: { min: 8, defaultLow: 10, defaultHigh: 14, max: 18 },
  abdomen: { min: 6, defaultLow: 8, defaultHigh: 12, max: 16 },
};

export const ENGINE_DEFAULTS = {
  /** Peso de uma série indireta relevante no volume equivalente. */
  indirectSetWeight: 0.5,

  /** Teto prático de séries efetivas do mesmo músculo numa única sessão. */
  maxSetsPerMusclePerSession: 8,
  preferredSetsPerMusclePerSession: 6,

  /** Minutos estimados por série efetiva (execução + descanso). */
  minutesPerSet: 3.4,
  /** Minutos reservados por sessão para aquecimento e finalização. */
  sessionOverheadMinutes: 12,
  minSetsPerSession: 8,
  maxSetsPerSession: 32,

  /** Ancoragem do volume base por nível (posição dentro da faixa). */
  levelAnchor: {
    iniciante: "min",
    intermediario: "between_min_and_default",
    avancado: "default_low",
  } as Record<ExperienceLevel, "min" | "between_min_and_default" | "default_low">,

  /** Ajustes aditivos em séries semanais. */
  priorityAdjust: {
    alta: 3,
    desenvolvimento: 1,
    manutencao: -2,
    reduzir: -4,
  },

  /** Faixas de prontidão (readiness 0–100) e impacto em séries. */
  readinessThresholds: {
    good: 72,
    low: 45,
  },
  readinessAdjust: {
    good: 1,
    neutral: 0,
    low: -2,
  },

  /** Aderência (%) abaixo disto impede progressão de volume. */
  adherenceBlockProgressionBelow: 70,
  adherenceReduceBelow: 50,
  adherenceReduceSets: -2,

  /** Variação máxima de séries por músculo entre ciclos. */
  maxWeeklyDelta: 2,

  /** Multiplicadores de volume total por objetivo. */
  objectiveVolumeMultiplier: {
    hipertrofia: 1,
    emagrecimento: 0.9,
    forca: 0.85,
    saude: 0.8,
  } as Record<Objective, number>,

  /** RIR alvo por nível (compostos / isoladores). */
  rir: {
    iniciante: { composto: "3", isolador: "2-3" },
    intermediario: { composto: "2", isolador: "1-2" },
    avancado: { composto: "1-2", isolador: "0-1" },
  } as Record<ExperienceLevel, { composto: string; isolador: string }>,
  deloadRir: "4",

  /** Faixas de repetição por tipo de exercício e objetivo. */
  repRanges: {
    hipertrofia: { composto: "6-10", isolador: "10-15" },
    emagrecimento: { composto: "8-12", isolador: "12-15" },
    forca: { composto: "4-6", isolador: "8-12" },
    saude: { composto: "10-12", isolador: "12-15" },
  } as Record<Objective, { composto: string; isolador: string }>,

  /** Frequência semanal sugerida por faixa de volume. */
  frequencyBands: [
    { upTo: 6, frequency: 1 },
    { upTo: 16, frequency: 2 },
    { upTo: 99, frequency: 3 },
  ],

  /** Sinalização de deload. */
  deload: {
    minWeeksBetween: 4,
    readinessFloor: 40,
  },
};

export type EngineConfig = {
  version: string;
  ranges: Record<MuscleKey, VolumeRange>;
  defaults: typeof ENGINE_DEFAULTS;
};

export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
  version: ENGINE_VERSION,
  ranges: VOLUME_RANGES,
  defaults: ENGINE_DEFAULTS,
};

/** Merge raso e tolerante de overrides vindos do banco. */
export function mergeEngineConfig(override: unknown): EngineConfig {
  if (!override || typeof override !== "object") return DEFAULT_ENGINE_CONFIG;
  const o = override as Partial<EngineConfig>;
  return {
    version: DEFAULT_ENGINE_CONFIG.version,
    ranges: { ...VOLUME_RANGES, ...(o.ranges || {}) },
    defaults: { ...ENGINE_DEFAULTS, ...(o.defaults || {}) },
  };
}
