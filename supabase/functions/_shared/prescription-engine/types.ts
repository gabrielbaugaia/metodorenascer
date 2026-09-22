// ============================================================================
// ENGENHARIA DO MOVIMENTO — PRESCRIPTION ENGINE v1
// Tipos compartilhados do motor determinístico de prescrição de treino.
// ============================================================================

export type MuscleKey =
  | "peito"
  | "costas"
  | "deltoide_anterior"
  | "deltoide_lateral"
  | "deltoide_posterior"
  | "biceps"
  | "triceps"
  | "quadriceps"
  | "posterior_coxa"
  | "gluteos"
  | "panturrilhas"
  | "abdomen";

export type MusclePriority = "alta" | "desenvolvimento" | "manutencao" | "reduzir";

export type ExperienceLevel = "iniciante" | "intermediario" | "avancado";

export type Objective = "hipertrofia" | "emagrecimento" | "forca" | "saude";

export type Confidence = "alta" | "media" | "baixa";

export type MuscleStatus =
  | "SUBDOSE"
  | "DOSE_PRODUTIVA"
  | "ALERTA_FADIGA"
  | "MANUTENCAO"
  | "PRIORIDADE";

/** Faixa configurável de séries efetivas por semana. */
export interface VolumeRange {
  min: number;
  defaultLow: number;
  defaultHigh: number;
  max: number;
}

export interface EngineInputs {
  // Perfil
  age: number | null;
  sex: string | null;
  weightKg: number | null;
  heightCm: number | null;
  level: ExperienceLevel;
  objective: Objective;
  secondaryObjectives: string[];
  trainingLocation: string | null;
  equipment: string[];
  preferences: string | null;

  // Agenda
  weeklyFrequency: number;
  sessionMinutes: number;
  availableDays: string[];
  allowsConsecutiveDays: boolean | null;
  maxConsecutiveSessions: number | null;

  // Saúde / limitações
  injuries: string | null;
  medicalRestrictions: string | null;
  painReports: string[];

  // Prioridades
  priorities: Partial<Record<MuscleKey, MusclePriority>>;

  // Histórico
  previousWeeklyVolume: Partial<Record<MuscleKey, number>>;
  previousPlannedVolume: Partial<Record<MuscleKey, number>>;
  adherencePct: number | null;
  sessionsLast4Weeks: number | null;
  progressionSignal: "melhorando" | "estavel" | "piorando" | "desconhecido";
  lastDeloadWeeksAgo: number | null;

  // Recuperação
  readiness: ReadinessResult;

  // Esforço real (RIR registrado pelo aluno)
  effort: EffortSignal;

  // Origem das entradas (estruturado x texto livre)
  structured: StructuredCoverage;

  // Treinador
  trainerDirectives: string | null;
  manualProtocol: boolean;
  overrides: TrainerOverrides;
}

/** Trava manual do treinador para um grupo muscular. */
export interface MuscleOverride {
  lockedSets?: number | null;
  minSets?: number | null;
  maxSets?: number | null;
  priority?: MusclePriority | null;
  lockedFrequency?: number | null;
}

/** Overrides humanos. Sempre vencem o motor e a IA. */
export interface TrainerOverrides {
  muscles: Partial<Record<MuscleKey, MuscleOverride>>;
  lockedFrequency: number | null;
  excludedExercises: string[];
  lockedExercises: string[];
  deloadDirective: "forcar" | "ignorar" | null;
}

export const EMPTY_OVERRIDES: TrainerOverrides = {
  muscles: {},
  lockedFrequency: null,
  excludedExercises: [],
  lockedExercises: [],
  deloadDirective: null,
};

export type GateStatus = "APROVADO" | "REQUER_REVISAO" | "BLOQUEADO";

export interface GateResult {
  status: GateStatus;
  reasons: string[];
}

export interface ReadinessResult {
  /** 0–100. 50 = neutro quando não há dados. */
  score: number;
  confidence: Confidence;
  signals: { label: string; value: string; impact: number }[];
  missing: string[];
}

export interface MusclePrescription {
  muscle: MuscleKey;
  label: string;
  directSets: number;
  indirectEquivalentSets: number;
  totalEquivalentSets: number;
  frequency: number;
  maxSetsPerSession: number;
  repRange: string;
  targetRir: string;
  priority: MusclePriority;
  status: MuscleStatus;
  previousSets: number | null;
  deltaVsPreviousCycle: number | null;
  rationale: string[];
  /** De onde veio a decisão final deste grupo. */
  source: "motor" | "override";
}

/** Esforço real relatado pelo aluno (RIR) nas últimas semanas. */
export interface EffortSignal {
  avgRir: number | null;
  setsWithRir: number;
  totalSets: number;
  coveragePct: number;
  reading: "muito_alto" | "adequado" | "baixo" | "desconhecido";
}

/** Quais entradas vieram de campo estruturado (true) ou de texto livre/default (false). */
export interface StructuredCoverage {
  weeklyFrequency: boolean;
  sessionMinutes: boolean;
  availableDays: boolean;
  priorities: boolean;
  equipment: boolean;
  consecutiveDays: boolean;
}

export interface PrescriptionPlan {
  engineVersion: string;
  generatedAt: string;
  level: ExperienceLevel;
  objective: Objective;
  weeklyFrequency: number;
  sessionMinutes: number;
  weeklySetCapacity: number;
  totalDirectSets: number;
  muscles: MusclePrescription[];
  readiness: ReadinessResult;
  effort: EffortSignal;
  structured: StructuredCoverage;
  deload: { recommended: boolean; reason: string | null };
  confidence: Confidence;
  confidenceReasons: string[];
  safetyAlerts: string[];
  inputsSnapshot: Record<string, unknown>;
  decisionSummary: string[];
  /** Decisões que vieram de override humano, já aplicadas. */
  overridesApplied: string[];
}
