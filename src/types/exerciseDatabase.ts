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

// All available muscle groups (canonical list)
export const ALL_MUSCLE_GROUPS = [
  "Peito",
  "Costas",
  "Ombros",
  "Bíceps",
  "Tríceps",
  "Antebraço",
  "Abdômen",
  "Perna",
  "Quadríceps",
  "Posterior de Coxa",
  "Glúteos",
  "Panturrilha",
  "Adutores",
  "Trapézios",
  "Cardio",
  "Alongamento",
  "Corpo Inteiro",
] as const;

// Leg sub-groups that should also get "Perna" meta-category
const LEG_SUBGROUPS = ["Quadríceps", "Posterior de Coxa", "Glúteos", "Panturrilha", "Adutores"];

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
  "lower arms": "Antebraço", // Fixed: was "Bíceps"
  
  // Core
  "waist": "Abdômen",
  
  // Other
  "cardio": "Cardio",
  "neck": "Trapézios",
};

// Get muscle groups (plural) from target muscles and body parts
// Returns array with specific group + meta-category when applicable
export function getMuscleGroupsFromExercise(exercise: ExerciseFromDb): string[] {
  const targetMuscle = exercise.targetMuscles[0]?.toLowerCase() || "";
  const bodyPart = exercise.bodyParts[0]?.toLowerCase() || "";
  const exerciseName = exercise.name?.toLowerCase() || "";
  
  let primaryGroup = "Corpo Inteiro";
  
  // === FOREARM / ANTEBRAÇO (NEW) ===
  if (
    targetMuscle.includes("forearm") ||
    targetMuscle.includes("wrist") ||
    targetMuscle.includes("brachioradialis") ||
    targetMuscle.includes("grip") ||
    exerciseName.includes("wrist curl") ||
    exerciseName.includes("forearm") ||
    exerciseName.includes("hand grip") ||
    exerciseName.includes("reverse curl")
  ) {
    return ["Antebraço"];
  }
  
  // === ADDUCTORS / ADUTORES (NEW) ===
  if (
    targetMuscle.includes("adductor") ||
    targetMuscle.includes("inner thigh") ||
    exerciseName.includes("adduction") ||
    exerciseName.includes("hip adduction") ||
    exerciseName.includes("inner thigh")
  ) {
    return ["Perna", "Adutores"];
  }
  
  // === LEG GROUPS with meta-category "Perna" ===
  if (targetMuscle.includes("glute")) {
    primaryGroup = "Glúteos";
    return ["Perna", primaryGroup];
  }
  if (targetMuscle.includes("quad")) {
    primaryGroup = "Quadríceps";
    return ["Perna", primaryGroup];
  }
  if (targetMuscle.includes("hamstring")) {
    primaryGroup = "Posterior de Coxa";
    return ["Perna", primaryGroup];
  }
  if (
    targetMuscle.includes("calv") || 
    targetMuscle.includes("gastrocnemius") || 
    targetMuscle.includes("soleus")
  ) {
    primaryGroup = "Panturrilha";
    return ["Perna", primaryGroup];
  }
  
  // === UPPER BODY (no meta-category needed) ===
  if (targetMuscle.includes("trap")) return ["Trapézios"];
  if (targetMuscle.includes("pectoral")) return ["Peito"];
  if (
    targetMuscle.includes("lat") || 
    targetMuscle.includes("back") || 
    targetMuscle.includes("rhomboid")
  ) return ["Costas"];
  if (targetMuscle.includes("delt") || targetMuscle.includes("rotator")) return ["Ombros"];
  if (
    targetMuscle.includes("bicep") || 
    targetMuscle.includes("brachial")
  ) return ["Bíceps"];
  if (targetMuscle.includes("tricep")) return ["Tríceps"];
  if (
    targetMuscle.includes("ab") || 
    targetMuscle.includes("oblique") || 
    targetMuscle.includes("spine") || 
    targetMuscle.includes("erector")
  ) return ["Abdômen"];
  
  // === STRETCHING / MOBILITY ===
  if (
    exerciseName.includes("stretch") || 
    exerciseName.includes("yoga") || 
    exerciseName.includes("mobility")
  ) return ["Alongamento"];
  
  // === FALLBACK to body part mapping ===
  const fallbackGroup = BODY_PART_TO_MUSCLE_GROUP[bodyPart];
  if (fallbackGroup) {
    // If it's a leg sub-group, also add "Perna"
    if (LEG_SUBGROUPS.includes(fallbackGroup)) {
      return ["Perna", fallbackGroup];
    }
    return [fallbackGroup];
  }
  
  return ["Corpo Inteiro"];
}

// Legacy function for backwards compatibility - returns first group only
export function getMuscleGroupFromExercise(exercise: ExerciseFromDb): string {
  return getMuscleGroupsFromExercise(exercise)[0];
}

// GIF base URL - uses configurable API or default ExerciseDB
// Import from config for consistency
export const GIF_BASE_URL = import.meta.env.VITE_EXERCISE_API_URL
  ? `${import.meta.env.VITE_EXERCISE_API_URL}/image/`
  : 'https://v2.exercisedb.io/image/';
