// Lista canônica de grupos musculares — espelha
// supabase/functions/_shared/muscleGroups.ts
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
