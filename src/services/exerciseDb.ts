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
  // Chest / Peito
  "supino reto": "bench press",
  "supino inclinado": "incline bench press",
  "supino declinado": "decline bench press",
  "supino com halteres": "dumbbell bench press",
  "supino halter": "dumbbell bench press",
  "supino maquina": "chest press machine",
  "crucifixo": "chest fly",
  "crucifixo inclinado": "incline dumbbell fly",
  "crucifixo reto": "dumbbell fly",
  "crucifixo maquina": "pec deck fly",
  "flexao": "push up",
  "flexoes": "push up",
  "flexao de bracos": "push up",
  "flexao diamante": "diamond push up",
  "flexao inclinada": "incline push up",
  "flexao declinada": "decline push up",
  "crossover": "cable crossover",
  "crossover alto": "high cable crossover",
  "crossover baixo": "low cable crossover",
  "peck deck": "pec deck fly",
  "fly maquina": "pec deck fly",
  "pullover peito": "dumbbell pullover",
  
  // Back / Costas
  "puxada frontal": "lat pulldown",
  "puxada aberta": "wide grip lat pulldown",
  "puxada fechada": "close grip lat pulldown",
  "puxada neutra": "neutral grip lat pulldown",
  "puxada triangulo": "close grip lat pulldown",
  "puxada alta": "lat pulldown",
  "remada curvada": "bent over row",
  "remada baixa": "seated cable row",
  "remada sentada": "seated cable row",
  "remada unilateral": "one arm dumbbell row",
  "remada serrote": "one arm dumbbell row",
  "remada cavalinho": "t bar row",
  "remada maquina": "seated row machine",
  "remada alta": "upright row",
  "remada articulada": "t bar row",
  "remada com barra": "barbell row",
  "remada com halter": "dumbbell row",
  "levantamento terra": "deadlift",
  "levantamento terra romeno": "romanian deadlift",
  "terra romeno": "romanian deadlift",
  "stiff": "stiff leg deadlift",
  "barra fixa": "pull up",
  "barra fixa supinada": "chin up",
  "barra fixa pronada": "pull up",
  "chin up": "chin up",
  "pullover": "pullover",
  "pullover costas": "dumbbell pullover",
  "hiperextensao": "back extension",
  "extensao lombar": "back extension",
  "good morning": "good morning",
  "bom dia": "good morning",
  "superman": "superman exercise",
  "face pull costas": "face pull",
  
  // Shoulders / Ombros
  "desenvolvimento": "shoulder press",
  "desenvolvimento militar": "military press",
  "desenvolvimento halteres": "dumbbell shoulder press",
  "desenvolvimento maquina": "machine shoulder press",
  "desenvolvimento arnold": "arnold press",
  "arnold press": "arnold press",
  "elevacao lateral": "lateral raise",
  "elevacao lateral halteres": "dumbbell lateral raise",
  "elevacao lateral cabo": "cable lateral raise",
  "elevacao lateral maquina": "machine lateral raise",
  "elevacao frontal": "front raise",
  "elevacao frontal halter": "dumbbell front raise",
  "elevacao frontal barra": "barbell front raise",
  "crucifixo inverso": "reverse fly",
  "crucifixo invertido": "reverse fly",
  "fly inverso": "reverse fly",
  "face pull": "face pull",
  "encolhimento": "shrug",
  "encolhimento halteres": "dumbbell shrug",
  "encolhimento barra": "barbell shrug",
  "remada alta ombros": "upright row",
  "ombro posterior": "rear delt fly",
  "deltoides posterior": "rear delt fly",
  
  // Arms - Biceps / Braços - Bíceps
  "rosca direta": "barbell curl",
  "rosca direta barra": "barbell curl",
  "rosca alternada": "alternating dumbbell curl",
  "rosca simultanea": "dumbbell curl",
  "rosca martelo": "hammer curl",
  "rosca concentrada": "concentration curl",
  "rosca scott": "preacher curl",
  "rosca banco scott": "preacher curl",
  "rosca inclinada": "incline dumbbell curl",
  "rosca cabo": "cable curl",
  "rosca corda": "rope cable curl",
  "rosca inversa": "reverse curl",
  "rosca 21": "21s bicep curl",
  "rosca punho": "wrist curl",
  "rosca spider": "spider curl",
  "curl biceps": "bicep curl",
  
  // Arms - Triceps / Braços - Tríceps
  "triceps pulley": "tricep pushdown",
  "triceps puxada": "tricep pushdown",
  "triceps corda": "rope pushdown",
  "triceps barra": "tricep pushdown",
  "triceps testa": "skull crusher",
  "triceps frances": "overhead tricep extension",
  "triceps frances halter": "dumbbell overhead tricep extension",
  "triceps frances cabo": "cable overhead tricep extension",
  "triceps coice": "tricep kickback",
  "triceps banco": "bench dip",
  "triceps mergulho": "dip",
  "mergulho": "dip",
  "mergulho paralelas": "dip",
  "paralelas": "dip",
  "triceps unilateral": "single arm tricep pushdown",
  "flexao triceps": "close grip push up",
  "supino fechado": "close grip bench press",
  
  // Arms - Forearms / Antebraço
  "rosca de punho": "wrist curl",
  "flexao de punho": "wrist curl",
  "extensao de punho": "reverse wrist curl",
  "hand grip": "grip strengthener",
  
  // Legs - Quadriceps / Pernas - Quadríceps
  "agachamento": "squat",
  "agachamento livre": "barbell squat",
  "agachamento barra": "barbell squat",
  "agachamento goblet": "goblet squat",
  "agachamento hack": "hack squat",
  "agachamento smith": "smith machine squat",
  "agachamento frontal": "front squat",
  "agachamento bulgaro": "bulgarian split squat",
  "agachamento sumô": "sumo squat",
  "agachamento sumo": "sumo squat",
  "agachamento unilateral": "single leg squat",
  "agachamento sissy": "sissy squat",
  "leg press": "leg press",
  "leg press 45": "leg press",
  "leg press horizontal": "horizontal leg press",
  "cadeira extensora": "leg extension",
  "extensora": "leg extension",
  "extensao de pernas": "leg extension",
  "afundo": "lunge",
  "afundo frontal": "forward lunge",
  "afundo reverso": "reverse lunge",
  "afundo lateral": "side lunge",
  "passada": "walking lunge",
  "passada caminhando": "walking lunge",
  "avanco": "lunge",
  "pistol squat": "pistol squat",
  
  // Legs - Hamstrings / Pernas - Posterior
  "mesa flexora": "leg curl",
  "flexora deitada": "lying leg curl",
  "flexora sentada": "seated leg curl",
  "flexora em pe": "standing leg curl",
  "cadeira flexora": "seated leg curl",
  "stiff pernas": "stiff leg deadlift",
  "stiff unilateral": "single leg romanian deadlift",
  "terra romeno unilateral": "single leg romanian deadlift",
  
  // Legs - Glutes / Pernas - Glúteos
  "elevacao pelvica": "hip thrust",
  "hip thrust": "hip thrust",
  "ponte gluteo": "glute bridge",
  "glute bridge": "glute bridge",
  "gluteo maquina": "glute machine",
  "kickback gluteo": "glute kickback",
  "coice gluteo": "glute kickback",
  "gluteo cabo": "cable glute kickback",
  "abdutora": "hip abduction",
  "abdutora maquina": "hip abduction machine",
  "adutora": "hip adduction",
  "adutora maquina": "hip adduction machine",
  "agachamento gluteo": "glute squat",
  "cadeira abdutora": "hip abduction machine",
  "cadeira adutora": "hip adduction machine",
  
  // Legs - Calves / Pernas - Panturrilha
  "panturrilha": "calf raise",
  "panturrilha em pe": "standing calf raise",
  "panturrilha sentado": "seated calf raise",
  "panturrilha maquina": "calf press machine",
  "panturrilha leg press": "leg press calf raise",
  "gemeos": "calf raise",
  "elevacao de calcanhar": "calf raise",
  
  // Core / Abdomen
  "abdominal": "crunch",
  "abdominal reto": "crunch",
  "abdominal infra": "reverse crunch",
  "abdominal obliquo": "oblique crunch",
  "abdominal bicicleta": "bicycle crunch",
  "abdominal maquina": "ab crunch machine",
  "abdominal supra": "crunch",
  "abdominal canivete": "v up",
  "abdominal na bola": "stability ball crunch",
  "prancha": "plank",
  "prancha frontal": "plank",
  "prancha lateral": "side plank",
  "prancha isometrica": "plank",
  "prancha com elevacao": "plank shoulder tap",
  "elevacao de pernas": "leg raise",
  "elevacao de pernas suspenso": "hanging leg raise",
  "elevacao de pernas deitado": "lying leg raise",
  "russian twist": "russian twist",
  "rotacao russa": "russian twist",
  "mountain climber": "mountain climber",
  "escalador": "mountain climber",
  "roda abdominal": "ab wheel rollout",
  "ab wheel": "ab wheel rollout",
  "dead bug": "dead bug",
  "hollow body": "hollow body hold",
  "bird dog": "bird dog",
  "crunch": "crunch",
  "sit up": "sit up",
  
  // Cardio
  "esteira": "treadmill",
  "bicicleta ergometrica": "stationary bike",
  "eliptico": "elliptical",
  "transport": "elliptical",
  "remo": "rowing machine",
  "remador": "rowing machine",
  "escada": "stair climber",
  "corda": "jump rope",
  "pular corda": "jump rope",
  "corrida": "running",
  "caminhada": "walking",
  "burpee": "burpee",
  "jumping jack": "jumping jack",
  "polichinelo": "jumping jack",
  "box jump": "box jump",
  "salto caixa": "box jump",
  "sprint": "sprint",
  "hiit": "high intensity interval training",
  
  // Functional / Olympic
  "levantamento olimpico": "clean and jerk",
  "arranco": "snatch",
  "clean": "power clean",
  "clean and press": "clean and press",
  "kettlebell swing": "kettlebell swing",
  "swing kettlebell": "kettlebell swing",
  "turkish get up": "turkish get up",
  "thruster": "thruster",
  "wall ball": "wall ball",
  "battle rope": "battle rope",
  "corda naval": "battle rope",
  "farmer walk": "farmer walk",
  "caminhada do fazendeiro": "farmer walk",
  "sled push": "sled push",
  "empurrar treno": "sled push",
  "tire flip": "tire flip",
  "virar pneu": "tire flip",
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
