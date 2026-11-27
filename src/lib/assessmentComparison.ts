import { CIRCUMFERENCES, SKINFOLDS, diff } from "./physicalAssessment";
import type { AssessmentRow } from "@/hooks/usePhysicalAssessments";

/** Direção considerada favorável quando o objetivo é composição corporal; null = neutro (depende do contexto). */
export type Metric = { key: string; label: string; unit: string; digits: number; get: (a: AssessmentRow) => number | null | undefined; favorable: "down" | "up" | null };

export const METRICS: Metric[] = [
  { key: "bf", label: "% de gordura", unit: "%", digits: 2, get: (a) => a.results?.body_fat_pct, favorable: "down" },
  { key: "fat", label: "Massa gorda", unit: "kg", digits: 2, get: (a) => a.results?.fat_mass_kg, favorable: "down" },
  { key: "lean", label: "Massa livre de gordura", unit: "kg", digits: 2, get: (a) => a.results?.lean_mass_kg, favorable: "up" },
  { key: "weight", label: "Peso", unit: "kg", digits: 1, get: (a) => a.weight_kg, favorable: null },
  { key: "bmi", label: "IMC", unit: "", digits: 2, get: (a) => a.results?.bmi, favorable: null },
  { key: "waist", label: "Cintura", unit: "cm", digits: 1, get: (a) => a.circumferences?.waist, favorable: "down" },
  { key: "whr", label: "RCQ", unit: "", digits: 3, get: (a) => a.results?.whr, favorable: "down" },
  { key: "whtr", label: "RCE", unit: "", digits: 3, get: (a) => a.results?.whtr, favorable: "down" },
  { key: "sum", label: "Soma das 7 dobras", unit: "mm", digits: 1, get: (a) => a.results?.skinfold_sum, favorable: "down" },
  ...SKINFOLDS.map((s) => ({ key: `sf_${s.key}`, label: `Dobra ${s.label}`, unit: "mm", digits: 1, get: (a: AssessmentRow) => a.skinfolds?.[s.key], favorable: null })),
  ...CIRCUMFERENCES.filter((c) => c.key !== "waist").map((c) => ({ key: `c_${c.key}`, label: c.label, unit: "cm", digits: 1, get: (a: AssessmentRow) => a.circumferences?.[c.key], favorable: null })),
];

export const HIGHLIGHT_KEYS = ["bf", "fat", "lean", "weight", "bmi", "whr", "whtr"];

export type TrendTone = "good" | "attention" | "neutral";
export function trend(m: Pick<Metric, "favorable">, abs: number | null): { text: string; tone: TrendTone; cls: string } {
  if (abs == null || Math.abs(abs) < 1e-9) return { text: "sem variação", tone: "neutral", cls: "text-muted-foreground" };
  const dir = abs > 0 ? "up" : "down";
  if (!m.favorable) return { text: dir === "up" ? "aumentou" : "reduziu", tone: "neutral", cls: "text-muted-foreground" };
  return dir === m.favorable
    ? { text: "tendência favorável", tone: "good", cls: "text-primary" }
    : { text: "atenção ao contexto", tone: "attention", cls: "text-foreground" };
}

export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to + "T12:00:00Z") - Date.parse(from + "T12:00:00Z")) / 86_400_000);
}

export type ComparisonRow = { metric: Metric; before: number | null; after: number | null; abs: number | null; pct: number | null; trend: ReturnType<typeof trend> };

/** Ordena por data (antes → depois) e compara somente indicadores presentes em ao menos uma avaliação. */
export function buildComparison(x: AssessmentRow, y: AssessmentRow) {
  const [before, after] = x.assessed_at <= y.assessed_at ? [x, y] : [y, x];
  const rows: ComparisonRow[] = METRICS.filter((m) => m.get(before) != null || m.get(after) != null).map((m) => {
    const b = m.get(before) ?? null, a = m.get(after) ?? null;
    const d = diff(b, a);
    return { metric: m, before: b, after: a, abs: d.abs, pct: d.pct, trend: trend(m, d.abs) };
  });
  return { before, after, days: daysBetween(before.assessed_at, after.assessed_at), rows };
}
