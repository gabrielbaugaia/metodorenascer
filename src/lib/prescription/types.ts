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

  // Treinador
  trainerDirectives: string | null;
  manualProtocol: boolean;
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
  deload: { recommended: boolean; reason: string | null };
  confidence: Confidence;
  confidenceReasons: string[];
  safetyAlerts: string[];
  inputsSnapshot: Record<string, unknown>;
  decisionSummary: string[];
}
