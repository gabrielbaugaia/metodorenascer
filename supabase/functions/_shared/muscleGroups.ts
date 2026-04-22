// Lista canônica de grupos musculares usada em todo o sistema
// (admin, IA, validação de Reels)
export const MUSCLE_GROUPS = [
  "Peito",
  "Costas",
  "Ombros",
  "Bíceps",
  "Tríceps",
  "Antebraço",
  "Quadríceps",
  "Posterior de Coxa",
  "Glúteos",
  "Panturrilha",
  "Adutores",
  "Abdutores",
  "Abdômen",
  "Lombar",
  "Trapézio",
  "Core",
  "Cardio",
  "Mobilidade",
  "Alongamento",
  "Corpo todo",
] as const;

export type MuscleGroup = typeof MUSCLE_GROUPS[number];

export function sanitizeMuscleGroups(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const set = new Set<string>();
  for (const item of input) {
    if (typeof item !== "string") continue;
    const match = MUSCLE_GROUPS.find(
      (g) => g.toLowerCase() === item.trim().toLowerCase()
    );
    if (match) set.add(match);
  }
  return Array.from(set).slice(0, 5);
}
