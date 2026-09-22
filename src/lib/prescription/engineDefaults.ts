// Espelho dos padrões do motor para edição no admin.
// Mantém os mesmos valores de supabase/functions/_shared/prescription-engine/config.ts
import type { MuscleKey } from "./types";

export interface VolumeRange {
  min: number;
  defaultLow: number;
  defaultHigh: number;
  max: number;
}

export const DEFAULT_RANGES: Record<MuscleKey, VolumeRange> = {
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

export const DEFAULT_PARAMS = {
  indirectSetWeight: 0.5,
  maxSetsPerMusclePerSession: 8,
  preferredSetsPerMusclePerSession: 6,
  minutesPerSet: 3.4,
  sessionOverheadMinutes: 12,
  minSetsPerSession: 8,
  maxSetsPerSession: 32,
  priorityAdjust: { alta: 3, desenvolvimento: 1, manutencao: -2, reduzir: -4 },
  readinessThresholds: { good: 72, low: 45 },
  readinessAdjust: { good: 1, neutral: 0, low: -2 },
  adherenceBlockProgressionBelow: 70,
  adherenceReduceBelow: 50,
  adherenceReduceSets: -2,
  maxWeeklyDelta: 2,
  objectiveVolumeMultiplier: { hipertrofia: 1, emagrecimento: 0.9, forca: 0.85, saude: 0.8 },
  rir: {
    iniciante: { composto: "3", isolador: "2-3" },
    intermediario: { composto: "2", isolador: "1-2" },
    avancado: { composto: "1-2", isolador: "0-1" },
  },
  deloadRir: "4",
  repRanges: {
    hipertrofia: { composto: "6-10", isolador: "10-15" },
    emagrecimento: { composto: "8-12", isolador: "12-15" },
    forca: { composto: "4-6", isolador: "8-12" },
    saude: { composto: "10-12", isolador: "12-15" },
  },
  deload: { minWeeksBetween: 4, readinessFloor: 40 },
  effort: { minSamples: 10, highEffortRirMax: 0.8, lowEffortRirMin: 3.2, highEffortSetsAdjust: -1 },
};

export type EngineParams = typeof DEFAULT_PARAMS;

export interface EditableEngineConfig {
  ranges: Record<MuscleKey, VolumeRange>;
  defaults: EngineParams;
}

export const DEFAULT_ENGINE_CONFIG: EditableEngineConfig = {
  ranges: DEFAULT_RANGES,
  defaults: DEFAULT_PARAMS,
};

export function mergeEngineConfig(raw: unknown): EditableEngineConfig {
  if (!raw || typeof raw !== "object") return structuredClone(DEFAULT_ENGINE_CONFIG);
  const o = raw as Partial<EditableEngineConfig>;
  return {
    ranges: { ...structuredClone(DEFAULT_RANGES), ...(o.ranges || {}) },
    defaults: { ...structuredClone(DEFAULT_PARAMS), ...(o.defaults || {}) },
  };
}
