// ============================================================================
// ENGENHARIA DO MOVIMENTO — PRESCRIPTION ENGINE v1
// Recovery / Readiness Modifier: combina tendências (não uma única noite).
// ============================================================================

import type { Confidence, ReadinessResult } from "./types.ts";

export interface ReadinessSources {
  /** Últimos ~30 dias, ordem cronológica. */
  health: {
    date: string;
    sleep_minutes: number | null;
    resting_hr: number | null;
    hrv_ms: number | null;
    steps: number | null;
  }[];
  /** Check-ins semanais mais recentes primeiro. */
  weeklyCheckins: { energy_level: number | null; adherence_level: number | null; created_at: string }[];
  /** SIS mais recentes primeiro. */
  sis: { shape_intelligence_score: number | null; recovery_score: number | null }[];
  /** Relatos de dor / desconforto informados pelo aluno. */
  painReports: string[];
}

function mean(values: (number | null | undefined)[]): number | null {
  const v = values.filter((x): x is number => typeof x === "number" && x > 0);
  if (v.length === 0) return null;
  return v.reduce((a, b) => a + b, 0) / v.length;
}

/**
 * Calcula prontidão 0–100 a partir de tendências.
 * Sem dados → 50 (neutro) com confiança baixa: o motor NÃO inventa.
 */
export function computeReadiness(src: ReadinessSources): ReadinessResult {
  const signals: { label: string; value: string; impact: number }[] = [];
  const missing: string[] = [];
  let score = 50;
  let available = 0;

  const health = src.health || [];
  const recent = health.slice(-7);
  const baseline = health.slice(0, Math.max(0, health.length - 7));

  // --- Sono (tendência de 7 dias) ---
  const sleepRecent = mean(recent.map((h) => h.sleep_minutes));
  if (sleepRecent !== null) {
    available++;
    const hours = sleepRecent / 60;
    const impact = hours >= 7 ? 12 : hours >= 6.5 ? 6 : hours >= 6 ? 0 : hours >= 5.5 ? -8 : -15;
    score += impact;
    signals.push({ label: "Sono médio (7 dias)", value: `${hours.toFixed(1)} h`, impact });
  } else {
    missing.push("sono");
  }

  // --- VFC vs baseline ---
  const hrvRecent = mean(recent.map((h) => h.hrv_ms));
  const hrvBase = mean(baseline.map((h) => h.hrv_ms));
  if (hrvRecent !== null && hrvBase !== null) {
    available++;
    const delta = (hrvRecent - hrvBase) / hrvBase;
    const impact = delta > 0.05 ? 10 : delta < -0.12 ? -12 : delta < -0.05 ? -6 : 0;
    score += impact;
    signals.push({
      label: "VFC vs base de 30 dias",
      value: `${(delta * 100).toFixed(0)}%`,
      impact,
    });
  } else if (hrvRecent !== null) {
    missing.push("baseline de VFC");
  } else {
    missing.push("VFC");
  }

  // --- FC de repouso vs baseline ---
  const rhrRecent = mean(recent.map((h) => h.resting_hr));
  const rhrBase = mean(baseline.map((h) => h.resting_hr));
  if (rhrRecent !== null && rhrBase !== null) {
    available++;
    const delta = rhrRecent - rhrBase;
    const impact = delta <= -2 ? 6 : delta >= 5 ? -10 : delta >= 2 ? -5 : 0;
    score += impact;
    signals.push({ label: "FC de repouso vs base", value: `${delta > 0 ? "+" : ""}${delta.toFixed(0)} bpm`, impact });
  } else {
    missing.push("FC de repouso");
  }

  // --- Energia subjetiva (check-in semanal) ---
  const energy = mean(src.weeklyCheckins.slice(0, 3).map((c) => c.energy_level));
  if (energy !== null) {
    available++;
    // escala 1–5
    const impact = energy >= 4.2 ? 10 : energy >= 3.2 ? 4 : energy >= 2.5 ? -4 : -12;
    score += impact;
    signals.push({ label: "Energia relatada (check-ins)", value: `${energy.toFixed(1)}/5`, impact });
  } else {
    missing.push("energia relatada no check-in");
  }

  // --- Recuperação do SIS ---
  const sisRecovery = src.sis[0]?.recovery_score;
  if (typeof sisRecovery === "number" && sisRecovery > 0) {
    available++;
    const impact = sisRecovery >= 75 ? 8 : sisRecovery >= 55 ? 2 : sisRecovery >= 40 ? -5 : -10;
    score += impact;
    signals.push({ label: "Recuperação SIS", value: `${Math.round(sisRecovery)}/100`, impact });
  } else {
    missing.push("SIS de recuperação");
  }

  // --- Carga global de atividade (passos) ---
  const steps = mean(recent.map((h) => h.steps));
  if (steps !== null) {
    available++;
    const impact = steps > 16000 ? -4 : steps < 3000 ? -2 : 2;
    score += impact;
    signals.push({ label: "Passos/dia (7 dias)", value: `${Math.round(steps)}`, impact });
  }

  // --- Dor / desconforto ---
  if (src.painReports.length > 0) {
    const impact = -6;
    score += impact;
    signals.push({ label: "Desconforto relatado", value: `${src.painReports.length} relato(s)`, impact });
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  const confidence: Confidence = available >= 4 ? "alta" : available >= 2 ? "media" : "baixa";

  return { score, confidence, signals, missing };
}
