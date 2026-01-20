// ExerciseDB API Service - Supports self-hosted or public API
// Configure VITE_EXERCISE_API_URL in environment for your own API

import { EXERCISE_API_URL, API_ENDPOINTS, GIF_BASE_URL, isUsingCustomApi } from "@/config/exerciseApi";
import { supabase } from "@/integrations/supabase/client";

// Re-export config values for convenience
export { isUsingCustomApi, GIF_BASE_URL, EXERCISE_API_URL } from "@/config/exerciseApi";

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
  "supino reto com barra": "barbell bench press",
  "supino reto com halteres": "dumbbell bench press",
  "supino inclinado": "incline bench press",
  "supino inclinado com barra": "incline barbell bench press",
  "supino inclinado com halteres": "incline dumbbell bench press",
  "supino inclinado halteres": "incline dumbbell bench press",
  "supino declinado": "decline bench press",
  "supino com halteres": "dumbbell bench press",
  "supino halter": "dumbbell bench press",
  "supino maquina": "chest press machine",
  "crucifixo": "chest fly",
  "crucifixo inclinado": "incline dumbbell fly",
  "crucifixo reto": "dumbbell fly",
  "crucifixo com halteres": "dumbbell fly",
  "crucifixo maquina": "pec deck fly",
  "crucifixo inverso": "reverse fly",
  "crucifixo inverso maquina": "reverse machine fly",
  "crucifixo invertido": "reverse fly",
  "flexao": "push up",
  "flexoes": "push up",
  "flexao de braco": "push up",
  "flexao de bracos": "push up",
  "flexao diamante": "diamond push up",
  "flexao inclinada": "incline push up",
  "flexao declinada": "decline push up",
  "crossover": "cable crossover",
  "cross over": "cable crossover",
  "crossover na polia": "cable crossover",
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
  "pulldown pegada neutra": "neutral grip lat pulldown",
  "remada curvada": "bent over row",
  "remada baixa": "seated cable row",
  "remada sentada": "seated cable row",
  "remada unilateral": "one arm dumbbell row",
  "remada serrote": "one arm dumbbell row",
  "remada cavalinho": "t bar row",
  "remada maquina": "seated row machine",
  "remada alta": "upright row",
  "remada alta com barra": "barbell upright row",
  "remada articulada": "t bar row",
  "remada com barra": "barbell row",
  "remada com halter": "dumbbell row",
  "levantamento terra": "deadlift",
  "levantamento terra romeno": "romanian deadlift",
  "terra romeno": "romanian deadlift",
  "stiff": "stiff leg deadlift",
  "stiff com halteres": "dumbbell stiff leg deadlift",
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
  "desenvolvimento com halteres": "dumbbell shoulder press",
  "desenvolvimento maquina": "machine shoulder press",
  "desenvolvimento arnold": "arnold press",
  "arnold press": "arnold press",
  "elevacao lateral": "lateral raise",
  "elevacao lateral halteres": "dumbbell lateral raise",
  "elevacao lateral cabo": "cable lateral raise",
  "elevacao lateral maquina": "machine lateral raise",
  "elevacao frontal": "front raise",
  "elevacao frontal halter": "dumbbell front raise",
  "elevacao frontal halteres": "dumbbell front raise",
  "elevacao frontal barra": "barbell front raise",
  "fly inverso": "reverse fly",
  "face pull": "face pull",
  "face pull na polia": "cable face pull",
  "encolhimento": "shrug",
  "encolhimento halteres": "dumbbell shrug",
  "encolhimento com halteres": "dumbbell shrug",
  "encolhimento barra": "barbell shrug",
  "encolhimento com barra": "barbell shrug",
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
  "triceps corda na polia": "cable rope pushdown",
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
  "mergulho no banco": "bench dip",
  "mergulho entre bancos": "bench dip",
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
  "agachamento com barra": "barbell squat",
  "agachamento goblet": "goblet squat",
  "agachamento hack": "hack squat",
  "agachamento smith": "smith machine squat",
  "agachamento frontal": "front squat",
  "agachamento frontal barra": "barbell front squat",
  "agachamento bulgaro": "bulgarian split squat",
  "agachamento sumo": "sumo squat",
  "agachamento sumo largo": "wide stance sumo squat",
  "agachamento unilateral": "single leg squat",
  "agachamento sissy": "sissy squat",
  "sissy squat": "sissy squat",
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
  "elevacao pelica": "hip thrust",
  "hip thrust": "hip thrust",
  "hip thrust com barra": "barbell hip thrust",
  "ponte gluteo": "glute bridge",
  "ponte de gluteo": "glute bridge",
  "glute bridge": "glute bridge",
  "gluteo maquina": "glute machine",
  "kickback gluteo": "glute kickback",
  "kickback na polia": "cable glute kickback",
  "coice gluteo": "glute kickback",
  "gluteo cabo": "cable glute kickback",
  "abdutora": "hip abduction",
  "abdutora maquina": "hip abduction machine",
  "abducao de quadril": "hip abduction",
  "abducao de quadril deitado": "lying hip abduction",
  "adutora": "hip adduction",
  "adutora maquina": "hip adduction machine",
  "aducao com elastico": "resistance band hip adduction",
  "aducao na maquina": "hip adduction machine",
  "agachamento gluteo": "glute squat",
  "cadeira abdutora": "hip abduction machine",
  "cadeira adutora": "hip adduction machine",
  
  // Legs - Calves / Pernas - Panturrilha
  "panturrilha": "calf raise",
  "panturrilha em pe": "standing calf raise",
  "elevacao de panturrilha em pe": "standing calf raise",
  "panturrilha sentado": "seated calf raise",
  "elevacao de panturrilha sentado": "seated calf raise",
  "panturrilha maquina": "calf press machine",
  "panturrilha leg press": "leg press calf raise",
  "panturrilha no leg press": "leg press calf raise",
  "panturrilha unilateral": "single leg calf raise",
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
  "abdominal crunch": "crunch",
  "crunch na polia alta": "cable crunch",
  "prancha": "plank",
  "prancha frontal": "plank",
  "prancha lateral": "side plank",
  "prancha isometrica": "plank",
  "prancha com elevacao": "plank shoulder tap",
  "elevacao de pernas": "leg raise",
  "elevacao de pernas suspenso": "hanging leg raise",
  "leg raise suspenso": "hanging leg raise",
  "elevacao de pernas deitado": "lying leg raise",
  "russian twist": "russian twist",
  "rotacao russa": "russian twist",
  "mountain climber": "mountain climber",
  "mountain climbers": "mountain climber",
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
    // 1. First, try to find in local database (exercise_gifs table)
    const localResult = await searchLocalDatabase(exerciseName);
    if (localResult) {
      exerciseCache.set(cacheKey, localResult);
      return localResult;
    }

    // 2. Fallback to external API
    const englishName = translateToEnglish(exerciseName);
    
    const response = await fetch(
      API_ENDPOINTS.search(englishName.toLowerCase(), 5),
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
      const exercise = data.data.exercises[0];
      exerciseCache.set(cacheKey, exercise);
      return exercise;
    }
    
    // Try with first two words if full search failed
    const words = englishName.split(" ").slice(0, 2).join(" ");
    if (words !== englishName) {
      const fallbackResponse = await fetch(
        API_ENDPOINTS.search(words, 3),
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

// Search in local exercise_gifs database first
async function searchLocalDatabase(exerciseName: string): Promise<ExerciseDbExercise | null> {
  try {
    const normalizedName = normalizeExerciseName(exerciseName);
    
    // Try exact match first
    const { data, error } = await supabase
      .from('exercise_gifs')
      .select('*')
      .eq('status', 'active')
      .or(`exercise_name_pt.ilike.%${exerciseName}%,exercise_name_en.ilike.%${exerciseName}%`)
      .not('gif_url', 'is', null)
      .limit(1)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    // Convert to ExerciseDbExercise format
    return {
      id: data.exercise_db_id || data.id,
      name: data.exercise_name_en,
      gifUrl: data.gif_url || '',
      bodyPart: data.body_parts?.[0] || '',
      target: data.target_muscles?.[0] || '',
      secondaryMuscles: data.secondary_muscles || [],
      equipment: data.equipments?.[0] || 'body weight',
      instructions: data.instructions || [],
    };
  } catch (error) {
    console.warn('Error searching local database:', error);
    return null;
  }
}

// Get GIF URL for an exercise
export function getExerciseGifUrl(exercise: ExerciseDbExercise): string {
  // The API provides gifUrl directly
  if (exercise.gifUrl) {
    return exercise.gifUrl;
  }
  
  // Fallback to configurable GIF base URL
  return API_ENDPOINTS.getGifUrl(exercise.id);
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

// Sync all exercises from API to local database
// Use this with your own ExerciseDB API for 5000+ exercises
export async function syncAllExercisesFromApi(
  onProgress?: (current: number, total: number) => void
): Promise<{ success: number; failed: number }> {
  const result = { success: 0, failed: 0 };
  
  if (!isUsingCustomApi) {
    console.warn('Sync is only recommended with your own ExerciseDB API');
  }
  
  try {
    // Fetch exercises in batches
    let offset = 0;
    const limit = 100;
    let hasMore = true;
    const allExercises: ExerciseDbExercise[] = [];
    
    while (hasMore && offset < 5000) {
      const response = await fetch(
        API_ENDPOINTS.listAll(offset, limit),
        {
          headers: { "Accept": "application/json" },
        }
      );
      
      if (!response.ok) {
        console.error('Failed to fetch exercises batch:', response.status);
        break;
      }
      
      const data = await response.json();
      const exercises = data.success ? data.data.exercises : data;
      
      if (!exercises || exercises.length === 0) {
        hasMore = false;
      } else {
        allExercises.push(...exercises);
        offset += limit;
        
        if (onProgress) {
          onProgress(allExercises.length, 5000);
        }
        
        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 100));
      }
    }
    
    console.log(`Fetched ${allExercises.length} exercises from API`);
    
    // Get existing exercises
    const { data: existing } = await supabase
      .from('exercise_gifs')
      .select('exercise_db_id, exercise_name_en');
    
    const existingIds = new Set(
      (existing || []).filter(e => e.exercise_db_id).map(e => e.exercise_db_id)
    );
    
    // Filter new exercises
    const newExercises = allExercises.filter(ex => !existingIds.has(ex.id));
    
    console.log(`${newExercises.length} new exercises to insert`);
    
    // Insert in batches
    const batchSize = 50;
    for (let i = 0; i < newExercises.length; i += batchSize) {
      const batch = newExercises.slice(i, i + batchSize);
      
      const toInsert = batch.map(ex => ({
        exercise_name_pt: ex.name.charAt(0).toUpperCase() + ex.name.slice(1),
        exercise_name_en: ex.name,
        gif_url: ex.gifUrl || API_ENDPOINTS.getGifUrl(ex.id),
        muscle_group: [getMuscleGroup(ex.bodyPart, ex.target)],
        status: 'active',
        api_source: isUsingCustomApi ? 'custom-api' : 'exercisedb-api',
        exercise_db_id: ex.id,
        target_muscles: [ex.target],
        secondary_muscles: ex.secondaryMuscles || [],
        body_parts: [ex.bodyPart],
        equipments: [ex.equipment],
        instructions: ex.instructions || [],
        last_checked_at: new Date().toISOString(),
      }));
      
      const { error } = await supabase.from('exercise_gifs').insert(toInsert);
      
      if (error) {
        console.error('Batch insert error:', error);
        result.failed += batch.length;
      } else {
        result.success += batch.length;
      }
      
      if (onProgress) {
        onProgress(i + batch.length, newExercises.length);
      }
    }
    
    return result;
  } catch (error) {
    console.error('Sync error:', error);
    return result;
  }
}

// Helper to get muscle group from body part and target
function getMuscleGroup(bodyPart: string, target: string): string {
  const bp = bodyPart?.toLowerCase() || '';
  const t = target?.toLowerCase() || '';
  
  if (t.includes('glute')) return 'Glúteos';
  if (t.includes('quad') || t.includes('hamstring') || bp.includes('leg')) return 'Pernas';
  if (t.includes('pec') || bp.includes('chest')) return 'Peito';
  if (t.includes('lat') || t.includes('trap') || bp.includes('back')) return 'Costas';
  if (t.includes('delt') || bp.includes('shoulder')) return 'Ombros';
  if (t.includes('bicep')) return 'Bíceps';
  if (t.includes('tricep')) return 'Tríceps';
  if (t.includes('ab') || bp.includes('waist')) return 'Abdômen';
  if (bp.includes('cardio')) return 'Cardio';
  
  return 'Corpo Inteiro';
}

// Check if API is available
export async function checkApiStatus(): Promise<{ available: boolean; isCustom: boolean }> {
  try {
    const response = await fetch(API_ENDPOINTS.search('test', 1), {
      headers: { "Accept": "application/json" },
    });
    
    return {
      available: response.ok,
      isCustom: isUsingCustomApi,
    };
  } catch {
    return { available: false, isCustom: isUsingCustomApi };
  }
}
