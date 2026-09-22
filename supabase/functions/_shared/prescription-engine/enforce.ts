// ============================================================================
// ENGENHARIA DO MOVIMENTO — PRESCRIPTION ENGINE v1
// Camada de garantia: o LLM nunca pode furar os limites do motor.
// Compara o protocolo gerado com a dose planejada, corrige séries e
// devolve um relatório de conformidade.
// ============================================================================

import { aggregateVolume, round1 } from "./muscles.ts";
import type { MuscleKey, PrescriptionPlan } from "./types.ts";

interface ProtocolExercise {
  nome?: string;
  name?: string;
  series?: number | string;
  sets?: number | string;
  [k: string]: unknown;
}

interface ProtocolWorkout {
  exercicios?: ProtocolExercise[];
  exercises?: ProtocolExercise[];
  [k: string]: unknown;
}

function getWorkouts(protocol: Record<string, unknown>): ProtocolWorkout[] {
  const out: ProtocolWorkout[] = [];
  const treinos = protocol.treinos as ProtocolWorkout[] | undefined;
  if (Array.isArray(treinos)) out.push(...treinos);
  const semanas = protocol.semanas as { dias?: ProtocolWorkout[] }[] | undefined;
  if (Array.isArray(semanas)) {
    for (const s of semanas) if (Array.isArray(s.dias)) out.push(...s.dias);
  }
  return out;
}

function getExercises(w: ProtocolWorkout): ProtocolExercise[] {
  return (w.exercicios || w.exercises || []) as ProtocolExercise[];
}

function parseSets(v: unknown): number {
  if (typeof v === "number") return v;
  const m = String(v ?? "").match(/\d+/);
  return m ? Number(m[0]) : 0;
}

export interface ComplianceReport {
  compliant: boolean;
  engineVersion: string;
  perMuscle: {
    muscle: MuscleKey;
    label: string;
    planned: number;
    generatedDirect: number;
    generatedIndirect: number;
    generatedTotalEquivalent: number;
    deviation: number;
    withinTolerance: boolean;
  }[];
  unmatchedExercises: string[];
  adjustments: string[];
}

/**
 * Confere (e ajusta) o protocolo gerado contra o plano do motor.
 * Ajuste é conservador: só corta séries excedentes no último exercício do
 * grupo; nunca inventa exercícios novos.
 */
export function enforcePlan(
  protocol: Record<string, unknown>,
  plan: PrescriptionPlan,
  tolerance = 1,
): ComplianceReport {
  const workouts = getWorkouts(protocol);
  const entries: { name: string; sets: number; ref: ProtocolExercise }[] = [];
  for (const w of workouts) {
    for (const ex of getExercises(w)) {
      entries.push({ name: String(ex.nome || ex.name || ""), sets: parseSets(ex.series ?? ex.sets), ref: ex });
    }
  }

  const adjustments: string[] = [];
  const plannedByMuscle = new Map<MuscleKey, number>(plan.muscles.map((m) => [m.muscle, m.directSets]));

  // Corta excedentes grosseiros (mais de tolerância + 2) do fim para o começo.
  for (const [muscle, planned] of plannedByMuscle) {
    let breakdown = aggregateVolume(entries.map((e) => ({ name: e.name, sets: e.sets })));
    let direct = breakdown.direct[muscle] || 0;
    let excess = direct - planned - tolerance;
    if (excess <= 0) continue;

    for (let i = entries.length - 1; i >= 0 && excess > 0; i--) {
      const e = entries[i];
      const contrib = aggregateVolume([{ name: e.name, sets: 1 }]).direct[muscle] || 0;
      if (contrib <= 0) continue;
      const cut = Math.min(excess, Math.max(0, e.sets - 2));
      if (cut <= 0) continue;
      e.sets -= cut;
      if ("series" in e.ref) e.ref.series = e.sets;
      if ("sets" in e.ref) e.ref.sets = e.sets;
      excess -= cut;
      adjustments.push(`${e.name}: -${cut} série(s) para respeitar a dose de ${plan.muscles.find((m) => m.muscle === muscle)?.label}`);
    }
    breakdown = aggregateVolume(entries.map((en) => ({ name: en.name, sets: en.sets })));
    direct = breakdown.direct[muscle] || 0;
  }

  const final = aggregateVolume(entries.map((e) => ({ name: e.name, sets: e.sets })));

  const perMuscle = plan.muscles.map((m) => {
    const generatedDirect = round1(final.direct[m.muscle] || 0);
    const generatedIndirect = round1(final.indirect[m.muscle] || 0);
    const deviation = round1(generatedDirect - m.directSets);
    return {
      muscle: m.muscle,
      label: m.label,
      planned: m.directSets,
      generatedDirect,
      generatedIndirect,
      generatedTotalEquivalent: round1(generatedDirect + generatedIndirect),
      deviation,
      withinTolerance: Math.abs(deviation) <= tolerance,
    };
  });

  // Reflete o volume real no campo que o app já exibe.
  const detalhado: Record<string, number> = {};
  for (const p of perMuscle) detalhado[p.label] = p.generatedDirect;
  if (Object.keys(detalhado).length > 0) protocol.volume_semanal_detalhado = detalhado;

  return {
    compliant: perMuscle.every((p) => p.withinTolerance),
    engineVersion: plan.engineVersion,
    perMuscle,
    unmatchedExercises: Array.from(new Set(final.unmatchedExercises)),
    adjustments,
  };
}

/** Volume REALIZADO por grupo muscular a partir dos logs de série. */
export function realizedVolumeFromLogs(
  logs: { exercise_name: string; created_at: string }[],
  weeks: number,
): Partial<Record<MuscleKey, number>> {
  const counts = new Map<string, number>();
  for (const l of logs) {
    counts.set(l.exercise_name, (counts.get(l.exercise_name) || 0) + 1);
  }
  const entries = Array.from(counts, ([name, sets]) => ({ name, sets }));
  const agg = aggregateVolume(entries);
  const perWeek: Partial<Record<MuscleKey, number>> = {};
  const w = Math.max(1, weeks);
  for (const [k, v] of Object.entries(agg.direct)) {
    perWeek[k as MuscleKey] = Math.round((v as number) / w);
  }
  return perWeek;
}
