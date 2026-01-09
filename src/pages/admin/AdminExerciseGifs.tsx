import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
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
  FileSearch
} from "lucide-react";

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
  "levantamento terra romeno": { en: "romanian deadlift", group: "Pernas" },
  "terra romeno": { en: "romanian deadlift", group: "Pernas" },
  "stiff": { en: "stiff leg deadlift", group: "Pernas" },
  "stiff com halteres": { en: "dumbbell stiff leg deadlift", group: "Pernas" },
  "barra fixa": { en: "pull up", group: "Costas" },
  "barra fixa supinada": { en: "chin up", group: "Costas" },
  "barra fixa pronada": { en: "pull up", group: "Costas" },
  "chin up": { en: "chin up", group: "Costas" },
  "pullover": { en: "pullover", group: "Costas" },
  "pullover costas": { en: "dumbbell pullover", group: "Costas" },
  "hiperextensao": { en: "back extension", group: "Costas" },
  "extensao lombar": { en: "back extension", group: "Costas" },
  "good morning": { en: "good morning", group: "Costas" },
  "bom dia": { en: "good morning", group: "Costas" },
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
  "encolhimento": { en: "shrug", group: "Ombros" },
  "encolhimento halteres": { en: "dumbbell shrug", group: "Ombros" },
  "encolhimento com halteres": { en: "dumbbell shrug", group: "Ombros" },
  "encolhimento barra": { en: "barbell shrug", group: "Ombros" },
  "encolhimento com barra": { en: "barbell shrug", group: "Ombros" },
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
  "agachamento": { en: "squat", group: "Pernas" },
  "agachamento livre": { en: "barbell squat", group: "Pernas" },
  "agachamento barra": { en: "barbell squat", group: "Pernas" },
  "agachamento com barra": { en: "barbell squat", group: "Pernas" },
  "agachamento goblet": { en: "goblet squat", group: "Pernas" },
  "agachamento hack": { en: "hack squat", group: "Pernas" },
  "agachamento smith": { en: "smith machine squat", group: "Pernas" },
  "agachamento frontal": { en: "front squat", group: "Pernas" },
  "agachamento frontal barra": { en: "barbell front squat", group: "Pernas" },
  "agachamento bulgaro": { en: "bulgarian split squat", group: "Pernas" },
  "agachamento sumo": { en: "sumo squat", group: "Pernas" },
  "agachamento sumo largo": { en: "wide stance sumo squat", group: "Pernas" },
  "agachamento unilateral": { en: "single leg squat", group: "Pernas" },
  "agachamento sissy": { en: "sissy squat", group: "Pernas" },
  "sissy squat": { en: "sissy squat", group: "Pernas" },
  "leg press": { en: "leg press", group: "Pernas" },
  "leg press 45": { en: "leg press", group: "Pernas" },
  "leg press horizontal": { en: "horizontal leg press", group: "Pernas" },
  "cadeira extensora": { en: "leg extension", group: "Pernas" },
  "extensora": { en: "leg extension", group: "Pernas" },
  "extensao de pernas": { en: "leg extension", group: "Pernas" },
  "afundo": { en: "lunge", group: "Pernas" },
  "afundo frontal": { en: "forward lunge", group: "Pernas" },
  "afundo reverso": { en: "reverse lunge", group: "Pernas" },
  "afundo lateral": { en: "side lunge", group: "Pernas" },
  "passada": { en: "walking lunge", group: "Pernas" },
  "passada caminhando": { en: "walking lunge", group: "Pernas" },
  "avanco": { en: "lunge", group: "Pernas" },
  "pistol squat": { en: "pistol squat", group: "Pernas" },
  
  // Legs - Hamstrings / Pernas - Posterior
  "mesa flexora": { en: "leg curl", group: "Pernas" },
  "flexora deitada": { en: "lying leg curl", group: "Pernas" },
  "flexora sentada": { en: "seated leg curl", group: "Pernas" },
  "flexora em pe": { en: "standing leg curl", group: "Pernas" },
  "cadeira flexora": { en: "seated leg curl", group: "Pernas" },
  "stiff pernas": { en: "stiff leg deadlift", group: "Pernas" },
  "stiff unilateral": { en: "single leg romanian deadlift", group: "Pernas" },
  "terra romeno unilateral": { en: "single leg romanian deadlift", group: "Pernas" },
  
  // Legs - Glutes / Pernas - Glúteos
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
  "adutora": { en: "hip adduction", group: "Pernas" },
  "adutora maquina": { en: "hip adduction machine", group: "Pernas" },
  "aducao com elastico": { en: "resistance band hip adduction", group: "Pernas" },
  "aducao na maquina": { en: "hip adduction machine", group: "Pernas" },
  "agachamento gluteo": { en: "glute squat", group: "Glúteos" },
  "cadeira abdutora": { en: "hip abduction machine", group: "Glúteos" },
  "cadeira adutora": { en: "hip adduction machine", group: "Pernas" },
  
  // Legs - Calves / Pernas - Panturrilha
  "panturrilha": { en: "calf raise", group: "Pernas" },
  "panturrilha em pe": { en: "standing calf raise", group: "Pernas" },
  "elevacao de panturrilha em pe": { en: "standing calf raise", group: "Pernas" },
  "panturrilha sentado": { en: "seated calf raise", group: "Pernas" },
  "elevacao de panturrilha sentado": { en: "seated calf raise", group: "Pernas" },
  "panturrilha maquina": { en: "calf press machine", group: "Pernas" },
  "panturrilha leg press": { en: "leg press calf raise", group: "Pernas" },
  "panturrilha no leg press": { en: "leg press calf raise", group: "Pernas" },
  "panturrilha unilateral": { en: "single leg calf raise", group: "Pernas" },
  "gemeos": { en: "calf raise", group: "Pernas" },
  "elevacao de calcanhar": { en: "calf raise", group: "Pernas" },
  
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
  "Ombros",
  "Bíceps",
  "Tríceps",
  "Pernas",
  "Glúteos",
  "Abdômen",
  "Core",
  "Cardio",
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
  const [scanningProtocols, setScanningProtocols] = useState(false);
  const [missingExercises, setMissingExercises] = useState<MissingExercise[]>([]);
  const [showMissingDialog, setShowMissingDialog] = useState(false);

  // Stats
  const [stats, setStats] = useState({ active: 0, pending: 0, missing: 0, total: 0 });

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

        {/* Coverage Dashboard by Muscle Group */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Cobertura por Grupo Muscular
            </CardTitle>
            <CardDescription>
              Porcentagem de exercícios com GIF ativo por grupo muscular
            </CardDescription>
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
                      setFilterMuscle(group);
                      setFilterStatus("all");
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

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {filteredGifs.length} exercício{filteredGifs.length !== 1 ? "s" : ""} encontrado{filteredGifs.length !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">GIF</TableHead>
                    <TableHead>Nome (PT)</TableHead>
                    <TableHead className="hidden md:table-cell">Nome (EN)</TableHead>
                    <TableHead>Grupo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGifs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhum exercício encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredGifs.map((gif) => (
                      <TableRow key={gif.id}>
                        <TableCell>
                          {gif.gif_url ? (
                            <img 
                              src={gif.gif_url} 
                              alt={gif.exercise_name_pt}
                              className="w-12 h-12 object-cover rounded cursor-pointer hover:opacity-80"
                              onClick={() => setPreviewGif(gif)}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/placeholder.svg";
                              }}
                            />
                          ) : (
                            <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                              <Image className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{gif.exercise_name_pt}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                          {gif.exercise_name_en}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{gif.muscle_group}</Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(gif.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {gif.gif_url && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => window.open(gif.gif_url!, "_blank")}
                                title="Abrir GIF"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(gif)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteId(gif.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
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
      </div>
    </div>
  );
}
