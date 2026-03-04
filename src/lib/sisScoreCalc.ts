// SIS — Shape Intelligence System™ score calculation utilities

export type SisClassification = "ELITE" | "ALTA_PERFORMANCE" | "MODERADO" | "RISCO";

export interface SisAlert {
  type: string;
  priority: "alta" | "media" | "baixa";
  message: string;
  action: string;
}

export interface SisScoreRow {
  date: string;
  mechanical_score: number | null;
  recovery_score: number | null;
  structural_score: number | null;
  body_comp_score: number | null;
  cognitive_score: number | null;
  consistency_score: number | null;
  shape_intelligence_score: number | null;
  classification: string | null;
  alerts: SisAlert[];
}

export function clamp(x: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, x));
}

export function safeMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function safeStd(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = safeMean(values);
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export function zscore(value: number, mean: number, sd: number): number {
  if (sd < 0.001) return 0;
  return (value - mean) / sd;
}

export function map1to5to100(x: number): number {
  return clamp(((x - 1) / 4) * 100, 0, 100);
}

export function classify(score: number): { classification: SisClassification; label: string } {
  if (score >= 85) return { classification: "ELITE", label: "Elite" };
  if (score >= 70) return { classification: "ALTA_PERFORMANCE", label: "Alta Performance" };
  if (score >= 50) return { classification: "MODERADO", label: "Moderado" };
  return { classification: "RISCO", label: "Risco" };
}

export const SIS_WEIGHTS = {
  mechanical: 0.25,
  recovery: 0.20,
  structural: 0.15,
  body_comp: 0.15,
  cognitive: 0.15,
  consistency: 0.10,
} as const;

export const CLASSIFICATION_COLORS: Record<SisClassification, string> = {
  ELITE: "hsl(var(--primary))",
  ALTA_PERFORMANCE: "hsl(120 60% 50%)",
  MODERADO: "hsl(45 100% 50%)",
  RISCO: "hsl(0 80% 55%)",
};
