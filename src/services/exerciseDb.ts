// ExerciseDB API Service - Free Open Source Exercise Database
// API: https://www.exercisedb.dev/docs

const API_BASE_URL = "https://www.exercisedb.dev/api/v1";

export interface ExerciseDbExercise {
  id: string;
  name: string;
  gifUrl: string;
  bodyPart: string;
  target: string;
  secondaryMuscles: string[];
  equipment: string;
  instructions: string[];
}

interface SearchResponse {
  success: boolean;
  data: {
    exercises: ExerciseDbExercise[];
    total: number;
    offset: number;
    limit: number;
  };
}

// Cache to avoid repeated API calls
const exerciseCache = new Map<string, ExerciseDbExercise | null>();

// Normalize exercise names for better matching
function normalizeExerciseName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9\s]/g, "") // Remove special chars
    .trim();
}

// Map Portuguese exercise names to English for API search
const PT_TO_EN_MAP: Record<string, string> = {
  // Chest
  "supino reto": "bench press",
  "supino inclinado": "incline bench press",
  "supino declinado": "decline bench press",
  "supino com halteres": "dumbbell bench press",
  "crucifixo": "chest fly",
  "flexao": "push up",
  "flexoes": "push up",
  "crossover": "cable crossover",
  
  // Back
  "puxada frontal": "lat pulldown",
  "puxada aberta": "wide grip lat pulldown",
  "puxada fechada": "close grip lat pulldown",
  "remada curvada": "bent over row",
  "remada baixa": "seated cable row",
  "remada unilateral": "one arm dumbbell row",
  "remada cavalinho": "t bar row",
  "levantamento terra": "deadlift",
  "levantamento terra romeno": "romanian deadlift",
  "barra fixa": "pull up",
  "pullover": "pullover",
  
  // Shoulders
  "desenvolvimento": "shoulder press",
  "desenvolvimento militar": "military press",
  "elevacao lateral": "lateral raise",
  "elevacao frontal": "front raise",
  "crucifixo inverso": "reverse fly",
  "face pull": "face pull",
  "encolhimento": "shrug",
  
  // Arms
  "rosca direta": "barbell curl",
  "rosca alternada": "alternating dumbbell curl",
  "rosca martelo": "hammer curl",
  "rosca concentrada": "concentration curl",
  "rosca scott": "preacher curl",
  "triceps pulley": "tricep pushdown",
  "triceps corda": "rope pushdown",
  "triceps testa": "skull crusher",
  "triceps frances": "overhead tricep extension",
  "mergulho": "dip",
  
  // Legs
  "agachamento": "squat",
  "agachamento livre": "barbell squat",
  "agachamento goblet": "goblet squat",
  "agachamento hack": "hack squat",
  "leg press": "leg press",
  "cadeira extensora": "leg extension",
  "mesa flexora": "leg curl",
  "stiff": "stiff leg deadlift",
  "afundo": "lunge",
  "passada": "walking lunge",
  "panturrilha": "calf raise",
  "elevacao pelvica": "hip thrust",
  "abdutora": "hip abduction",
  "adutora": "hip adduction",
  
  // Core
  "abdominal": "crunch",
  "abdominal infra": "reverse crunch",
  "prancha": "plank",
  "prancha lateral": "side plank",
  "elevacao de pernas": "leg raise",
  "russian twist": "russian twist",
};

function translateToEnglish(ptName: string): string {
  const normalized = normalizeExerciseName(ptName);
  
  // Check direct match first
  for (const [pt, en] of Object.entries(PT_TO_EN_MAP)) {
    if (normalized.includes(normalizeExerciseName(pt))) {
      return en;
    }
  }
  
  // Return original if no translation found
  return ptName;
}

export async function searchExercise(exerciseName: string): Promise<ExerciseDbExercise | null> {
  const cacheKey = normalizeExerciseName(exerciseName);
  
  // Check cache first
  if (exerciseCache.has(cacheKey)) {
    return exerciseCache.get(cacheKey)!;
  }
  
  try {
    // Translate to English for API search
    const englishName = translateToEnglish(exerciseName);
    const searchTerm = encodeURIComponent(englishName.toLowerCase());
    
    const response = await fetch(
      `${API_BASE_URL}/exercises/search?q=${searchTerm}&limit=5`,
      {
        headers: {
          "Accept": "application/json",
        },
      }
    );
    
    if (!response.ok) {
      console.warn(`ExerciseDB API error: ${response.status}`);
      exerciseCache.set(cacheKey, null);
      return null;
    }
    
    const data: SearchResponse = await response.json();
    
    if (data.success && data.data.exercises.length > 0) {
      // Find best match
      const exercise = data.data.exercises[0];
      exerciseCache.set(cacheKey, exercise);
      return exercise;
    }
    
    // Try with first two words if full search failed
    const words = englishName.split(" ").slice(0, 2).join(" ");
    if (words !== englishName) {
      const fallbackResponse = await fetch(
        `${API_BASE_URL}/exercises/search?q=${encodeURIComponent(words)}&limit=3`,
        {
          headers: {
            "Accept": "application/json",
          },
        }
      );
      
      if (fallbackResponse.ok) {
        const fallbackData: SearchResponse = await fallbackResponse.json();
        if (fallbackData.success && fallbackData.data.exercises.length > 0) {
          const exercise = fallbackData.data.exercises[0];
          exerciseCache.set(cacheKey, exercise);
          return exercise;
        }
      }
    }
    
    exerciseCache.set(cacheKey, null);
    return null;
  } catch (error) {
    console.error("Error fetching from ExerciseDB:", error);
    exerciseCache.set(cacheKey, null);
    return null;
  }
}

// Get GIF URL for an exercise
export function getExerciseGifUrl(exercise: ExerciseDbExercise): string {
  // The API provides gifUrl directly
  if (exercise.gifUrl) {
    return exercise.gifUrl;
  }
  
  // Fallback to image service if gifUrl not available
  return `https://www.exercisedb.dev/image/${exercise.id}`;
}

// Preload common exercises to cache
export async function preloadCommonExercises(): Promise<void> {
  const commonExercises = [
    "bench press",
    "squat",
    "deadlift",
    "lat pulldown",
    "shoulder press",
    "bicep curl",
    "tricep extension",
    "leg press",
  ];
  
  await Promise.all(
    commonExercises.map((name) => searchExercise(name))
  );
}
