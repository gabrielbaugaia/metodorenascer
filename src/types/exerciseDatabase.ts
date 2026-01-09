// Types for exercises database imported from JSON

export interface ExerciseFromDb {
  exerciseId: string;
  name: string;
  gifUrl: string;
  targetMuscles: string[];
  bodyParts: string[];
  equipments: string[];
  secondaryMuscles: string[];
  instructions: string[];
}

// Mapping from API body parts to Portuguese muscle groups
export const BODY_PART_TO_MUSCLE_GROUP: Record<string, string> = {
  // Lower body
  "lower legs": "Pernas",
  "upper legs": "Pernas",
  
  // Upper body
  "chest": "Peito",
  "back": "Costas",
  "shoulders": "Ombros",
  "upper arms": "Bíceps",
  "lower arms": "Bíceps",
  
  // Core
  "waist": "Abdômen",
  
  // Glutes
  "cardio": "Cardio",
  "neck": "Ombros",
};

// Get muscle group from target muscles and body parts
export function getMuscleGroupFromExercise(exercise: ExerciseFromDb): string {
  const targetMuscle = exercise.targetMuscles[0]?.toLowerCase() || "";
  const bodyPart = exercise.bodyParts[0]?.toLowerCase() || "";
  
  // Check target muscles first
  if (targetMuscle.includes("glute")) return "Glúteos";
  if (targetMuscle.includes("quad") || targetMuscle.includes("hamstring") || targetMuscle.includes("calv")) return "Pernas";
  if (targetMuscle.includes("pectoral")) return "Peito";
  if (targetMuscle.includes("lat") || targetMuscle.includes("back") || targetMuscle.includes("trap") || targetMuscle.includes("rhomboid")) return "Costas";
  if (targetMuscle.includes("delt") || targetMuscle.includes("rotator")) return "Ombros";
  if (targetMuscle.includes("bicep") || targetMuscle.includes("forearm") || targetMuscle.includes("brachial")) return "Bíceps";
  if (targetMuscle.includes("tricep")) return "Tríceps";
  if (targetMuscle.includes("ab") || targetMuscle.includes("oblique") || targetMuscle.includes("spine") || targetMuscle.includes("erector")) return "Abdômen";
  
  // Fallback to body part mapping
  return BODY_PART_TO_MUSCLE_GROUP[bodyPart] || "Corpo Inteiro";
}

// GIF base URL (from the exercises database)
export const GIF_BASE_URL = "https://v2.exercisedb.io/image/";
