import type { MuscleKey } from "./types";

/** Espelho dos rótulos usados pelo motor de prescrição. */
export const MUSCLE_LABELS: Record<MuscleKey, string> = {
  peito: "Peitoral",
  costas: "Costas",
  deltoide_anterior: "Deltoide anterior",
  deltoide_lateral: "Deltoide lateral",
  deltoide_posterior: "Deltoide posterior",
  biceps: "Bíceps",
  triceps: "Tríceps",
  quadriceps: "Quadríceps",
  posterior_coxa: "Posterior de coxa",
  gluteos: "Glúteos",
  panturrilhas: "Panturrilhas",
  abdomen: "Abdômen/core",
};
