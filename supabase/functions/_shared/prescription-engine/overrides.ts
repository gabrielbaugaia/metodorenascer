// ============================================================================
// ENGENHARIA DO MOVIMENTO — PRESCRIPTION ENGINE v1
// Overrides do treinador: autoridade final sobre motor e IA.
// ============================================================================

import { EMPTY_OVERRIDES, type MuscleKey, type MuscleOverride, type MusclePriority, type TrainerOverrides } from "./types.ts";
import { MUSCLE_LABELS } from "./config.ts";

const VALID_PRIORITIES: MusclePriority[] = ["alta", "desenvolvimento", "manutencao", "reduzir"];

function num(v: unknown, min: number, max: number): number | null {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  if (n < min || n > max) return null;
  return Math.round(n);
}

/** Normaliza a linha de prescription_overrides em um objeto seguro. */
export function normalizeOverrides(row: Record<string, unknown> | null | undefined): TrainerOverrides {
  if (!row) return structuredClone(EMPTY_OVERRIDES);
  const muscles: Partial<Record<MuscleKey, MuscleOverride>> = {};
  const raw = (row.muscle_locks && typeof row.muscle_locks === "object" ? row.muscle_locks : {}) as Record<string, unknown>;
  for (const [key, value] of Object.entries(raw)) {
    if (!(key in MUSCLE_LABELS) || !value || typeof value !== "object") continue;
    const v = value as Record<string, unknown>;
    const priority = VALID_PRIORITIES.includes(String(v.priority) as MusclePriority)
      ? (String(v.priority) as MusclePriority)
      : null;
    const entry: MuscleOverride = {
      lockedSets: num(v.lockedSets, 0, 40),
      minSets: num(v.minSets, 0, 40),
      maxSets: num(v.maxSets, 0, 40),
      priority,
      lockedFrequency: num(v.lockedFrequency, 1, 7),
    };
    const hasAny = entry.lockedSets !== null || entry.minSets !== null || entry.maxSets !== null ||
      entry.priority !== null || entry.lockedFrequency !== null;
    if (hasAny) muscles[key as MuscleKey] = entry;
  }

  const directive = String(row.deload_directive ?? "");
  return {
    muscles,
    lockedFrequency: num(row.locked_frequency, 1, 7),
    excludedExercises: Array.isArray(row.excluded_exercises) ? (row.excluded_exercises as string[]).filter(Boolean) : [],
    lockedExercises: Array.isArray(row.locked_exercises) ? (row.locked_exercises as string[]).filter(Boolean) : [],
    deloadDirective: directive === "forcar" || directive === "ignorar" ? directive : null,
  };
}

// deno-lint-ignore no-explicit-any
export async function loadOverrides(supabase: any, userId: string): Promise<TrainerOverrides> {
  try {
    const { data } = await supabase
      .from("prescription_overrides")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    return normalizeOverrides(data);
  } catch {
    return structuredClone(EMPTY_OVERRIDES);
  }
}
