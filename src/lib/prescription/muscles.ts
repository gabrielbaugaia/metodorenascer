// ============================================================================
// ENGENHARIA DO MOVIMENTO — PRESCRIPTION ENGINE v1
// Mapa exercício → contribuição por grupo muscular (direta 1.0 / indireta 0.5).
// Espelhado em src/lib/prescription/muscles.ts — manter os dois em sincronia.
// ============================================================================

import type { MuscleKey } from "./types";

export type Contribution = Partial<Record<MuscleKey, number>>;

export interface ExercisePattern {
  /** Palavras-chave normalizadas (sem acento, minúsculas). Todas devem casar. */
  match: string[];
  /** Palavras que invalidam o casamento. */
  exclude?: string[];
  contribution: Contribution;
  /** composto = multiarticular. */
  composto: boolean;
}

export function normalizeName(name: string): string {
  return (name || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Ordem importa: o primeiro padrão que casar vence.
 * Contribuições indiretas usam 0.5 por padrão (configurável por exercício).
 */
export const EXERCISE_PATTERNS: ExercisePattern[] = [
  // ---------- Peito ----------
  { match: ["supino", "inclinado"], contribution: { peito: 1, deltoide_anterior: 0.5, triceps: 0.5 }, composto: true },
  { match: ["supino", "declinado"], contribution: { peito: 1, triceps: 0.5 }, composto: true },
  { match: ["supino"], contribution: { peito: 1, deltoide_anterior: 0.5, triceps: 0.5 }, composto: true },
  { match: ["crucifixo"], contribution: { peito: 1 }, composto: false },
  { match: ["crossover"], contribution: { peito: 1 }, composto: false },
  { match: ["peck"], contribution: { peito: 1 }, composto: false },
  { match: ["voador"], contribution: { peito: 1 }, composto: false },
  { match: ["flexao"], exclude: ["quadril", "perna"], contribution: { peito: 1, triceps: 0.5, deltoide_anterior: 0.5 }, composto: true },
  { match: ["paralelas"], contribution: { peito: 1, triceps: 0.5 }, composto: true },
  { match: ["mergulho"], contribution: { peito: 1, triceps: 0.5 }, composto: true },

  // ---------- Costas ----------
  { match: ["puxada"], contribution: { costas: 1, biceps: 0.5, deltoide_posterior: 0.5 }, composto: true },
  { match: ["pulldown"], contribution: { costas: 1, biceps: 0.5 }, composto: true },
  { match: ["barra", "fixa"], contribution: { costas: 1, biceps: 0.5 }, composto: true },
  { match: ["remada"], contribution: { costas: 1, biceps: 0.5, deltoide_posterior: 0.5 }, composto: true },
  { match: ["pullover"], contribution: { costas: 1 }, composto: false },
  { match: ["terra"], exclude: ["romeno"], contribution: { costas: 1, posterior_coxa: 0.5, gluteos: 0.5 }, composto: true },
  { match: ["levantamento", "terra"], contribution: { costas: 1, posterior_coxa: 0.5, gluteos: 0.5 }, composto: true },
  { match: ["hiperextensao"], contribution: { posterior_coxa: 0.5, gluteos: 0.5, costas: 0.5 }, composto: false },

  // ---------- Ombros ----------
  { match: ["desenvolvimento"], contribution: { deltoide_anterior: 1, triceps: 0.5, deltoide_lateral: 0.5 }, composto: true },
  { match: ["elevacao", "frontal"], contribution: { deltoide_anterior: 1 }, composto: false },
  { match: ["elevacao", "lateral"], contribution: { deltoide_lateral: 1 }, composto: false },
  { match: ["elevacao", "posterior"], contribution: { deltoide_posterior: 1 }, composto: false },
  { match: ["crucifixo", "inverso"], contribution: { deltoide_posterior: 1 }, composto: false },
  { match: ["face", "pull"], contribution: { deltoide_posterior: 1, costas: 0.5 }, composto: false },
  { match: ["encolhimento"], contribution: { costas: 0.5 }, composto: false },

  // ---------- Braços ----------
  { match: ["rosca"], exclude: ["invertida"], contribution: { biceps: 1 }, composto: false },
  { match: ["rosca", "invertida"], contribution: { biceps: 1 }, composto: false },
  { match: ["triceps"], contribution: { triceps: 1 }, composto: false },
  { match: ["testa"], contribution: { triceps: 1 }, composto: false },
  { match: ["frances"], contribution: { triceps: 1 }, composto: false },
  { match: ["coice"], contribution: { triceps: 1 }, composto: false },

  // ---------- Pernas ----------
  { match: ["agachamento", "bulgaro"], contribution: { quadriceps: 1, gluteos: 0.5 }, composto: true },
  { match: ["agachamento"], contribution: { quadriceps: 1, gluteos: 0.5, posterior_coxa: 0.5 }, composto: true },
  { match: ["leg", "press"], contribution: { quadriceps: 1, gluteos: 0.5 }, composto: true },
  { match: ["hack"], contribution: { quadriceps: 1, gluteos: 0.5 }, composto: true },
  { match: ["afundo"], contribution: { quadriceps: 1, gluteos: 0.5 }, composto: true },
  { match: ["passada"], contribution: { quadriceps: 1, gluteos: 0.5 }, composto: true },
  { match: ["cadeira", "extensora"], contribution: { quadriceps: 1 }, composto: false },
  { match: ["extensora"], contribution: { quadriceps: 1 }, composto: false },
  { match: ["cadeira", "flexora"], contribution: { posterior_coxa: 1 }, composto: false },
  { match: ["flexora"], contribution: { posterior_coxa: 1 }, composto: false },
  { match: ["mesa", "flexora"], contribution: { posterior_coxa: 1 }, composto: false },
  { match: ["stiff"], contribution: { posterior_coxa: 1, gluteos: 0.5 }, composto: true },
  { match: ["romeno"], contribution: { posterior_coxa: 1, gluteos: 0.5 }, composto: true },
  { match: ["good", "morning"], contribution: { posterior_coxa: 1, gluteos: 0.5 }, composto: true },
  { match: ["hip", "thrust"], contribution: { gluteos: 1, posterior_coxa: 0.5 }, composto: true },
  { match: ["elevacao", "pelvica"], contribution: { gluteos: 1, posterior_coxa: 0.5 }, composto: true },
  { match: ["gluteo"], contribution: { gluteos: 1 }, composto: false },
  { match: ["abdutora"], contribution: { gluteos: 1 }, composto: false },
  { match: ["adutora"], contribution: { quadriceps: 0.5 }, composto: false },
  { match: ["panturrilha"], contribution: { panturrilhas: 1 }, composto: false },
  { match: ["gemeos"], contribution: { panturrilhas: 1 }, composto: false },

  // ---------- Core ----------
  { match: ["abdominal"], contribution: { abdomen: 1 }, composto: false },
  { match: ["prancha"], contribution: { abdomen: 1 }, composto: false },
  { match: ["elevacao", "pernas"], contribution: { abdomen: 1 }, composto: false },
  { match: ["rotacao"], contribution: { abdomen: 1 }, composto: false },
  { match: ["lenhador"], contribution: { abdomen: 1 }, composto: false },
];

export interface ResolvedExercise {
  contribution: Contribution;
  composto: boolean;
  matched: boolean;
}

export function resolveExercise(name: string): ResolvedExercise {
  const n = normalizeName(name);
  if (!n) return { contribution: {}, composto: false, matched: false };
  for (const p of EXERCISE_PATTERNS) {
    if (!p.match.every((k) => n.includes(k))) continue;
    if (p.exclude && p.exclude.some((k) => n.includes(k))) continue;
    return { contribution: p.contribution, composto: p.composto, matched: true };
  }
  return { contribution: {}, composto: false, matched: false };
}

export interface VolumeBreakdown {
  direct: Partial<Record<MuscleKey, number>>;
  indirect: Partial<Record<MuscleKey, number>>;
  totalEquivalent: Partial<Record<MuscleKey, number>>;
  unmatchedExercises: string[];
}

/** Agrega séries por grupo muscular a partir de uma lista de (exercício, séries). */
export function aggregateVolume(
  entries: { name: string; sets: number }[],
  indirectWeight = 0.5,
): VolumeBreakdown {
  const direct: Partial<Record<MuscleKey, number>> = {};
  const indirect: Partial<Record<MuscleKey, number>> = {};
  const unmatched: string[] = [];

  for (const e of entries) {
    const sets = Number(e.sets) || 0;
    if (sets <= 0) continue;
    const r = resolveExercise(e.name);
    if (!r.matched) {
      unmatched.push(e.name);
      continue;
    }
    for (const [muscle, weight] of Object.entries(r.contribution)) {
      const key = muscle as MuscleKey;
      if (weight >= 1) {
        direct[key] = (direct[key] || 0) + sets;
      } else {
        indirect[key] = (indirect[key] || 0) + sets * indirectWeight * (weight / 0.5);
      }
    }
  }

  const totalEquivalent: Partial<Record<MuscleKey, number>> = {};
  const keys = new Set<string>([...Object.keys(direct), ...Object.keys(indirect)]);
  for (const k of keys) {
    const key = k as MuscleKey;
    totalEquivalent[key] = round1((direct[key] || 0) + (indirect[key] || 0));
  }

  return { direct, indirect, totalEquivalent, unmatchedExercises: unmatched };
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
