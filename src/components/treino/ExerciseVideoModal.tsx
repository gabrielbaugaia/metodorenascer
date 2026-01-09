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
import { Clock, Dumbbell, RotateCcw, ImageOff, Sparkles } from "lucide-react";
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
  const [imageLoaded, setImageLoaded] = useState(false);

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
          {/* Loading state with animated skeleton */}
          {loading && (
            <div className="space-y-3">
              <div className="relative aspect-square max-h-[400px] rounded-xl overflow-hidden bg-gradient-to-br from-muted to-muted/50">
                <Skeleton className="w-full h-full animate-pulse" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                  <p className="text-sm text-muted-foreground animate-pulse">Carregando demonstração...</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>
          )}

          {/* GIF Animation with smooth loading */}
          {!loading && gifUrl && (
            <div className="relative aspect-square max-h-[400px] rounded-xl overflow-hidden bg-gradient-to-br from-muted to-muted/30">
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
                <Badge variant="secondary" className="text-xs capitalize">
                  {exerciseData.target}
                </Badge>
              )}
              {exerciseData.equipment && (
                <Badge variant="secondary" className="text-xs capitalize">
                  {exerciseData.equipment}
                </Badge>
              )}
            </div>
          )}

          {/* Elegant fallback when no GIF available */}
          {!loading && error && (
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-br from-primary/5 via-muted to-secondary/10 border border-border/50">
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <ImageOff className="w-10 h-10 text-primary/60" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-secondary flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-secondary-foreground" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground">Demonstração em breve</h4>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Estamos preparando um GIF animado para este exercício. Por enquanto, siga as dicas abaixo!
                  </p>
                </div>
              </div>
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

          {/* Default tips when no API data */}
          {!loading && error && !exercise.tips && (
            <div className="bg-secondary/50 border border-border rounded-lg p-4">
              <p className="text-sm font-medium mb-2">Dicas gerais:</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Execute o movimento com controle e amplitude completa</li>
                <li>Mantenha a respiração coordenada com o movimento</li>
                <li>Foque na contração muscular durante toda a execução</li>
              </ul>
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