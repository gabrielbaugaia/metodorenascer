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
  // Lower body - more specific
  "lower legs": "Panturrilha",
  "upper legs": "Quadríceps",
  
  // Upper body
  "chest": "Peito",
  "back": "Costas",
  "shoulders": "Ombros",
  "upper arms": "Bíceps",
  "lower arms": "Bíceps",
  
  // Core
  "waist": "Abdômen",
  
  // Other
  "cardio": "Cardio",
  "neck": "Trapézios",
};

// Get muscle group from target muscles and body parts
export function getMuscleGroupFromExercise(exercise: ExerciseFromDb): string {
  const targetMuscle = exercise.targetMuscles[0]?.toLowerCase() || "";
  const bodyPart = exercise.bodyParts[0]?.toLowerCase() || "";
  const exerciseName = exercise.name?.toLowerCase() || "";
  
  // Check target muscles first - more specific leg groups
  if (targetMuscle.includes("glute")) return "Glúteos";
  if (targetMuscle.includes("quad")) return "Quadríceps";
  if (targetMuscle.includes("hamstring")) return "Posterior de Coxa";
  if (targetMuscle.includes("calv") || targetMuscle.includes("gastrocnemius") || targetMuscle.includes("soleus")) return "Panturrilha";
  if (targetMuscle.includes("trap")) return "Trapézios";
  
  // Upper body
  if (targetMuscle.includes("pectoral")) return "Peito";
  if (targetMuscle.includes("lat") || targetMuscle.includes("back") || targetMuscle.includes("rhomboid")) return "Costas";
  if (targetMuscle.includes("delt") || targetMuscle.includes("rotator")) return "Ombros";
  if (targetMuscle.includes("bicep") || targetMuscle.includes("forearm") || targetMuscle.includes("brachial")) return "Bíceps";
  if (targetMuscle.includes("tricep")) return "Tríceps";
  if (targetMuscle.includes("ab") || targetMuscle.includes("oblique") || targetMuscle.includes("spine") || targetMuscle.includes("erector")) return "Abdômen";
  
  // Check exercise name for stretching/mobility
  if (exerciseName.includes("stretch") || exerciseName.includes("yoga") || exerciseName.includes("mobility")) return "Alongamento";
  
  // Fallback to body part mapping
  return BODY_PART_TO_MUSCLE_GROUP[bodyPart] || "Corpo Inteiro";
}

// GIF base URL - uses configurable API or default ExerciseDB
// Import from config for consistency
export const GIF_BASE_URL = import.meta.env.VITE_EXERCISE_API_URL
  ? `${import.meta.env.VITE_EXERCISE_API_URL}/image/`
  : 'https://v2.exercisedb.io/image/';
