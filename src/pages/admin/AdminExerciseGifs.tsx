import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { 
  ArrowLeft, 
  Plus, 
  Pencil, 
  Trash2, 
  Search,
  Image,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  ExternalLink,
  Download,
  AlertTriangle,
  FileSearch,
  FileText,
  Upload,
  Zap,
  Database,
  CloudDownload,
  Save,
  X,
  Wand2,
  Expand
} from "lucide-react";
import { generateGifCoverageReportPdf } from "@/lib/generateGifCoverageReportPdf";
import exercisesDatabase from "@/data/exercisesDatabase.json";
import { ExerciseFromDb, getMuscleGroupFromExercise, GIF_BASE_URL } from "@/types/exerciseDatabase";
import { syncAllExercisesFromApi, checkApiStatus, isUsingCustomApi } from "@/services/exerciseDb";
import { Progress } from "@/components/ui/progress";
import { ExerciseGifCard } from "@/components/admin/ExerciseGifCard";
import { BatchActionsCard } from "@/components/admin/BatchActionsCard";
import { BatchRenameModal } from "@/components/admin/BatchRenameModal";
import { BrokenUrlsModal } from "@/components/admin/BrokenUrlsModal";
import { MuscleGroupModal } from "@/components/admin/MuscleGroupModal";

interface ExerciseGif {
  id: string;
  exercise_name_pt: string;
  exercise_name_en: string;
  gif_url: string | null;
  muscle_group: string;
  status: "active" | "pending" | "missing";
  api_source: string | null;
  last_checked_at: string | null;
  created_at: string;
  exercise_db_id?: string | null;
  target_muscles?: string[] | null;
  secondary_muscles?: string[] | null;
  body_parts?: string[] | null;
  equipments?: string[] | null;
  instructions?: string[] | null;
}

interface MissingExercise {
  name: string;
  protocol_count: number;
  users: string[];
}

// Map Portuguese exercise names to English for API search
const PT_TO_EN_MAP: Record<string, { en: string; group: string }> = {
  // Chest / Peito
  "supino reto": { en: "bench press", group: "Peito" },
  "supino reto com barra": { en: "barbell bench press", group: "Peito" },
  "supino reto com halteres": { en: "dumbbell bench press", group: "Peito" },
  "supino inclinado": { en: "incline bench press", group: "Peito" },
  "supino inclinado com barra": { en: "incline barbell bench press", group: "Peito" },
  "supino inclinado com halteres": { en: "incline dumbbell bench press", group: "Peito" },
  "supino inclinado halteres": { en: "incline dumbbell bench press", group: "Peito" },
  "supino declinado": { en: "decline bench press", group: "Peito" },
  "supino com halteres": { en: "dumbbell bench press", group: "Peito" },
  "supino halter": { en: "dumbbell bench press", group: "Peito" },
  "supino maquina": { en: "chest press machine", group: "Peito" },
  "crucifixo": { en: "chest fly", group: "Peito" },
  "crucifixo inclinado": { en: "incline dumbbell fly", group: "Peito" },
  "crucifixo reto": { en: "dumbbell fly", group: "Peito" },
  "crucifixo com halteres": { en: "dumbbell fly", group: "Peito" },
  "crucifixo maquina": { en: "pec deck fly", group: "Peito" },
  "crucifixo inverso": { en: "reverse fly", group: "Ombros" },
  "crucifixo inverso maquina": { en: "reverse machine fly", group: "Ombros" },
  "crucifixo invertido": { en: "reverse fly", group: "Ombros" },
  "flexao": { en: "push up", group: "Peito" },
  "flexoes": { en: "push up", group: "Peito" },
  "flexao de braco": { en: "push up", group: "Peito" },
  "flexao de bracos": { en: "push up", group: "Peito" },
  "flexao diamante": { en: "diamond push up", group: "Peito" },
  "flexao inclinada": { en: "incline push up", group: "Peito" },
  "flexao declinada": { en: "decline push up", group: "Peito" },
  "crossover": { en: "cable crossover", group: "Peito" },
  "cross over": { en: "cable crossover", group: "Peito" },
  "crossover na polia": { en: "cable crossover", group: "Peito" },
  "crossover alto": { en: "high cable crossover", group: "Peito" },
  "crossover baixo": { en: "low cable crossover", group: "Peito" },
  "peck deck": { en: "pec deck fly", group: "Peito" },
  "fly maquina": { en: "pec deck fly", group: "Peito" },
  "pullover peito": { en: "dumbbell pullover", group: "Peito" },
  
  // Back / Costas
  "puxada frontal": { en: "lat pulldown", group: "Costas" },
  "puxada aberta": { en: "wide grip lat pulldown", group: "Costas" },
  "puxada fechada": { en: "close grip lat pulldown", group: "Costas" },
  "puxada neutra": { en: "neutral grip lat pulldown", group: "Costas" },
  "puxada triangulo": { en: "close grip lat pulldown", group: "Costas" },
  "puxada alta": { en: "lat pulldown", group: "Costas" },
  "pulldown pegada neutra": { en: "neutral grip lat pulldown", group: "Costas" },
  "remada curvada": { en: "bent over row", group: "Costas" },
  "remada baixa": { en: "seated cable row", group: "Costas" },
  "remada sentada": { en: "seated cable row", group: "Costas" },
  "remada unilateral": { en: "one arm dumbbell row", group: "Costas" },
  "remada serrote": { en: "one arm dumbbell row", group: "Costas" },
  "remada cavalinho": { en: "t bar row", group: "Costas" },
  "remada maquina": { en: "seated row machine", group: "Costas" },
  "remada alta": { en: "upright row", group: "Ombros" },
  "remada alta com barra": { en: "barbell upright row", group: "Ombros" },
  "remada articulada": { en: "t bar row", group: "Costas" },
  "remada com barra": { en: "barbell row", group: "Costas" },
  "remada com halter": { en: "dumbbell row", group: "Costas" },
  "levantamento terra": { en: "deadlift", group: "Costas" },
  "levantamento terra romeno": { en: "romanian deadlift", group: "Posterior de Coxa" },
  "terra romeno": { en: "romanian deadlift", group: "Posterior de Coxa" },
  "stiff": { en: "stiff leg deadlift", group: "Posterior de Coxa" },
  "stiff com halteres": { en: "dumbbell stiff leg deadlift", group: "Posterior de Coxa" },
  "barra fixa": { en: "pull up", group: "Costas" },
  "barra fixa supinada": { en: "chin up", group: "Costas" },
  "barra fixa pronada": { en: "pull up", group: "Costas" },
  "chin up": { en: "chin up", group: "Costas" },
  "pullover": { en: "pullover", group: "Costas" },
  "pullover costas": { en: "dumbbell pullover", group: "Costas" },
  "hiperextensao": { en: "back extension", group: "Costas" },
  "extensao lombar": { en: "back extension", group: "Costas" },
  "good morning": { en: "good morning", group: "Posterior de Coxa" },
  "bom dia": { en: "good morning", group: "Posterior de Coxa" },
  "superman": { en: "superman exercise", group: "Costas" },
  "face pull costas": { en: "face pull", group: "Ombros" },
  
  // Shoulders / Ombros
  "desenvolvimento": { en: "shoulder press", group: "Ombros" },
  "desenvolvimento militar": { en: "military press", group: "Ombros" },
  "desenvolvimento halteres": { en: "dumbbell shoulder press", group: "Ombros" },
  "desenvolvimento com halteres": { en: "dumbbell shoulder press", group: "Ombros" },
  "desenvolvimento maquina": { en: "machine shoulder press", group: "Ombros" },
  "desenvolvimento arnold": { en: "arnold press", group: "Ombros" },
  "arnold press": { en: "arnold press", group: "Ombros" },
  "elevacao lateral": { en: "lateral raise", group: "Ombros" },
  "elevacao lateral halteres": { en: "dumbbell lateral raise", group: "Ombros" },
  "elevacao lateral cabo": { en: "cable lateral raise", group: "Ombros" },
  "elevacao lateral maquina": { en: "machine lateral raise", group: "Ombros" },
  "elevacao frontal": { en: "front raise", group: "Ombros" },
  "elevacao frontal halter": { en: "dumbbell front raise", group: "Ombros" },
  "elevacao frontal halteres": { en: "dumbbell front raise", group: "Ombros" },
  "elevacao frontal barra": { en: "barbell front raise", group: "Ombros" },
  "fly inverso": { en: "reverse fly", group: "Ombros" },
  "face pull": { en: "face pull", group: "Ombros" },
  "face pull na polia": { en: "cable face pull", group: "Ombros" },
  "encolhimento": { en: "shrug", group: "Trapézios" },
  "encolhimento halteres": { en: "dumbbell shrug", group: "Trapézios" },
  "encolhimento com halteres": { en: "dumbbell shrug", group: "Trapézios" },
  "encolhimento barra": { en: "barbell shrug", group: "Trapézios" },
  "encolhimento com barra": { en: "barbell shrug", group: "Trapézios" },
  "remada alta ombros": { en: "upright row", group: "Ombros" },
  "ombro posterior": { en: "rear delt fly", group: "Ombros" },
  "deltoides posterior": { en: "rear delt fly", group: "Ombros" },
  
  // Arms - Biceps / Braços - Bíceps
  "rosca direta": { en: "barbell curl", group: "Bíceps" },
  "rosca direta barra": { en: "barbell curl", group: "Bíceps" },
  "rosca alternada": { en: "alternating dumbbell curl", group: "Bíceps" },
  "rosca simultanea": { en: "dumbbell curl", group: "Bíceps" },
  "rosca martelo": { en: "hammer curl", group: "Bíceps" },
  "rosca concentrada": { en: "concentration curl", group: "Bíceps" },
  "rosca scott": { en: "preacher curl", group: "Bíceps" },
  "rosca banco scott": { en: "preacher curl", group: "Bíceps" },
  "rosca inclinada": { en: "incline dumbbell curl", group: "Bíceps" },
  "rosca cabo": { en: "cable curl", group: "Bíceps" },
  "rosca corda": { en: "rope cable curl", group: "Bíceps" },
  "rosca inversa": { en: "reverse curl", group: "Bíceps" },
  "rosca 21": { en: "21s bicep curl", group: "Bíceps" },
  "rosca punho": { en: "wrist curl", group: "Bíceps" },
  "rosca spider": { en: "spider curl", group: "Bíceps" },
  "curl biceps": { en: "bicep curl", group: "Bíceps" },
  
  // Arms - Triceps / Braços - Tríceps
  "triceps pulley": { en: "tricep pushdown", group: "Tríceps" },
  "triceps puxada": { en: "tricep pushdown", group: "Tríceps" },
  "triceps corda": { en: "rope pushdown", group: "Tríceps" },
  "triceps corda na polia": { en: "cable rope pushdown", group: "Tríceps" },
  "triceps barra": { en: "tricep pushdown", group: "Tríceps" },
  "triceps testa": { en: "skull crusher", group: "Tríceps" },
  "triceps frances": { en: "overhead tricep extension", group: "Tríceps" },
  "triceps frances halter": { en: "dumbbell overhead tricep extension", group: "Tríceps" },
  "triceps frances cabo": { en: "cable overhead tricep extension", group: "Tríceps" },
  "triceps coice": { en: "tricep kickback", group: "Tríceps" },
  "triceps banco": { en: "bench dip", group: "Tríceps" },
  "triceps mergulho": { en: "dip", group: "Tríceps" },
  "mergulho": { en: "dip", group: "Tríceps" },
  "mergulho paralelas": { en: "dip", group: "Tríceps" },
  "mergulho no banco": { en: "bench dip", group: "Tríceps" },
  "mergulho entre bancos": { en: "bench dip", group: "Tríceps" },
  "paralelas": { en: "dip", group: "Tríceps" },
  "triceps unilateral": { en: "single arm tricep pushdown", group: "Tríceps" },
  "flexao triceps": { en: "close grip push up", group: "Tríceps" },
  "supino fechado": { en: "close grip bench press", group: "Tríceps" },
  
  // Arms - Forearms / Antebraço
  "rosca de punho": { en: "wrist curl", group: "Bíceps" },
  "flexao de punho": { en: "wrist curl", group: "Bíceps" },
  "extensao de punho": { en: "reverse wrist curl", group: "Bíceps" },
  "hand grip": { en: "grip strengthener", group: "Bíceps" },
  
  // Legs - Quadriceps / Pernas - Quadríceps
  "agachamento": { en: "squat", group: "Quadríceps" },
  "agachamento livre": { en: "barbell squat", group: "Quadríceps" },
  "agachamento barra": { en: "barbell squat", group: "Quadríceps" },
  "agachamento com barra": { en: "barbell squat", group: "Quadríceps" },
  "agachamento goblet": { en: "goblet squat", group: "Quadríceps" },
  "agachamento hack": { en: "hack squat", group: "Quadríceps" },
  "agachamento smith": { en: "smith machine squat", group: "Quadríceps" },
  "agachamento frontal": { en: "front squat", group: "Quadríceps" },
  "agachamento frontal barra": { en: "barbell front squat", group: "Quadríceps" },
  "agachamento bulgaro": { en: "bulgarian split squat", group: "Quadríceps" },
  "agachamento sumo": { en: "sumo squat", group: "Quadríceps" },
  "agachamento sumo largo": { en: "wide stance sumo squat", group: "Quadríceps" },
  "agachamento unilateral": { en: "single leg squat", group: "Quadríceps" },
  "agachamento sissy": { en: "sissy squat", group: "Quadríceps" },
  "sissy squat": { en: "sissy squat", group: "Quadríceps" },
  "leg press": { en: "leg press", group: "Quadríceps" },
  "leg press 45": { en: "leg press", group: "Quadríceps" },
  "leg press horizontal": { en: "horizontal leg press", group: "Quadríceps" },
  "cadeira extensora": { en: "leg extension", group: "Quadríceps" },
  "extensora": { en: "leg extension", group: "Quadríceps" },
  "extensao de pernas": { en: "leg extension", group: "Quadríceps" },
  "afundo": { en: "lunge", group: "Quadríceps" },
  "afundo frontal": { en: "forward lunge", group: "Quadríceps" },
  "afundo reverso": { en: "reverse lunge", group: "Quadríceps" },
  "afundo lateral": { en: "side lunge", group: "Quadríceps" },
  "passada": { en: "walking lunge", group: "Quadríceps" },
  "passada caminhando": { en: "walking lunge", group: "Quadríceps" },
  "avanco": { en: "lunge", group: "Quadríceps" },
  "pistol squat": { en: "pistol squat", group: "Quadríceps" },
  
  // Legs - Hamstrings / Posterior de Coxa
  "mesa flexora": { en: "leg curl", group: "Posterior de Coxa" },
  "flexora deitada": { en: "lying leg curl", group: "Posterior de Coxa" },
  "flexora sentada": { en: "seated leg curl", group: "Posterior de Coxa" },
  "flexora em pe": { en: "standing leg curl", group: "Posterior de Coxa" },
  "cadeira flexora": { en: "seated leg curl", group: "Posterior de Coxa" },
  "stiff pernas": { en: "stiff leg deadlift", group: "Posterior de Coxa" },
  "stiff unilateral": { en: "single leg romanian deadlift", group: "Posterior de Coxa" },
  "terra romeno unilateral": { en: "single leg romanian deadlift", group: "Posterior de Coxa" },
  
  // Legs - Glutes / Glúteos
  "elevacao pelvica": { en: "hip thrust", group: "Glúteos" },
  "elevacao pelica": { en: "hip thrust", group: "Glúteos" },
  "hip thrust": { en: "hip thrust", group: "Glúteos" },
  "hip thrust com barra": { en: "barbell hip thrust", group: "Glúteos" },
  "ponte gluteo": { en: "glute bridge", group: "Glúteos" },
  "ponte de gluteo": { en: "glute bridge", group: "Glúteos" },
  "glute bridge": { en: "glute bridge", group: "Glúteos" },
  "gluteo maquina": { en: "glute machine", group: "Glúteos" },
  "kickback gluteo": { en: "glute kickback", group: "Glúteos" },
  "kickback na polia": { en: "cable glute kickback", group: "Glúteos" },
  "coice gluteo": { en: "glute kickback", group: "Glúteos" },
  "gluteo cabo": { en: "cable glute kickback", group: "Glúteos" },
  "abdutora": { en: "hip abduction", group: "Glúteos" },
  "abdutora maquina": { en: "hip abduction machine", group: "Glúteos" },
  "abducao de quadril": { en: "hip abduction", group: "Glúteos" },
  "abducao de quadril deitado": { en: "lying hip abduction", group: "Glúteos" },
  "adutora": { en: "hip adduction", group: "Quadríceps" },
  "adutora maquina": { en: "hip adduction machine", group: "Quadríceps" },
  "aducao com elastico": { en: "resistance band hip adduction", group: "Quadríceps" },
  "aducao na maquina": { en: "hip adduction machine", group: "Quadríceps" },
  "agachamento gluteo": { en: "glute squat", group: "Glúteos" },
  "cadeira abdutora": { en: "hip abduction machine", group: "Glúteos" },
  "cadeira adutora": { en: "hip adduction machine", group: "Quadríceps" },
  
  // Legs - Calves / Panturrilha
  "panturrilha": { en: "calf raise", group: "Panturrilha" },
  "panturrilha em pe": { en: "standing calf raise", group: "Panturrilha" },
  "elevacao de panturrilha em pe": { en: "standing calf raise", group: "Panturrilha" },
  "panturrilha sentado": { en: "seated calf raise", group: "Panturrilha" },
  "elevacao de panturrilha sentado": { en: "seated calf raise", group: "Panturrilha" },
  "panturrilha maquina": { en: "calf press machine", group: "Panturrilha" },
  "panturrilha leg press": { en: "leg press calf raise", group: "Panturrilha" },
  "panturrilha no leg press": { en: "leg press calf raise", group: "Panturrilha" },
  "panturrilha unilateral": { en: "single leg calf raise", group: "Panturrilha" },
  "gemeos": { en: "calf raise", group: "Panturrilha" },
  "elevacao de calcanhar": { en: "calf raise", group: "Panturrilha" },
  
  // Core / Abdomen
  "abdominal": { en: "crunch", group: "Abdômen" },
  "abdominal reto": { en: "crunch", group: "Abdômen" },
  "abdominal infra": { en: "reverse crunch", group: "Abdômen" },
  "abdominal obliquo": { en: "oblique crunch", group: "Abdômen" },
  "abdominal bicicleta": { en: "bicycle crunch", group: "Abdômen" },
  "abdominal maquina": { en: "ab crunch machine", group: "Abdômen" },
  "abdominal supra": { en: "crunch", group: "Abdômen" },
  "abdominal canivete": { en: "v up", group: "Abdômen" },
  "abdominal na bola": { en: "stability ball crunch", group: "Abdômen" },
  "abdominal crunch": { en: "crunch", group: "Abdômen" },
  "crunch na polia alta": { en: "cable crunch", group: "Abdômen" },
  "prancha": { en: "plank", group: "Core" },
  "prancha frontal": { en: "plank", group: "Core" },
  "prancha lateral": { en: "side plank", group: "Core" },
  "prancha isometrica": { en: "plank", group: "Core" },
  "prancha com elevacao": { en: "plank shoulder tap", group: "Core" },
  "elevacao de pernas": { en: "leg raise", group: "Abdômen" },
  "elevacao de pernas suspenso": { en: "hanging leg raise", group: "Abdômen" },
  "leg raise suspenso": { en: "hanging leg raise", group: "Abdômen" },
  "elevacao de pernas deitado": { en: "lying leg raise", group: "Abdômen" },
  "russian twist": { en: "russian twist", group: "Abdômen" },
  "rotacao russa": { en: "russian twist", group: "Abdômen" },
  "mountain climber": { en: "mountain climber", group: "Core" },
  "mountain climbers": { en: "mountain climber", group: "Core" },
  "escalador": { en: "mountain climber", group: "Core" },
  "roda abdominal": { en: "ab wheel rollout", group: "Abdômen" },
  "ab wheel": { en: "ab wheel rollout", group: "Abdômen" },
  "dead bug": { en: "dead bug", group: "Core" },
  "hollow body": { en: "hollow body hold", group: "Core" },
  "bird dog": { en: "bird dog", group: "Core" },
  "crunch": { en: "crunch", group: "Abdômen" },
  "sit up": { en: "sit up", group: "Abdômen" },
  
  // Cardio
  "esteira": { en: "treadmill", group: "Cardio" },
  "bicicleta ergometrica": { en: "stationary bike", group: "Cardio" },
  "eliptico": { en: "elliptical", group: "Cardio" },
  "transport": { en: "elliptical", group: "Cardio" },
  "remo": { en: "rowing machine", group: "Cardio" },
  "remador": { en: "rowing machine", group: "Cardio" },
  "escada": { en: "stair climber", group: "Cardio" },
  "corda": { en: "jump rope", group: "Cardio" },
  "pular corda": { en: "jump rope", group: "Cardio" },
  "corrida": { en: "running", group: "Cardio" },
  "caminhada": { en: "walking", group: "Cardio" },
  "burpee": { en: "burpee", group: "Cardio" },
  "jumping jack": { en: "jumping jack", group: "Cardio" },
  "polichinelo": { en: "jumping jack", group: "Cardio" },
  "box jump": { en: "box jump", group: "Cardio" },
  "salto caixa": { en: "box jump", group: "Cardio" },
  "sprint": { en: "sprint", group: "Cardio" },
  "hiit": { en: "high intensity interval training", group: "Cardio" },
  
  // Functional / Olympic
  "levantamento olimpico": { en: "clean and jerk", group: "Corpo Inteiro" },
  "arranco": { en: "snatch", group: "Corpo Inteiro" },
  "clean": { en: "power clean", group: "Corpo Inteiro" },
  "clean and press": { en: "clean and press", group: "Corpo Inteiro" },
  "kettlebell swing": { en: "kettlebell swing", group: "Corpo Inteiro" },
  "swing kettlebell": { en: "kettlebell swing", group: "Corpo Inteiro" },
  "turkish get up": { en: "turkish get up", group: "Corpo Inteiro" },
  "thruster": { en: "thruster", group: "Corpo Inteiro" },
  "wall ball": { en: "wall ball", group: "Corpo Inteiro" },
  "battle rope": { en: "battle rope", group: "Cardio" },
  "corda naval": { en: "battle rope", group: "Cardio" },
  "farmer walk": { en: "farmer walk", group: "Corpo Inteiro" },
  "caminhada do fazendeiro": { en: "farmer walk", group: "Corpo Inteiro" },
  "sled push": { en: "sled push", group: "Corpo Inteiro" },
  "empurrar treno": { en: "sled push", group: "Corpo Inteiro" },
  "tire flip": { en: "tire flip", group: "Corpo Inteiro" },
  "virar pneu": { en: "tire flip", group: "Corpo Inteiro" },
};

const MUSCLE_GROUPS = [
  "Peito",
  "Costas",
  "Trapézios",
  "Ombros",
  "Bíceps",
  "Tríceps",
  "Quadríceps",
  "Posterior de Coxa",
  "Panturrilha",
  "Glúteos",
  "Abdômen",
  "Core",
  "Cardio",
  "Alongamento",
  "Corpo Inteiro",
  "Mobilidade"
];

const STATUS_OPTIONS = [
  { value: "active", label: "Ativo", color: "bg-green-500" },
  { value: "pending", label: "Pendente", color: "bg-yellow-500" },
  { value: "missing", label: "Faltando", color: "bg-red-500" },
];

export default function AdminExerciseGifs() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [gifs, setGifs] = useState<ExerciseGif[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMuscle, setFilterMuscle] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  
  // Form state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGif, setEditingGif] = useState<ExerciseGif | null>(null);
  const [formData, setFormData] = useState({
    exercise_name_pt: "",
    exercise_name_en: "",
    gif_url: "",
    muscle_group: "",
    status: "pending" as "active" | "pending" | "missing",
  });
  
  // Preview state
  const [previewGif, setPreviewGif] = useState<ExerciseGif | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Import state
  const [importing, setImporting] = useState(false);
  const [importingDatabase, setImportingDatabase] = useState(false);
  const [scanningProtocols, setScanningProtocols] = useState(false);
  const [missingExercises, setMissingExercises] = useState<MissingExercise[]>([]);
  const [showMissingDialog, setShowMissingDialog] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [activatingAll, setActivatingAll] = useState(false);
  const [uploadingGif, setUploadingGif] = useState(false);
  const [selectedExerciseForUpload, setSelectedExerciseForUpload] = useState<ExerciseGif | null>(null);
  const [syncingFromApi, setSyncingFromApi] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [apiStatus, setApiStatus] = useState<{ available: boolean; isCustom: boolean } | null>(null);
  const [syncingToStorage, setSyncingToStorage] = useState(false);
  const [storageProgress, setStorageProgress] = useState<{ processed: number; total: number; uploaded: number } | null>(null);

  // Batch upload state
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [batchUploading, setBatchUploading] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Inline editing state (draft mode - no auto-save)
  const [editingFields, setEditingFields] = useState<Record<string, { field: string; value: string }>>({});
  const [savingInline, setSavingInline] = useState<string | null>(null);
  
  // AI suggestion state
  const [suggestingName, setSuggestingName] = useState<string | null>(null);

  // Batch rename state
  const [batchRenaming, setBatchRenaming] = useState(false);
  const [batchRenameProgress, setBatchRenameProgress] = useState({ current: 0, total: 0 });
  const [renameSuggestions, setRenameSuggestions] = useState<Array<{
    id: string;
    original: string;
    suggested: string;
    gifUrl: string;
    muscleGroup: string;
    selected: boolean;
  }>>([]);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [applyingRenames, setApplyingRenames] = useState(false);

  // Broken URL check state
  const [checkingUrls, setCheckingUrls] = useState(false);
  const [checkingUrlsProgress, setCheckingUrlsProgress] = useState({ current: 0, total: 0 });
  const [brokenUrls, setBrokenUrls] = useState<Array<{
    id: string;
    name: string;
    url: string;
    muscleGroup: string;
    status: string;
    selected: boolean;
  }>>([]);
  const [showBrokenUrlsModal, setShowBrokenUrlsModal] = useState(false);
  const [processingBrokenUrls, setProcessingBrokenUrls] = useState(false);

  // Muscle Group Modal state
  const [selectedGroupForView, setSelectedGroupForView] = useState<string | null>(null);
  const [showGroupModal, setShowGroupModal] = useState(false);

  // Stats
  const [stats, setStats] = useState({ active: 0, pending: 0, missing: 0, total: 0 });

  // Helper functions for URL validation
  const isExternalBrokenUrl = (url: string | null) => {
    return url?.includes('v2.exercisedb.io') || false;
  };

  const isValidLocalUrl = (url: string | null) => {
    return url?.includes('supabase.co/storage') || url?.includes('lxdosmjenbaugmhyfanx') || false;
  };

  // Check if a name needs renaming (random IDs or English names)
  const needsRename = (name: string) => {
    // Random ID patterns (e.g., "0JtKWum", "Rbu5UUb", UUID-like)
    if (name.match(/^[a-zA-Z0-9]{5,10}$/) && !name.includes(' ')) return true;
    if (name.match(/^[a-f0-9-]{10,}$/i)) return true;
    // Very short names
    if (name.length < 4) return true;
    // English exercise terms
    if (/\b(dumbbell|barbell|cable|press|curl|row|fly|pulldown|pushdown|crunch|squat|deadlift|lunge|extension|raise|pull|push|bench|incline|decline)\b/i.test(name)) return true;
    return false;
  };

  // Count GIFs that need renaming
  const pendingNamesCount = gifs.filter(g => g.gif_url && needsRename(g.exercise_name_pt)).length;
  
  // Count external URLs
  const externalUrlsCount = gifs.filter(g => isExternalBrokenUrl(g.gif_url)).length;

  // Check if a GIF is ready to be activated (has valid URL, proper name, and muscle group)
  const isGifReadyToActivate = (gif: ExerciseGif) => {
    const hasValidUrl = gif.gif_url && !isExternalBrokenUrl(gif.gif_url);
    const hasProperName = gif.exercise_name_pt && 
      !gif.exercise_name_pt.match(/^[a-f0-9-]{10,}$/i) && // Not a random ID
      gif.exercise_name_pt.length > 2;
    const hasProperGroup = gif.muscle_group && gif.muscle_group !== "Pendente";
    return hasValidUrl && hasProperName && hasProperGroup && gif.status !== "active";
  };

  // Count GIFs ready to activate
  const readyToActivateCount = gifs.filter(isGifReadyToActivate).length;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!adminLoading && !isAdmin && user) {
      navigate("/dashboard");
    }
  }, [isAdmin, adminLoading, user, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchGifs();
    }
  }, [isAdmin]);

  const fetchGifs = async () => {
    try {
      const { data, error } = await supabase
        .from("exercise_gifs")
        .select("*")
        .order("muscle_group")
        .order("exercise_name_pt");

      if (error) throw error;
      
      const gifsData = (data || []) as ExerciseGif[];
      setGifs(gifsData);
      
      // Calculate stats
      const active = gifsData.filter(g => g.status === "active").length;
      const pending = gifsData.filter(g => g.status === "pending").length;
      const missing = gifsData.filter(g => g.status === "missing").length;
      setStats({ active, pending, missing, total: gifsData.length });
    } catch (error) {
      console.error("Erro ao buscar GIFs:", error);
      toast.error("Erro ao carregar GIFs");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (gif?: ExerciseGif) => {
    if (gif) {
      setEditingGif(gif);
      setFormData({
        exercise_name_pt: gif.exercise_name_pt,
        exercise_name_en: gif.exercise_name_en,
        gif_url: gif.gif_url || "",
        muscle_group: gif.muscle_group,
        status: gif.status,
      });
    } else {
      setEditingGif(null);
      setFormData({
        exercise_name_pt: "",
        exercise_name_en: "",
        gif_url: "",
        muscle_group: "",
        status: "pending",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.exercise_name_pt.trim() || !formData.exercise_name_en.trim() || !formData.muscle_group) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setSaving(true);
    try {
      const dataToSave = {
        exercise_name_pt: formData.exercise_name_pt.trim(),
        exercise_name_en: formData.exercise_name_en.trim(),
        gif_url: formData.gif_url.trim() || null,
        muscle_group: formData.muscle_group,
        status: formData.gif_url.trim() ? "active" : formData.status,
        last_checked_at: new Date().toISOString(),
      };

      if (editingGif) {
        const { error } = await supabase
          .from("exercise_gifs")
          .update(dataToSave)
          .eq("id", editingGif.id);

        if (error) throw error;
        toast.success("GIF atualizado com sucesso");
      } else {
        const { error } = await supabase
          .from("exercise_gifs")
          .insert(dataToSave);

        if (error) throw error;
        toast.success("Exercício adicionado com sucesso");
      }

      setIsDialogOpen(false);
      fetchGifs();
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      if (error.code === "23505") {
        toast.error("Já existe um exercício com esse nome");
      } else {
        toast.error("Erro ao salvar");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from("exercise_gifs")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;
      toast.success("Exercício removido com sucesso");
      setDeleteId(null);
      fetchGifs();
    } catch (error) {
      console.error("Erro ao deletar:", error);
      toast.error("Erro ao remover");
    } finally {
      setDeleting(false);
    }
  };

  // Importar exercícios do mapa PT→EN
  const handleImportFromMap = async () => {
    setImporting(true);
    try {
      // Get existing exercises
      const { data: existingGifs } = await supabase
        .from("exercise_gifs")
        .select("exercise_name_pt");
      
      const existingNames = new Set(
        (existingGifs || []).map((g) => g.exercise_name_pt.toLowerCase())
      );

      // Filter new exercises
      const newExercises = Object.entries(PT_TO_EN_MAP)
        .filter(([pt]) => !existingNames.has(pt.toLowerCase()))
        .map(([pt, data]) => ({
          exercise_name_pt: pt.charAt(0).toUpperCase() + pt.slice(1),
          exercise_name_en: data.en,
          muscle_group: data.group,
          status: "pending" as const,
        }));

      if (newExercises.length === 0) {
        toast.info("Todos os exercícios já estão cadastrados");
        setImporting(false);
        return;
      }

      // Insert in batches of 50
      const batchSize = 50;
      let inserted = 0;
      
      for (let i = 0; i < newExercises.length; i += batchSize) {
        const batch = newExercises.slice(i, i + batchSize);
        const { error } = await supabase
          .from("exercise_gifs")
          .insert(batch);
        
        if (error) {
          console.error("Erro no batch:", error);
        } else {
          inserted += batch.length;
        }
      }

      toast.success(`${inserted} exercícios importados com sucesso!`);
      fetchGifs();
    } catch (error) {
      console.error("Erro ao importar:", error);
      toast.error("Erro ao importar exercícios");
    } finally {
      setImporting(false);
    }
  };

  // Escanear protocolos ativos para encontrar exercícios sem GIF
  const handleScanProtocols = async () => {
    setScanningProtocols(true);
    setMissingExercises([]);
    
    try {
      // Get all active protocols with treino type
      const { data: protocols, error } = await supabase
        .from("protocolos")
        .select(`
          id,
          user_id,
          conteudo,
          profiles!inner(full_name)
        `)
        .eq("tipo", "treino")
        .eq("ativo", true);

      if (error) throw error;

      // Get all registered exercise names
      const { data: registeredGifs } = await supabase
        .from("exercise_gifs")
        .select("exercise_name_pt, status");

      const registeredNames = new Set(
        (registeredGifs || [])
          .filter(g => g.status === "active")
          .map((g) => g.exercise_name_pt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
      );

      // Extract all exercises from protocols
      const exerciseMap = new Map<string, { count: number; users: Set<string> }>();

      for (const protocol of protocols || []) {
        const content = protocol.conteudo as any;
        const userName = (protocol as any).profiles?.full_name || "Desconhecido";
        
        // Navigate the protocol structure to find exercises
        if (content?.treinos && Array.isArray(content.treinos)) {
          for (const treino of content.treinos) {
            if (treino.exercicios && Array.isArray(treino.exercicios)) {
              for (const ex of treino.exercicios) {
                const exerciseName = (ex.nome || ex.exercicio || "").trim();
                if (exerciseName) {
                  const normalizedName = exerciseName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                  
                  // Check if exercise has GIF
                  if (!registeredNames.has(normalizedName)) {
                    const existing = exerciseMap.get(exerciseName) || { count: 0, users: new Set() };
                    existing.count++;
                    existing.users.add(userName);
                    exerciseMap.set(exerciseName, existing);
                  }
                }
              }
            }
          }
        }
      }

      // Convert to array and sort by frequency
      const missing: MissingExercise[] = Array.from(exerciseMap.entries())
        .map(([name, data]) => ({
          name,
          protocol_count: data.count,
          users: Array.from(data.users),
        }))
        .sort((a, b) => b.protocol_count - a.protocol_count);

      setMissingExercises(missing);
      setShowMissingDialog(true);

      if (missing.length === 0) {
        toast.success("Todos os exercícios dos protocolos ativos têm GIF!");
      } else {
        toast.info(`${missing.length} exercícios sem GIF encontrados`);
      }
    } catch (error) {
      console.error("Erro ao escanear protocolos:", error);
      toast.error("Erro ao escanear protocolos");
    } finally {
      setScanningProtocols(false);
    }
  };

  // Adicionar exercício faltante ao banco
  const handleAddMissingExercise = async (exerciseName: string) => {
    // Try to find in PT_TO_EN_MAP
    const normalizedName = exerciseName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    let englishName = exerciseName;
    let muscleGroup = "Corpo Inteiro";

    for (const [pt, data] of Object.entries(PT_TO_EN_MAP)) {
      const normalizedPt = pt.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (normalizedName.includes(normalizedPt) || normalizedPt.includes(normalizedName)) {
        englishName = data.en;
        muscleGroup = data.group;
        break;
      }
    }

    try {
      const { error } = await supabase
        .from("exercise_gifs")
        .insert({
          exercise_name_pt: exerciseName,
          exercise_name_en: englishName,
          muscle_group: muscleGroup,
          status: "missing",
        });

      if (error) {
        if (error.code === "23505") {
          toast.info("Exercício já cadastrado");
        } else {
          throw error;
        }
      } else {
        toast.success(`"${exerciseName}" adicionado ao banco`);
        // Remove from missing list
        setMissingExercises(prev => prev.filter(e => e.name !== exerciseName));
        fetchGifs();
      }
    } catch (error) {
      console.error("Erro ao adicionar:", error);
      toast.error("Erro ao adicionar exercício");
    }
  };

  // Adicionar todos os exercícios faltantes
  const handleAddAllMissing = async () => {
    if (missingExercises.length === 0) return;

    setImporting(true);
    try {
      const toInsert = missingExercises.map(ex => {
        const normalizedName = ex.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        let englishName = ex.name;
        let muscleGroup = "Corpo Inteiro";

        for (const [pt, data] of Object.entries(PT_TO_EN_MAP)) {
          const normalizedPt = pt.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          if (normalizedName.includes(normalizedPt) || normalizedPt.includes(normalizedName)) {
            englishName = data.en;
            muscleGroup = data.group;
            break;
          }
        }

        return {
          exercise_name_pt: ex.name,
          exercise_name_en: englishName,
          muscle_group: muscleGroup,
          status: "missing" as const,
        };
      });

      const { error } = await supabase
        .from("exercise_gifs")
        .upsert(toInsert, { onConflict: "exercise_name_pt", ignoreDuplicates: true });

      if (error) throw error;

      toast.success(`${toInsert.length} exercícios adicionados ao banco`);
      setMissingExercises([]);
      setShowMissingDialog(false);
      fetchGifs();
    } catch (error) {
      console.error("Erro ao adicionar todos:", error);
      toast.error("Erro ao adicionar exercícios");
    } finally {
      setImporting(false);
    }
  };

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      await generateGifCoverageReportPdf(gifs, stats, MUSCLE_GROUPS);
      toast.success("Relatório PDF exportado com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      toast.error("Erro ao gerar relatório PDF");
    } finally {
      setExportingPdf(false);
    }
  };

  // Ativar todos os GIFs que têm URL
  const handleActivateAll = async () => {
    const gifsWithUrl = gifs.filter(g => g.gif_url && g.status !== "active");
    if (gifsWithUrl.length === 0) {
      toast.info("Não há GIFs pendentes com URL para ativar");
      return;
    }

    setActivatingAll(true);
    try {
      const { error } = await supabase
        .from("exercise_gifs")
        .update({ status: "active", last_checked_at: new Date().toISOString() })
        .not("gif_url", "is", null)
        .neq("gif_url", "")
        .neq("status", "active");

      if (error) throw error;
      
      toast.success(`${gifsWithUrl.length} GIFs ativados com sucesso!`);
      fetchGifs();
    } catch (error) {
      console.error("Erro ao ativar GIFs:", error);
      toast.error("Erro ao ativar GIFs");
    } finally {
      setActivatingAll(false);
    }
  };

  // Ativar apenas GIFs prontos (com URL válida, nome e grupo configurados)
  const handleActivateReadyGifs = async () => {
    const readyGifs = gifs.filter(isGifReadyToActivate);
    if (readyGifs.length === 0) {
      toast.info("Não há GIFs prontos para ativar");
      return;
    }

    setActivatingAll(true);
    try {
      const readyIds = readyGifs.map(g => g.id);
      const { error } = await supabase
        .from("exercise_gifs")
        .update({ status: "active", last_checked_at: new Date().toISOString() })
        .in("id", readyIds);

      if (error) throw error;
      
      toast.success(`${readyGifs.length} GIFs ativados com sucesso!`);
      fetchGifs();
    } catch (error) {
      console.error("Erro ao ativar GIFs:", error);
      toast.error("Erro ao ativar GIFs");
    } finally {
      setActivatingAll(false);
    }
  };

  // Inline update handler - local draft only, no auto-save
  const handleInlineUpdate = (gifId: string, field: string, value: string) => {
    const timerKey = `${gifId}-${field}`;
    const gif = gifs.find(g => g.id === gifId);
    const originalValue = gif ? gif[field as keyof ExerciseGif] : null;
    
    // If value matches original, remove from drafts
    if (value === originalValue) {
      setEditingFields(prev => {
        const newState = { ...prev };
        delete newState[timerKey];
        return newState;
      });
    } else {
      // Otherwise, store as draft
      setEditingFields(prev => ({ 
        ...prev, 
        [timerKey]: { field, value } 
      }));
    }
  };

  // Check if a GIF has pending changes
  const hasPendingChanges = (gifId: string) => {
    return Object.keys(editingFields).some(key => key.startsWith(`${gifId}-`));
  };

  // Save all pending changes for a GIF
  const saveGifChanges = async (gifId: string) => {
    const pendingFields = Object.entries(editingFields)
      .filter(([key]) => key.startsWith(`${gifId}-`))
      .reduce((acc, [key, val]) => {
        acc[val.field] = val.value;
        return acc;
      }, {} as Record<string, string>);
    
    if (Object.keys(pendingFields).length === 0) {
      toast.info("Sem alterações para salvar");
      return;
    }
    
    setSavingInline(gifId);
    try {
      const { error } = await supabase
        .from("exercise_gifs")
        .update({ ...pendingFields, updated_at: new Date().toISOString() })
        .eq("id", gifId);
      
      if (error) throw error;
      
      // Update local state
      setGifs(prev => prev.map(g => 
        g.id === gifId ? { ...g, ...pendingFields } : g
      ));
      
      // Clear drafts for this GIF
      setEditingFields(prev => {
        const newState = { ...prev };
        Object.keys(newState).filter(k => k.startsWith(`${gifId}-`)).forEach(k => delete newState[k]);
        return newState;
      });
      
      toast.success("Alterações salvas!");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar alterações");
    } finally {
      setSavingInline(null);
    }
  };

  // Cancel pending changes for a GIF
  const cancelGifChanges = (gifId: string) => {
    setEditingFields(prev => {
      const newState = { ...prev };
      Object.keys(newState).filter(k => k.startsWith(`${gifId}-`)).forEach(k => delete newState[k]);
      return newState;
    });
  };

  // Importar exercícios do arquivo JSON com dados enriquecidos
  const handleImportFromDatabase = async () => {
    setImportingDatabase(true);
    try {
      // Get existing exercises by exercise_db_id
      const { data: existingGifs } = await supabase
        .from("exercise_gifs")
        .select("exercise_db_id, exercise_name_en");
      
      const existingDbIds = new Set(
        (existingGifs || [])
          .filter(g => g.exercise_db_id)
          .map(g => g.exercise_db_id)
      );
      
      const existingNames = new Set(
        (existingGifs || []).map(g => g.exercise_name_en?.toLowerCase())
      );

      // Filter new exercises
      const exercises = exercisesDatabase as ExerciseFromDb[];
      const newExercises = exercises.filter(ex => 
        !existingDbIds.has(ex.exerciseId) && 
        !existingNames.has(ex.name.toLowerCase())
      );

      if (newExercises.length === 0) {
        toast.info("Todos os exercícios da base já estão importados");
        setImportingDatabase(false);
        return;
      }

      // Prepare data for insert
      const toInsert = newExercises.map(ex => ({
        exercise_name_pt: ex.name.charAt(0).toUpperCase() + ex.name.slice(1), // Capitalize
        exercise_name_en: ex.name,
        gif_url: `${GIF_BASE_URL}${ex.gifUrl}`,
        muscle_group: getMuscleGroupFromExercise(ex),
        status: "active" as const,
        api_source: "exercisedb-json",
        exercise_db_id: ex.exerciseId,
        target_muscles: ex.targetMuscles,
        secondary_muscles: ex.secondaryMuscles,
        body_parts: ex.bodyParts,
        equipments: ex.equipments,
        instructions: ex.instructions,
        last_checked_at: new Date().toISOString(),
      }));

      // Insert in batches of 50
      const batchSize = 50;
      let inserted = 0;
      
      for (let i = 0; i < toInsert.length; i += batchSize) {
        const batch = toInsert.slice(i, i + batchSize);
        const { error } = await supabase
          .from("exercise_gifs")
          .insert(batch);
        
        if (error) {
          console.error("Erro no batch:", error);
        } else {
          inserted += batch.length;
        }
      }

      toast.success(`${inserted} exercícios importados com GIFs e dados enriquecidos!`);
      fetchGifs();
    } catch (error) {
      console.error("Erro ao importar base:", error);
      toast.error("Erro ao importar exercícios da base");
    } finally {
      setImportingDatabase(false);
    }
  };

  // Sincronizar todos os exercícios da API (própria ou pública)
  const handleSyncFromApi = async () => {
    setSyncingFromApi(true);
    setSyncProgress(0);
    
    try {
      toast.info("Iniciando sincronização com a API...");
      
      const result = await syncAllExercisesFromApi((current, total) => {
        const progress = Math.round((current / total) * 100);
        setSyncProgress(progress);
      });
      
      if (result.success > 0) {
        toast.success(`${result.success} exercícios sincronizados com sucesso!`);
        fetchGifs();
      } else if (result.failed > 0) {
        toast.error(`Falha ao sincronizar ${result.failed} exercícios`);
      } else {
        toast.info("Nenhum exercício novo encontrado para sincronizar");
      }
    } catch (error) {
      console.error("Erro ao sincronizar:", error);
      toast.error("Erro ao sincronizar exercícios da API");
    } finally {
      setSyncingFromApi(false);
      setSyncProgress(0);
    }
  };

  // Sincronizar GIFs para o Supabase Storage via Edge Function
  const handleSyncToStorage = async () => {
    setSyncingToStorage(true);
    setStorageProgress(null);
    
    try {
      const apiUrl = import.meta.env.VITE_EXERCISE_API_URL;
      
      if (!apiUrl) {
        toast.error("Configure VITE_EXERCISE_API_URL com a URL da sua API ExerciseDB");
        return;
      }

      toast.info("Iniciando download em lote dos GIFs para o Storage...");
      
      const { data: session } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('sync-exercise-gifs', {
        body: {
          apiUrl,
          batchSize: 10,
          startOffset: 0,
          maxExercises: 1500
        }
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      const result = response.data;
      
      if (result.success) {
        setStorageProgress(result.progress);
        toast.success(`Sincronização concluída: ${result.progress.uploaded} GIFs baixados, ${result.progress.failed} falhas`);
        fetchGifs();
      } else {
        throw new Error(result.error || 'Erro desconhecido');
      }
    } catch (error: any) {
      console.error("Erro ao sincronizar para Storage:", error);
      toast.error(`Erro: ${error.message}`);
    } finally {
      setSyncingToStorage(false);
    }
  };

  // Upload de GIF para um exercício
  const handleGifUpload = async (event: React.ChangeEvent<HTMLInputElement>, exerciseId?: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.includes("image/gif") && !file.type.includes("image/")) {
      toast.error("Por favor, selecione um arquivo de imagem válido");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("O arquivo deve ter no máximo 5MB");
      return;
    }

    setUploadingGif(true);
    try {
      const targetExercise = exerciseId 
        ? gifs.find(g => g.id === exerciseId) 
        : selectedExerciseForUpload;
      
      if (!targetExercise) {
        toast.error("Selecione um exercício primeiro");
        return;
      }

      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${targetExercise.exercise_name_en.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.${fileExt}`;
      const filePath = `exercises/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("exercise-gifs")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from("exercise-gifs")
        .getPublicUrl(filePath);

      // Update exercise with new GIF URL
      const { error: updateError } = await supabase
        .from("exercise_gifs")
        .update({ 
          gif_url: publicUrlData.publicUrl, 
          status: "active",
          last_checked_at: new Date().toISOString()
        })
        .eq("id", targetExercise.id);

      if (updateError) throw updateError;

      toast.success(`GIF carregado para "${targetExercise.exercise_name_pt}"!`);
      setSelectedExerciseForUpload(null);
      fetchGifs();
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao carregar GIF");
    } finally {
      setUploadingGif(false);
      // Reset input
      event.target.value = "";
    }
  };

  // Batch upload de múltiplos GIFs
  const handleBatchFilesSelect = (files: FileList | null) => {
    if (!files) return;
    
    const validFiles = Array.from(files).filter(file => {
      if (!file.type.includes("image/gif") && !file.type.includes("image/")) {
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        return false;
      }
      return true;
    });

    if (validFiles.length > 100) {
      toast.error("Máximo de 100 arquivos por vez. Selecione menos arquivos.");
      return;
    }

    if (validFiles.length === 0) {
      toast.error("Nenhum arquivo válido selecionado (apenas GIF/imagens até 5MB)");
      return;
    }

    setBatchFiles(validFiles);
    toast.success(`${validFiles.length} arquivo(s) selecionado(s) para upload`);
  };

  const handleBatchUpload = async () => {
    if (batchFiles.length === 0) return;

    setBatchUploading(true);
    setBatchProgress({ current: 0, total: batchFiles.length, success: 0, failed: 0 });

    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < batchFiles.length; i++) {
      const file = batchFiles[i];
      
      try {
        // Extract exercise name from filename (without extension)
        const exerciseName = file.name
          .replace(/\.[^/.]+$/, "") // Remove extension
          .replace(/[-_]/g, " ") // Replace dashes and underscores with spaces
          .trim();

        // Generate unique filename
        const fileExt = file.name.split(".").pop()?.toLowerCase() || "gif";
        const safeFileName = exerciseName.replace(/\s+/g, "-").toLowerCase();
        const filePath = `exercises/${safeFileName}-${Date.now()}-${i}.${fileExt}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from("exercise-gifs")
          .upload(filePath, file, { upsert: true });

        if (uploadError) {
          console.error(`Erro ao fazer upload de ${file.name}:`, uploadError);
          failedCount++;
        } else {
          // Get public URL
          const { data: publicUrlData } = supabase.storage
            .from("exercise-gifs")
            .getPublicUrl(filePath);

          // Insert into database
          const { error: insertError } = await supabase
            .from("exercise_gifs")
            .insert({
              exercise_name_pt: exerciseName.charAt(0).toUpperCase() + exerciseName.slice(1),
              exercise_name_en: exerciseName.toLowerCase(),
              gif_url: publicUrlData.publicUrl,
              muscle_group: "Pendente",
              status: "pending",
              api_source: "manual-batch-upload",
              last_checked_at: new Date().toISOString(),
            });

          if (insertError) {
            if (insertError.code === "23505") {
              // Duplicate - try to update existing
              await supabase
                .from("exercise_gifs")
                .update({
                  gif_url: publicUrlData.publicUrl,
                  last_checked_at: new Date().toISOString(),
                })
                .ilike("exercise_name_pt", exerciseName);
            } else {
              console.error(`Erro ao salvar ${exerciseName}:`, insertError);
              failedCount++;
              continue;
            }
          }
          successCount++;
        }
      } catch (error) {
        console.error(`Erro ao processar ${file.name}:`, error);
        failedCount++;
      }

      setBatchProgress({
        current: i + 1,
        total: batchFiles.length,
        success: successCount,
        failed: failedCount,
      });
    }

    setBatchUploading(false);
    setBatchFiles([]);
    
    if (successCount > 0) {
      toast.success(`Upload concluído: ${successCount} sucesso, ${failedCount} falha(s)`);
      fetchGifs();
    } else {
      toast.error(`Nenhum arquivo foi carregado com sucesso`);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleBatchFilesSelect(e.dataTransfer.files);
  };

  const clearBatchFiles = () => {
    setBatchFiles([]);
    setBatchProgress({ current: 0, total: 0, success: 0, failed: 0 });
  };

  // Suggest exercise name using AI (via Edge Function)
  const suggestNameWithAI = async (gifId: string, gifUrl: string) => {
    if (!gifUrl) {
      toast.error("GIF não encontrado para análise");
      return;
    }
    
    setSuggestingName(gifId);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-exercise-name", {
        body: { gifUrl }
      });
      
      if (error) {
        console.error("Edge function error:", error);
        toast.error("Erro ao conectar com a IA");
        return;
      }
      
      if (data?.error) {
        if (data.error.includes("Rate limit")) {
          toast.error("Limite de requisições excedido. Aguarde um momento.");
        } else if (data.error.includes("credits")) {
          toast.error("Créditos de IA esgotados. Adicione créditos ao workspace.");
        } else {
          toast.error(data.error);
        }
        return;
      }
      
      const suggestedName = data?.suggestedName;
      
      if (suggestedName && suggestedName.length > 2) {
        handleInlineUpdate(gifId, 'exercise_name_pt', suggestedName);
        toast.success(`Sugestão: "${suggestedName}"`);
      } else {
        toast.error("IA não conseguiu identificar o exercício");
      }
    } catch (error) {
      console.error("Erro ao sugerir nome:", error);
      toast.error("Erro ao conectar com a IA");
    } finally {
      setSuggestingName(null);
    }
  };

  // Batch rename with AI (via Edge Function)
  const handleStartBatchRename = async () => {
    // Get GIFs that need renaming and have a valid URL
    const gifsToRename = gifs.filter(g => 
      g.gif_url && 
      !isExternalBrokenUrl(g.gif_url) && 
      needsRename(g.exercise_name_pt)
    ).slice(0, 50); // Limit to 50 at a time
    
    if (gifsToRename.length === 0) {
      toast.info("Nenhum GIF precisa de renomeação");
      return;
    }
    
    setBatchRenaming(true);
    setBatchRenameProgress({ current: 0, total: gifsToRename.length });
    setRenameSuggestions([]);
    
    const suggestions: typeof renameSuggestions = [];
    let rateLimitHit = false;
    
    for (let i = 0; i < gifsToRename.length; i++) {
      const gif = gifsToRename[i];
      
      if (rateLimitHit) break;
      
      try {
        // Rate limiting - 2 second delay between requests
        if (i > 0) {
          await new Promise(r => setTimeout(r, 2000));
        }
        
        const { data, error } = await supabase.functions.invoke("suggest-exercise-name", {
          body: { gifUrl: gif.gif_url }
        });
        
        if (error) {
          console.error(`Edge function error for ${gif.exercise_name_pt}:`, error);
          continue;
        }
        
        if (data?.error) {
          if (data.error.includes("Rate limit")) {
            toast.error("Limite de requisições atingido. Tente novamente em alguns minutos.");
            rateLimitHit = true;
            break;
          } else if (data.error.includes("credits")) {
            toast.error("Créditos de IA esgotados.");
            rateLimitHit = true;
            break;
          }
          continue;
        }
        
        const suggestedName = data?.suggestedName;
        
        if (suggestedName && suggestedName.length > 2) {
          suggestions.push({
            id: gif.id,
            original: gif.exercise_name_pt,
            suggested: suggestedName,
            gifUrl: gif.gif_url!,
            muscleGroup: gif.muscle_group,
            selected: true
          });
        }
      } catch (error) {
        console.error(`Erro ao processar ${gif.exercise_name_pt}:`, error);
      }
      
      setBatchRenameProgress({ current: i + 1, total: gifsToRename.length });
    }
    
    setBatchRenaming(false);
    
    if (suggestions.length > 0) {
      setRenameSuggestions(suggestions);
      setShowRenameModal(true);
      toast.success(`${suggestions.length} sugestão(ões) de nome gerada(s)`);
    } else if (!rateLimitHit) {
      toast.info("Nenhuma sugestão foi gerada");
    }
  };

  // Toggle selection for rename suggestions
  const handleToggleRenameSuggestion = (id: string) => {
    setRenameSuggestions(prev => 
      prev.map(s => s.id === id ? { ...s, selected: !s.selected } : s)
    );
  };

  // Toggle all rename suggestions
  const handleToggleAllRenameSuggestions = () => {
    const allSelected = renameSuggestions.every(s => s.selected);
    setRenameSuggestions(prev => 
      prev.map(s => ({ ...s, selected: !allSelected }))
    );
  };

  // Apply rename suggestions
  const handleApplyRenameSuggestions = async () => {
    const selected = renameSuggestions.filter(s => s.selected);
    if (selected.length === 0) return;
    
    setApplyingRenames(true);
    
    try {
      for (const suggestion of selected) {
        await supabase
          .from("exercise_gifs")
          .update({ 
            exercise_name_pt: suggestion.suggested, 
            updated_at: new Date().toISOString() 
          })
          .eq("id", suggestion.id);
      }
      
      toast.success(`${selected.length} nome(s) atualizado(s) com sucesso!`);
      setShowRenameModal(false);
      setRenameSuggestions([]);
      fetchGifs();
    } catch (error) {
      console.error("Erro ao aplicar renomeações:", error);
      toast.error("Erro ao salvar nomes");
    } finally {
      setApplyingRenames(false);
    }
  };

  // Check for broken external URLs
  const handleCheckBrokenUrls = async () => {
    const externalGifs = gifs.filter(g => isExternalBrokenUrl(g.gif_url));
    
    if (externalGifs.length === 0) {
      toast.info("Nenhuma URL externa encontrada");
      return;
    }
    
    setCheckingUrls(true);
    setCheckingUrlsProgress({ current: 0, total: externalGifs.length });
    
    const broken: typeof brokenUrls = [];
    
    // All exercisedb.io URLs are considered broken since the service is down
    for (let i = 0; i < externalGifs.length; i++) {
      const gif = externalGifs[i];
      
      broken.push({
        id: gif.id,
        name: gif.exercise_name_pt,
        url: gif.gif_url!,
        muscleGroup: gif.muscle_group,
        status: gif.status,
        selected: true
      });
      
      setCheckingUrlsProgress({ current: i + 1, total: externalGifs.length });
      
      // Small delay to show progress
      if (i % 10 === 0) {
        await new Promise(r => setTimeout(r, 50));
      }
    }
    
    setCheckingUrls(false);
    setBrokenUrls(broken);
    
    if (broken.length > 0) {
      setShowBrokenUrlsModal(true);
      toast.warning(`${broken.length} URL(s) externa(s) quebrada(s) encontrada(s)`);
    } else {
      toast.success("Todas as URLs estão funcionando");
    }
  };

  // Toggle selection for broken URLs
  const handleToggleBrokenUrl = (id: string) => {
    setBrokenUrls(prev => 
      prev.map(b => b.id === id ? { ...b, selected: !b.selected } : b)
    );
  };

  // Toggle all broken URLs
  const handleToggleAllBrokenUrls = () => {
    const allSelected = brokenUrls.every(b => b.selected);
    setBrokenUrls(prev => 
      prev.map(b => ({ ...b, selected: !allSelected }))
    );
  };

  // Deactivate selected broken URLs
  const handleDeactivateBrokenUrls = async () => {
    const selected = brokenUrls.filter(b => b.selected);
    if (selected.length === 0) return;
    
    setProcessingBrokenUrls(true);
    
    try {
      const ids = selected.map(b => b.id);
      await supabase
        .from("exercise_gifs")
        .update({ status: "pending", updated_at: new Date().toISOString() })
        .in("id", ids);
      
      toast.success(`${selected.length} GIF(s) desativado(s)`);
      setShowBrokenUrlsModal(false);
      setBrokenUrls([]);
      fetchGifs();
    } catch (error) {
      console.error("Erro ao desativar:", error);
      toast.error("Erro ao desativar GIFs");
    } finally {
      setProcessingBrokenUrls(false);
    }
  };

  // Delete selected broken URLs
  const handleDeleteBrokenUrls = async () => {
    const selected = brokenUrls.filter(b => b.selected);
    if (selected.length === 0) return;
    
    setProcessingBrokenUrls(true);
    
    try {
      const ids = selected.map(b => b.id);
      await supabase
        .from("exercise_gifs")
        .delete()
        .in("id", ids);
      
      toast.success(`${selected.length} GIF(s) excluído(s)`);
      setShowBrokenUrlsModal(false);
      setBrokenUrls([]);
      fetchGifs();
    } catch (error) {
      console.error("Erro ao excluir:", error);
      toast.error("Erro ao excluir GIFs");
    } finally {
      setProcessingBrokenUrls(false);
    }
  };

  // Handle activation of a single GIF
  const handleActivateGif = async (gif: ExerciseGif) => {
    try {
      await supabase
        .from("exercise_gifs")
        .update({ status: "active", last_checked_at: new Date().toISOString() })
        .eq("id", gif.id);
      toast.success("GIF ativado!");
      fetchGifs();
    } catch (error) {
      toast.error("Erro ao ativar");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30"><CheckCircle className="h-3 w-3 mr-1" />Ativo</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case "missing":
        return <Badge className="bg-red-500/20 text-red-600 border-red-500/30"><XCircle className="h-3 w-3 mr-1" />Faltando</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredGifs = gifs.filter(gif => {
    const matchesSearch = 
      gif.exercise_name_pt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gif.exercise_name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gif.muscle_group.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMuscle = filterMuscle === "all" || gif.muscle_group === filterMuscle;
    const matchesStatus = filterStatus === "all" || gif.status === filterStatus;
    return matchesSearch && matchesMuscle && matchesStatus;
  });

  if (authLoading || adminLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Banco de GIFs</h1>
            <p className="text-muted-foreground">Gerencie as demonstrações de exercícios</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <Image className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-500/30">
            <CardContent className="flex items-center gap-3 py-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                <p className="text-sm text-muted-foreground">Ativos</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-yellow-500/30">
            <CardContent className="flex items-center gap-3 py-4">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pendentes</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-500/30">
            <CardContent className="flex items-center gap-3 py-4">
              <XCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.missing}</p>
                <p className="text-sm text-muted-foreground">Faltando</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Batch Actions Card with AI */}
        {(pendingNamesCount > 0 || externalUrlsCount > 0) && (
          <BatchActionsCard
            pendingNamesCount={pendingNamesCount}
            externalUrlsCount={externalUrlsCount}
            readyToActivateCount={readyToActivateCount}
            brokenUrlsCount={brokenUrls.length}
            batchRenaming={batchRenaming}
            batchRenameProgress={batchRenameProgress}
            checkingUrls={checkingUrls}
            checkingUrlsProgress={checkingUrlsProgress}
            onStartBatchRename={handleStartBatchRename}
            onCheckBrokenUrls={handleCheckBrokenUrls}
            onActivateReady={handleActivateReadyGifs}
            activatingAll={activatingAll}
          />
        )}

        {/* Ativar GIFs Prontos Card - only show if no batch actions card or ready to activate */}
        {readyToActivateCount > 0 && pendingNamesCount === 0 && externalUrlsCount === 0 && (
          <Card className="mb-6 border-green-500 bg-green-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-green-700">
                <Zap className="h-5 w-5" />
                Ativar GIFs Prontos
              </CardTitle>
              <CardDescription>
                {readyToActivateCount} GIF(s) têm imagem válida, nome e grupo muscular configurados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleActivateReadyGifs}
                disabled={activatingAll || readyToActivateCount === 0}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {activatingAll ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Ativar Todos os {readyToActivateCount} GIFs Prontos
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Coverage Dashboard by Muscle Group */}
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Cobertura por Grupo Muscular
              </CardTitle>
              <CardDescription>
                Porcentagem de exercícios com GIF ativo por grupo muscular
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPdf}
              disabled={exportingPdf || gifs.length === 0}
            >
              {exportingPdf ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              Exportar PDF
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {MUSCLE_GROUPS.map((group) => {
                const groupGifs = gifs.filter((g) => g.muscle_group === group);
                const totalGroup = groupGifs.length;
                const activeGroup = groupGifs.filter((g) => g.status === "active").length;
                const pendingGroup = groupGifs.filter((g) => g.status === "pending").length;
                const missingGroup = groupGifs.filter((g) => g.status === "missing").length;
                const coverage = totalGroup > 0 ? Math.round((activeGroup / totalGroup) * 100) : 0;
                
                // Determine color based on coverage
                let progressColor = "bg-red-500";
                let textColor = "text-red-600";
                if (coverage >= 80) {
                  progressColor = "bg-green-500";
                  textColor = "text-green-600";
                } else if (coverage >= 50) {
                  progressColor = "bg-yellow-500";
                  textColor = "text-yellow-600";
                } else if (coverage >= 25) {
                  progressColor = "bg-orange-500";
                  textColor = "text-orange-600";
                }

                return (
                  <div
                    key={group}
                    className="p-4 rounded-lg border bg-card hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedGroupForView(group);
                      setShowGroupModal(true);
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{group}</span>
                      <span className={`text-lg font-bold ${textColor}`}>{coverage}%</span>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
                      <div
                        className={`h-full ${progressColor} transition-all duration-500`}
                        style={{ width: `${coverage}%` }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          {activeGroup}
                        </span>
                        <span className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-yellow-500" />
                          {pendingGroup}
                        </span>
                        <span className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                          {missingGroup}
                        </span>
                      </div>
                      <span className="text-muted-foreground/70">{totalGroup} total</span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Legend */}
            <div className="flex flex-wrap items-center gap-6 mt-4 pt-4 border-t text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>Ativo (GIF cadastrado)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span>Pendente (aguardando GIF)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span>Faltando (sem GIF)</span>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Actions */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Button
            variant="outline"
            onClick={handleImportFromDatabase}
            disabled={importingDatabase}
            className="border-primary/50 text-primary hover:bg-primary/10"
          >
            {importingDatabase ? <LoadingSpinner size="sm" className="mr-2" /> : <Database className="h-4 w-4 mr-2" />}
            Importar Base Completa ({(exercisesDatabase as ExerciseFromDb[]).length} exercícios)
          </Button>
          
          <Button
            variant="outline"
            onClick={handleImportFromMap}
            disabled={importing}
          >
            {importing ? <LoadingSpinner size="sm" className="mr-2" /> : <Download className="h-4 w-4 mr-2" />}
            Importar do Mapa PT→EN
          </Button>
          
          <Button
            variant="outline"
            onClick={handleScanProtocols}
            disabled={scanningProtocols}
          >
            {scanningProtocols ? <LoadingSpinner size="sm" className="mr-2" /> : <FileSearch className="h-4 w-4 mr-2" />}
            Escanear Protocolos
          </Button>

          <Button
            variant="outline"
            onClick={handleActivateAll}
            disabled={activatingAll || stats.pending === 0}
            className="border-green-500/50 text-green-600 hover:bg-green-500/10"
          >
            {activatingAll ? <LoadingSpinner size="sm" className="mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
            Ativar Todos com URL ({gifs.filter(g => g.gif_url && g.status !== "active").length})
          </Button>

          <Button
            variant="outline"
            onClick={handleSyncFromApi}
            disabled={syncingFromApi}
            className="border-blue-500/50 text-blue-600 hover:bg-blue-500/10"
          >
            {syncingFromApi ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Sincronizando... {syncProgress}%
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sincronizar via API {isUsingCustomApi ? "(Própria)" : "(Pública)"}
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={handleSyncToStorage}
            disabled={syncingToStorage || !import.meta.env.VITE_EXERCISE_API_URL}
            className="border-purple-500/50 text-purple-600 hover:bg-purple-500/10"
            title={!import.meta.env.VITE_EXERCISE_API_URL ? "Configure VITE_EXERCISE_API_URL primeiro" : "Baixar GIFs para Storage local"}
          >
            {syncingToStorage ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Baixando GIFs...
              </>
            ) : (
              <>
                <CloudDownload className="h-4 w-4 mr-2" />
                Baixar 1500 GIFs p/ Storage
              </>
            )}
          </Button>

          <div className="flex-1" />
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Exercício
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingGif ? "Editar Exercício" : "Novo Exercício"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="exercise_name_pt">Nome em Português *</Label>
                  <Input
                    id="exercise_name_pt"
                    value={formData.exercise_name_pt}
                    onChange={(e) => setFormData({ ...formData, exercise_name_pt: e.target.value })}
                    placeholder="Ex: Supino Reto com Barra"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exercise_name_en">Nome em Inglês *</Label>
                  <Input
                    id="exercise_name_en"
                    value={formData.exercise_name_en}
                    onChange={(e) => setFormData({ ...formData, exercise_name_en: e.target.value })}
                    placeholder="Ex: barbell bench press"
                  />
                  <p className="text-xs text-muted-foreground">
                    Usado para buscar na API ExerciseDB
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gif_url">URL do GIF (opcional)</Label>
                  <Input
                    id="gif_url"
                    value={formData.gif_url}
                    onChange={(e) => setFormData({ ...formData, gif_url: e.target.value })}
                    placeholder="https://..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Se vazio, o sistema buscará automaticamente na API
                  </p>
                </div>

                {formData.gif_url && (
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <Label className="text-sm mb-2 block">Preview</Label>
                    <img 
                      src={formData.gif_url} 
                      alt="Preview" 
                      className="w-full max-h-48 object-contain rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.svg";
                      }}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="muscle_group">Grupo Muscular *</Label>
                    <Select
                      value={formData.muscle_group}
                      onValueChange={(value) => setFormData({ ...formData, muscle_group: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {MUSCLE_GROUPS.map((group) => (
                          <SelectItem key={group} value={group}>
                            {group}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: "active" | "pending" | "missing") => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={saving}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? <LoadingSpinner size="sm" className="mr-2" /> : null}
                    {editingGif ? "Salvar" : "Adicionar"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Upload Area */}
        <Card className="mb-6 border-dashed border-2 border-primary/30 bg-primary/5">
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  Carregar GIF do Computador
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Selecione um exercício e faça upload de uma imagem GIF (máx. 5MB)
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Select 
                  value={selectedExerciseForUpload?.id || ""} 
                  onValueChange={(id) => setSelectedExerciseForUpload(gifs.find(g => g.id === id) || null)}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Selecione um exercício..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    {gifs
                      .filter(g => g.status !== "active")
                      .sort((a, b) => a.exercise_name_pt.localeCompare(b.exercise_name_pt))
                      .map((gif) => (
                        <SelectItem key={gif.id} value={gif.id}>
                          <span className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${gif.status === "pending" ? "bg-yellow-500" : "bg-red-500"}`} />
                            {gif.exercise_name_pt}
                          </span>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/gif,image/*"
                    className="hidden"
                    onChange={(e) => handleGifUpload(e)}
                    disabled={!selectedExerciseForUpload || uploadingGif}
                  />
                  <Button 
                    asChild 
                    disabled={!selectedExerciseForUpload || uploadingGif}
                  >
                    <span>
                      {uploadingGif ? <LoadingSpinner size="sm" className="mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                      Upload
                    </span>
                  </Button>
                </label>
              </div>
            </div>
            {selectedExerciseForUpload && (
              <div className="mt-4 p-3 rounded-lg bg-muted/50 flex items-center gap-3">
                <Image className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{selectedExerciseForUpload.exercise_name_pt}</p>
                  <p className="text-xs text-muted-foreground">{selectedExerciseForUpload.muscle_group} • {selectedExerciseForUpload.exercise_name_en}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Batch Upload Area */}
        <Card className={`mb-6 border-dashed border-2 transition-colors ${
          isDragging 
            ? "border-green-500 bg-green-500/10" 
            : "border-muted-foreground/30 bg-muted/20"
        }`}>
          <CardContent className="py-6">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className="text-center"
            >
              <div className="flex flex-col items-center gap-4">
                <div className={`p-4 rounded-full ${isDragging ? "bg-green-500/20" : "bg-muted"}`}>
                  <CloudDownload className={`h-10 w-10 ${isDragging ? "text-green-500" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Upload em Lote de GIFs
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Arraste até 100 arquivos GIF ou clique para selecionar
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    O nome do arquivo será usado como nome do exercício (ex: supino-reto.gif → Supino reto)
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/gif,image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleBatchFilesSelect(e.target.files)}
                      disabled={batchUploading}
                    />
                    <Button variant="outline" asChild disabled={batchUploading}>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        Selecionar Arquivos
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
            </div>

            {/* Selected files preview */}
            {batchFiles.length > 0 && !batchUploading && (
              <div className="mt-6 p-4 rounded-lg bg-muted/50 border">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-medium">{batchFiles.length} arquivo(s) selecionado(s)</p>
                    <p className="text-xs text-muted-foreground">
                      Pronto para upload. Grupo muscular: "Pendente" (edite depois)
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={clearBatchFiles}>
                      Cancelar
                    </Button>
                    <Button size="sm" onClick={handleBatchUpload}>
                      <Upload className="h-4 w-4 mr-2" />
                      Iniciar Upload
                    </Button>
                  </div>
                </div>
                
                <div className="max-h-40 overflow-y-auto">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {batchFiles.slice(0, 24).map((file, idx) => (
                      <div key={idx} className="text-xs p-2 bg-background rounded border truncate">
                        {file.name.replace(/\.[^/.]+$/, "")}
                      </div>
                    ))}
                    {batchFiles.length > 24 && (
                      <div className="text-xs p-2 bg-muted rounded border text-muted-foreground flex items-center justify-center">
                        +{batchFiles.length - 24} mais
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Upload progress */}
            {batchUploading && (
              <div className="mt-6 p-4 rounded-lg bg-muted/50 border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <LoadingSpinner size="sm" />
                    <p className="font-medium">Processando uploads...</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {batchProgress.current} de {batchProgress.total}
                  </p>
                </div>
                
                <Progress 
                  value={batchProgress.total > 0 ? (batchProgress.current / batchProgress.total) * 100 : 0} 
                  className="mb-3"
                />
                
                <div className="flex gap-4 text-sm">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    {batchProgress.success} sucesso
                  </span>
                  <span className="flex items-center gap-1.5">
                    <XCircle className="h-4 w-4 text-red-500" />
                    {batchProgress.failed} falha(s)
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar exercício..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterMuscle} onValueChange={setFilterMuscle}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Grupo muscular" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os grupos</SelectItem>
                  {MUSCLE_GROUPS.map((group) => (
                    <SelectItem key={group} value={group}>
                      {group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Exercise List - Responsive */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {filteredGifs.length} exercício{filteredGifs.length !== 1 ? "s" : ""} encontrado{filteredGifs.length !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredGifs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum exercício encontrado
              </div>
            ) : isMobile ? (
              /* Mobile: Card Layout */
              <div className="space-y-3">
                {filteredGifs.map((gif) => (
                  <ExerciseGifCard
                    key={gif.id}
                    gif={gif}
                    muscleGroups={MUSCLE_GROUPS}
                    editingFields={editingFields}
                    savingInline={savingInline}
                    uploadingGif={uploadingGif}
                    suggestingName={suggestingName}
                    onInlineUpdate={handleInlineUpdate}
                    onSaveChanges={saveGifChanges}
                    onCancelChanges={cancelGifChanges}
                    onUpload={handleGifUpload}
                    onActivate={handleActivateGif}
                    onDelete={setDeleteId}
                    onPreview={setPreviewGif}
                    onSuggestName={suggestNameWithAI}
                    hasPendingChanges={hasPendingChanges}
                    isExternalBrokenUrl={isExternalBrokenUrl}
                    isGifReadyToActivate={isGifReadyToActivate}
                    getStatusBadge={getStatusBadge}
                  />
                ))}
              </div>
            ) : (
              /* Desktop: Table Layout */
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-28">GIF</TableHead>
                      <TableHead className="min-w-[200px]">Nome (PT)</TableHead>
                      <TableHead className="min-w-[140px]">Grupo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right w-36">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGifs.map((gif) => {
                      const hasBrokenUrl = isExternalBrokenUrl(gif.gif_url);
                      const isReady = isGifReadyToActivate(gif);
                      
                      return (
                        <TableRow 
                          key={gif.id} 
                          className={`${hasBrokenUrl ? 'bg-destructive/5 border-l-2 border-l-destructive' : ''} ${isReady ? 'bg-green-500/5' : ''}`}
                        >
                          {/* Larger thumbnail with broken URL indicator */}
                          <TableCell>
                            <div className="relative">
                              {gif.gif_url ? (
                                <>
                                  <img 
                                    src={gif.gif_url} 
                                    alt={gif.exercise_name_pt}
                                    className={`w-24 h-24 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity ${hasBrokenUrl ? 'border-2 border-destructive' : ''}`}
                                    onClick={() => setPreviewGif(gif)}
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = "/placeholder.svg";
                                    }}
                                  />
                                  {hasBrokenUrl && (
                                    <div className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5" title="URL externa quebrada - precisa re-upload">
                                      <AlertTriangle className="h-3 w-3" />
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="w-24 h-24 bg-muted rounded flex items-center justify-center">
                                  <Image className="h-8 w-8 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                          </TableCell>
                          
                          {/* Inline editable Nome PT - draft mode */}
                          <TableCell>
                            <div className="flex gap-2">
                              <Input
                                value={editingFields[`${gif.id}-exercise_name_pt`]?.value ?? gif.exercise_name_pt}
                                onChange={(e) => handleInlineUpdate(gif.id, 'exercise_name_pt', e.target.value)}
                                className={`h-9 text-sm transition-colors flex-1 ${
                                  editingFields[`${gif.id}-exercise_name_pt`] 
                                    ? 'border-yellow-400' 
                                    : savingInline === gif.id 
                                      ? 'border-green-500' 
                                      : ''
                                }`}
                                placeholder="Nome em português"
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-9 w-9 flex-shrink-0"
                                onClick={() => gif.gif_url && suggestNameWithAI(gif.id, gif.gif_url)}
                                disabled={suggestingName === gif.id || !gif.gif_url}
                                title="Sugerir nome com IA"
                              >
                                {suggestingName === gif.id ? (
                                  <LoadingSpinner size="sm" />
                                ) : (
                                  <Wand2 className="h-4 w-4 text-primary" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                          
                          {/* Inline editable Muscle Group - draft mode */}
                          <TableCell>
                            <Select
                              value={editingFields[`${gif.id}-muscle_group`]?.value ?? gif.muscle_group}
                              onValueChange={(value) => handleInlineUpdate(gif.id, 'muscle_group', value)}
                            >
                              <SelectTrigger className={`h-9 text-sm ${
                                editingFields[`${gif.id}-muscle_group`] 
                                  ? 'border-yellow-400' 
                                  : (editingFields[`${gif.id}-muscle_group`]?.value ?? gif.muscle_group) === 'Pendente' 
                                    ? 'border-yellow-500 text-yellow-600' 
                                    : ''
                              }`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Pendente">Pendente</SelectItem>
                                {MUSCLE_GROUPS.map((group) => (
                                  <SelectItem key={group} value={group}>
                                    {group}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          
                          {/* Status */}
                          <TableCell>{getStatusBadge(gif.status)}</TableCell>
                          
                          {/* Actions with manual save/cancel */}
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {/* Save changes button - only shown when there are pending changes */}
                              {hasPendingChanges(gif.id) && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => saveGifChanges(gif.id)}
                                    disabled={savingInline === gif.id}
                                    title="Salvar alterações"
                                    className="text-green-600 hover:text-green-700 h-8 w-8"
                                  >
                                    <Save className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => cancelGifChanges(gif.id)}
                                    disabled={savingInline === gif.id}
                                    title="Cancelar alterações"
                                    className="text-muted-foreground hover:text-foreground h-8 w-8"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              {/* Quick upload button */}
                              <label className="cursor-pointer">
                                <input
                                  type="file"
                                  accept="image/gif,image/*"
                                  className="hidden"
                                  onChange={(e) => handleGifUpload(e, gif.id)}
                                  disabled={uploadingGif}
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  asChild
                                  title="Carregar GIF"
                                  className="text-primary hover:text-primary h-8 w-8"
                                >
                                  <span>
                                    <Upload className="h-4 w-4" />
                                  </span>
                                </Button>
                              </label>
                              {gif.status !== "active" && gif.gif_url && !hasBrokenUrl && !hasPendingChanges(gif.id) && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleActivateGif(gif)}
                                  title="Ativar GIF"
                                  className="text-green-600 hover:text-green-700 h-8 w-8"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteId(gif.id)}
                                className="text-destructive hover:text-destructive h-8 w-8"
                                title="Excluir"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview Dialog */}
        <Dialog open={!!previewGif} onOpenChange={() => setPreviewGif(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{previewGif?.exercise_name_pt}</DialogTitle>
            </DialogHeader>
            {previewGif?.gif_url && (
              <div className="flex justify-center">
                <img 
                  src={previewGif.gif_url} 
                  alt={previewGif.exercise_name_pt}
                  className="max-w-full max-h-[60vh] rounded-lg"
                />
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover este exercício? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? <LoadingSpinner size="sm" className="mr-2" /> : null}
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Missing Exercises Dialog */}
        <Dialog open={showMissingDialog} onOpenChange={setShowMissingDialog}>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Exercícios Sem GIF ({missingExercises.length})
              </DialogTitle>
            </DialogHeader>
            
            {missingExercises.length > 0 && (
              <div className="flex justify-end">
                <Button
                  onClick={handleAddAllMissing}
                  disabled={importing}
                  size="sm"
                >
                  {importing ? <LoadingSpinner size="sm" className="mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  Adicionar Todos ao Banco
                </Button>
              </div>
            )}
            
            <div className="flex-1 overflow-y-auto">
              {missingExercises.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>Todos os exercícios dos protocolos ativos têm GIF!</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Exercício</TableHead>
                      <TableHead className="text-center">Protocolos</TableHead>
                      <TableHead>Clientes</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {missingExercises.map((ex, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{ex.name}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{ex.protocol_count}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-48 truncate">
                          {ex.users.slice(0, 3).join(", ")}
                          {ex.users.length > 3 && ` +${ex.users.length - 3}`}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddMissingExercise(ex.name)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Adicionar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Batch Rename Modal */}
        <BatchRenameModal
          open={showRenameModal}
          onOpenChange={setShowRenameModal}
          suggestions={renameSuggestions}
          onToggleSelection={handleToggleRenameSuggestion}
          onToggleAll={handleToggleAllRenameSuggestions}
          onApply={handleApplyRenameSuggestions}
          isApplying={applyingRenames}
        />

        {/* Broken URLs Modal */}
        <BrokenUrlsModal
          open={showBrokenUrlsModal}
          onOpenChange={setShowBrokenUrlsModal}
          brokenUrls={brokenUrls}
          onToggleSelection={handleToggleBrokenUrl}
          onToggleAll={handleToggleAllBrokenUrls}
          onDeactivate={handleDeactivateBrokenUrls}
          onDelete={handleDeleteBrokenUrls}
          isProcessing={processingBrokenUrls}
        />

        {/* Muscle Group Modal */}
        {selectedGroupForView && (
          <MuscleGroupModal
            group={selectedGroupForView}
            gifs={gifs}
            open={showGroupModal}
            onClose={() => {
              setShowGroupModal(false);
              setSelectedGroupForView(null);
            }}
            onFilterList={(group, status) => {
              setFilterMuscle(group);
              if (status) setFilterStatus(status);
            }}
          />
        )}
      </div>
    </div>
  );
}
