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
import { Clock, Dumbbell, RotateCcw, AlertCircle } from "lucide-react";
import { searchExercise, getExerciseGifUrl, ExerciseDbExercise } from "@/services/exerciseDb";

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  videoUrl?: string;
  tips?: string;
}

interface ExerciseVideoModalProps {
  exercise: Exercise | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExerciseVideoModal({
  exercise,
  open,
  onOpenChange,
}: ExerciseVideoModalProps) {
  const [loading, setLoading] = useState(false);
  const [exerciseData, setExerciseData] = useState<ExerciseDbExercise | null>(null);
  const [error, setError] = useState(false);

  // Reset state and fetch GIF when modal opens or exercise changes
  useEffect(() => {
    if (!open || !exercise) {
      setExerciseData(null);
      setError(false);
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
            <div className="relative aspect-square max-h-[400px] rounded-xl overflow-hidden bg-muted flex items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span>Carregando demonstração...</span>
              </div>
            </div>
          )}

          {/* GIF Animation */}
          {!loading && gifUrl && (
            <div className="relative aspect-square max-h-[400px] rounded-xl overflow-hidden bg-muted flex items-center justify-center">
              <img
                src={gifUrl}
                alt={`Demonstração de ${exercise.name}`}
                className="w-full h-full object-contain"
                loading="eager"
              />
            </div>
          )}

          {/* Exercise info from API */}
          {!loading && exerciseData && (
            <div className="flex flex-wrap gap-2">
              {exerciseData.bodyPart && (
                <Badge variant="secondary" className="text-xs">
                  {exerciseData.bodyPart}
                </Badge>
              )}
              {exerciseData.target && (
                <Badge variant="secondary" className="text-xs">
                  {exerciseData.target}
                </Badge>
              )}
              {exerciseData.equipment && (
                <Badge variant="secondary" className="text-xs">
                  {exerciseData.equipment}
                </Badge>
              )}
            </div>
          )}

          {/* No media available */}
          {!loading && error && (
            <div className="relative aspect-video rounded-xl overflow-hidden bg-muted flex flex-col items-center justify-center gap-2 p-4">
              <AlertCircle className="w-8 h-8 text-muted-foreground" />
              <p className="text-muted-foreground text-center">
                Demonstração em breve
              </p>
              <p className="text-xs text-muted-foreground/70 text-center">
                Execute o movimento com controle e amplitude completa
              </p>
            </div>
          )}

          {/* Exercise info badges */}
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

          {/* API Instructions */}
          {!loading && exerciseData?.instructions && exerciseData.instructions.length > 0 && (
            <div className="bg-secondary/50 border border-border rounded-lg p-4">
              <p className="text-sm font-medium mb-2">Como executar:</p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                {exerciseData.instructions.slice(0, 4).map((instruction, idx) => (
                  <li key={idx}>{instruction}</li>
                ))}
              </ol>
            </div>
          )}

          {/* Coach tips (from protocol) */}
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
