// ============================================================================
// ENGENHARIA DO MOVIMENTO — PRESCRIPTION ENGINE v1
// Shadow mode: compara o protocolo ATUAL com a SUGESTÃO do motor.
// Não escreve nada em protocolos nem altera treino do aluno.
// ============================================================================

import { MUSCLE_LABELS } from "./config.ts";
import { aggregateVolume } from "./muscles.ts";
import type { MuscleKey, PrescriptionPlan } from "./types.ts";

export interface CurrentVolume {
  volume: Partial<Record<MuscleKey, number>>;
  frequency: Partial<Record<MuscleKey, number>>;
  source: "motor" | "conteudo" | "nenhum";
  protocolId: string | null;
  createdAt: string | null;
}

/** Extrai o volume semanal por músculo do protocolo em uso (somente leitura). */
export function currentVolumeFromProtocol(protocol: Record<string, unknown> | null): CurrentVolume {
  const empty: CurrentVolume = { volume: {}, frequency: {}, source: "nenhum", protocolId: null, createdAt: null };
  if (!protocol) return empty;

  const protocolId = (protocol.id as string) ?? null;
  const createdAt = (protocol.created_at as string) ?? null;

  const meta = protocol.prescription_meta as
    | { plan?: { muscles?: { muscle: MuscleKey; directSets: number; frequency: number }[] } }
    | null;
  if (meta?.plan?.muscles?.length) {
    const volume: Partial<Record<MuscleKey, number>> = {};
    const frequency: Partial<Record<MuscleKey, number>> = {};
    for (const m of meta.plan.muscles) {
      volume[m.muscle] = m.directSets;
      frequency[m.muscle] = m.frequency;
    }
    return { volume, frequency, source: "motor", protocolId, createdAt };
  }

  const conteudo = (protocol.conteudo || {}) as Record<string, unknown>;
  const treinos = (conteudo.treinos as { exercicios?: { nome?: string; series?: number | string }[] }[]) || [];
  const entries: { name: string; sets: number }[] = [];
  for (const t of treinos) {
    for (const e of t.exercicios || []) {
      const sets = typeof e.series === "number" ? e.series : Number(String(e.series ?? "").match(/\d+/)?.[0] ?? 0);
      entries.push({ name: String(e.nome || ""), sets });
    }
  }
  if (entries.length === 0) return { ...empty, protocolId, createdAt };
  const agg = aggregateVolume(entries);
  const volume: Partial<Record<MuscleKey, number>> = {};
  for (const [k, v] of Object.entries(agg.direct)) volume[k as MuscleKey] = Math.round(v as number);
  return { volume, frequency: {}, source: "conteudo", protocolId, createdAt };
}

export interface ShadowDiffRow {
  muscle: MuscleKey;
  label: string;
  currentSets: number | null;
  suggestedSets: number;
  diff: number | null;
  currentFrequency: number | null;
  suggestedFrequency: number;
  targetRir: string;
  repRange: string;
  priority: string;
  source: "motor" | "override";
  reason: string;
}

/** Linha a linha: atual x sugerido, com o motivo da mudança. */
export function buildShadowDiff(plan: PrescriptionPlan, current: CurrentVolume): ShadowDiffRow[] {
  const keys = new Set<MuscleKey>([
    ...plan.muscles.map((m) => m.muscle),
    ...(Object.keys(current.volume) as MuscleKey[]),
  ]);

  const rows: ShadowDiffRow[] = [];
  for (const key of keys) {
    const m = plan.muscles.find((x) => x.muscle === key);
    const currentSets = current.volume[key] ?? null;
    const suggestedSets = m?.directSets ?? 0;
    rows.push({
      muscle: key,
      label: MUSCLE_LABELS[key] || key,
      currentSets,
      suggestedSets,
      diff: currentSets === null ? null : suggestedSets - currentSets,
      currentFrequency: current.frequency[key] ?? null,
      suggestedFrequency: m?.frequency ?? 0,
      targetRir: m?.targetRir ?? "-",
      repRange: m?.repRange ?? "-",
      priority: m?.priority ?? "-",
      source: m?.source ?? "motor",
      reason: m ? m.rationale.join("; ") : "grupo sem dose no plano sugerido",
    });
  }
  rows.sort((a, b) => b.suggestedSets - a.suggestedSets);
  return rows;
}
