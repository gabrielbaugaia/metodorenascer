import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, Dumbbell, RotateCcw, ImageOff, Sparkles, CheckCircle2 } from "lucide-react";
import { searchExercise, getExerciseGifUrl, ExerciseDbExercise } from "@/services/exerciseDb";
import { RestCountdown } from "./RestCountdown";
import { cn } from "@/lib/utils";

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  videoUrl?: string;
  tips?: string;
}

interface SetLog {
  exerciseName: string;
  setNumber: number;
  weightKg: number;
  repsDone: number;
  restSeconds: number;
  restRespected: boolean;
  completedAt: Date;
}

interface RestTimerState {
  active: boolean;
  remainingSeconds: number;
  exerciseName: string;
}

interface ExerciseVideoModalProps {
  exercise: Exercise | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Session props (optional)
  sessionActive?: boolean;
  completedSets?: SetLog[];
  lastWeight?: number;
  canLog?: boolean;
  onLogSet?: (
    exerciseName: string,
    setNumber: number,
    weightKg: number,
    repsDone: number,
    restSeconds: number
  ) => void;
  restTimer?: RestTimerState;
  restTotalSeconds?: number;
}

export function ExerciseVideoModal({
  exercise,
  open,
  onOpenChange,
  sessionActive = false,
  completedSets = [],
  lastWeight = 0,
  canLog = true,
  onLogSet,
  restTimer,
  restTotalSeconds = 60,
}: ExerciseVideoModalProps) {
  const [loading, setLoading] = useState(false);
  const [exerciseData, setExerciseData] = useState<ExerciseDbExercise | null>(null);
  const [error, setError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Local input state for session mode
  const [inputWeight, setInputWeight] = useState("");
  const [inputReps, setInputReps] = useState("");

  const nextSetNumber = completedSets.length + 1;
  const totalSets = exercise?.sets || 0;
  const allDone = completedSets.length >= totalSets;
  const defaultReps = parseInt(exercise?.reps || "12") || 12;

  // Pre-fill inputs when exercise/completedSets change
  useEffect(() => {
    if (!sessionActive || !exercise) return;
    const lastInSession = completedSets.length > 0
      ? completedSets[completedSets.length - 1].weightKg
      : lastWeight;
    setInputWeight(String(lastInSession || 0));
    setInputReps(String(defaultReps));
  }, [exercise?.name, completedSets.length, sessionActive]);

  // Reset state and fetch GIF when modal opens or exercise changes
  useEffect(() => {
    if (!open || !exercise) {
      setExerciseData(null);
      setError(false);
      setImageLoaded(false);
      return;
    }

    const fetchExerciseGif = async () => {
      const name = exercise.name?.trim();
      if (!name) {
        setError(true);
        return;
      }

      setLoading(true);
      setError(false);
      setExerciseData(null);
      setImageLoaded(false);

      try {
        const result = await searchExercise(name);
        if (result) {
          setExerciseData(result);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Erro ao buscar GIF do exercício:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchExerciseGif();
  }, [open, exercise?.name]);

  if (!exercise) return null;

  const gifUrl = exerciseData ? getExerciseGifUrl(exerciseData) : null;

  const handleLogSet = () => {
    if (!onLogSet || !exercise) return;
    const w = parseFloat(inputWeight) || 0;
    const r = parseInt(inputReps) || 0;
    const restSec = restTotalSeconds;
    onLogSet(exercise.name, nextSetNumber, w, r, restSec);
  };

  const isResting = restTimer?.active && restTimer.exerciseName === exercise.name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-xl pr-6">
            <Dumbbell className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
            <span className="uppercase">{exercise.name}</span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Demonstração do exercício {exercise.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Loading state */}
          {loading && (
            <div className="space-y-3">
              <div className="relative aspect-square max-h-[300px] rounded-xl overflow-hidden bg-gradient-to-br from-muted to-muted/50">
                <Skeleton className="w-full h-full animate-pulse" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                  <p className="text-sm text-muted-foreground animate-pulse">Carregando demonstração...</p>
                </div>
              </div>
            </div>
          )}

          {/* GIF Animation */}
          {!loading && gifUrl && (
            <div className="relative aspect-square max-h-[300px] rounded-xl overflow-hidden bg-gradient-to-br from-muted to-muted/30">
              {!imageLoaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
                  <div className="w-10 h-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                </div>
              )}
              <img
                src={gifUrl}
                alt={`Demonstração de ${exercise.name}`}
                className={`w-full h-full object-contain transition-opacity duration-300 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
                loading="eager"
                onLoad={() => setImageLoaded(true)}
              />
            </div>
          )}

          {/* Exercise info from API */}
          {!loading && exerciseData && (
            <div className="flex flex-wrap gap-2">
              {exerciseData.bodyPart && (
                <Badge variant="secondary" className="text-xs capitalize">
                  {exerciseData.bodyPart}
                </Badge>
              )}
              {exerciseData.target && (
                <Badge className="text-xs capitalize bg-primary/20 text-primary border-primary/30">
                  🎯 {exerciseData.target}
                </Badge>
              )}
              {exerciseData.equipment && (
                <Badge variant="outline" className="text-xs capitalize">
                  🏋️ {exerciseData.equipment}
                </Badge>
              )}
            </div>
          )}

          {/* Elegant fallback when no GIF available */}
          {!loading && error && (
            <div className="relative aspect-[4/3] max-h-[200px] rounded-xl overflow-hidden bg-gradient-to-br from-primary/5 via-muted to-secondary/10 border border-border/50">
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <ImageOff className="w-8 h-8 text-primary/60" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-secondary flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-secondary-foreground" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Demonstração em breve</p>
              </div>
            </div>
          )}

          {/* Exercise info badges (only when NOT in session, to save space) */}
          {!sessionActive && (
            <div className="flex flex-wrap gap-3">
              <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5">
                <RotateCcw className="w-3.5 h-3.5" />
                {exercise.sets} séries
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5">
                <Dumbbell className="w-3.5 h-3.5" />
                {exercise.reps} reps
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5">
                <Clock className="w-3.5 h-3.5" />
                {exercise.rest} descanso
              </Badge>
            </div>
          )}

          {/* ========== SESSION MODE: Set Tracking ========== */}
          {sessionActive && (
            <div className="space-y-3 border-t border-border/50 pt-3">
              {/* Progress header */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">
                  {allDone ? "✅ Concluído!" : `Série ${nextSetNumber}/${totalSets}`}
                </span>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <span>{exercise.reps} reps</span>
                  <span>•</span>
                  <span>{exercise.rest} desc.</span>
                </div>
              </div>

              {/* Completed sets */}
              {completedSets.length > 0 && (
                <div className="space-y-1.5">
                  {completedSets.map((s) => (
                    <div
                      key={s.setNumber}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20"
                    >
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-xs text-muted-foreground">
                        Série {s.setNumber}
                      </span>
                      <span className="text-sm font-semibold text-foreground ml-auto">
                        {s.weightKg} kg × {s.repsDone} reps
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Inline rest timer */}
              {isResting && (
                <RestCountdown
                  remainingSeconds={restTimer!.remainingSeconds}
                  totalSeconds={restTotalSeconds}
                  exerciseName={exercise.name}
                  variant="inline"
                />
              )}

              {/* Input row for next set */}
              {!allDone && !isResting && (
                <div className="flex items-center gap-2 p-3 rounded-xl border border-border/50 bg-muted/30">
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <label className="text-[10px] text-muted-foreground uppercase font-medium">Carga</label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      placeholder="kg"
                      className="h-12 text-lg text-center font-bold"
                      value={inputWeight}
                      onChange={(e) => setInputWeight(e.target.value)}
                    />
                  </div>
                  <span className="text-muted-foreground font-bold text-lg mt-4">×</span>
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <label className="text-[10px] text-muted-foreground uppercase font-medium">Reps</label>
                    <Input
                      type="number"
                      inputMode="numeric"
                      placeholder="reps"
                      className="h-12 text-lg text-center font-bold"
                      value={inputReps}
                      onChange={(e) => setInputReps(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="fire"
                    className="h-12 px-6 mt-4 text-base font-bold"
                    disabled={!canLog}
                    onClick={handleLogSet}
                  >
                    OK
                  </Button>
                </div>
              )}

              {/* All done message */}
              {allDone && (
                <div className="text-center py-2">
                  <p className="text-sm text-primary font-semibold">
                    Todas as séries concluídas! 🎉
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Feche e vá para o próximo exercício
                  </p>
                </div>
              )}
            </div>
          )}

          {/* API Instructions (collapsed in session mode) */}
          {!sessionActive && !loading && exerciseData?.instructions && exerciseData.instructions.length > 0 && (
            <div className="bg-secondary/50 border border-border rounded-lg p-4">
              <p className="text-sm font-medium mb-2">Como executar:</p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                {exerciseData.instructions.slice(0, 4).map((instruction, idx) => (
                  <li key={idx}>{instruction}</li>
                ))}
              </ol>
            </div>
          )}

          {/* Default tips when no API data */}
          {!sessionActive && !loading && error && !exercise.tips && (
            <div className="bg-secondary/50 border border-border rounded-lg p-4">
              <p className="text-sm font-medium mb-2">Dicas gerais:</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Execute o movimento com controle e amplitude completa</li>
                <li>Mantenha a respiração coordenada com o movimento</li>
                <li>Foque na contração muscular durante toda a execução</li>
              </ul>
            </div>
          )}

          {/* Coach tips */}
          {exercise.tips && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <p className="text-sm font-medium text-primary mb-1">Dica do Coach</p>
              <p className="text-sm text-muted-foreground">{exercise.tips}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
