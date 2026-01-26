import { Play, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  videoUrl?: string;
  tips?: string;
  completed?: boolean;
}

interface ExerciseTableProps {
  exercises: Exercise[];
  onExerciseClick: (exercise: Exercise) => void;
}

export function ExerciseTable({ exercises, onExerciseClick }: ExerciseTableProps) {
  const safeExercises = exercises || [];

  if (safeExercises.length === 0) {
    return (
      <div className="py-4 text-center">
        <p className="text-muted-foreground text-sm">Nenhum exercício disponível</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header - hidden on mobile, shown on larger screens */}
      <div className="hidden sm:grid sm:grid-cols-[1fr_60px_80px_70px_50px] gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground border-b border-border/50">
        <span>Exercício</span>
        <span className="text-center">Séries</span>
        <span className="text-center">Reps</span>
        <span className="text-center">Intervalo</span>
        <span className="text-center">Vídeo</span>
      </div>

      {/* Exercise rows */}
      {safeExercises.map((exercise, index) => (
        <div
          key={exercise.name}
          className={cn(
            "rounded-lg border border-border/30 p-3 cursor-pointer transition-all hover:bg-primary/5 hover:border-primary/30 active:scale-[0.99]",
            exercise.completed && "opacity-60 bg-muted/30"
          )}
          onClick={() => onExerciseClick(exercise)}
        >
          {/* Mobile layout - stacked */}
          <div className="sm:hidden">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {exercise.completed && (
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                )}
                <span className={cn(
                  "font-medium text-sm text-foreground truncate",
                  exercise.completed && "line-through"
                )}>
                  {exercise.name}
                </span>
              </div>
              <button
                className="w-8 h-8 rounded-full bg-primary/20 text-primary hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onExerciseClick(exercise);
                }}
              >
                <Play className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary font-bold">
                {exercise.sets}x
              </span>
              <span className="text-foreground font-medium">{exercise.reps} reps</span>
              <span className="text-muted-foreground">{exercise.rest}</span>
            </div>
          </div>

          {/* Desktop layout - grid */}
          <div className="hidden sm:grid sm:grid-cols-[1fr_60px_80px_70px_50px] gap-2 items-center">
            <div className="flex items-center gap-2 min-w-0">
              {exercise.completed && (
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              )}
              <span className={cn(
                "font-medium text-foreground truncate",
                exercise.completed && "line-through"
              )}>
                {exercise.name}
              </span>
            </div>
            <div className="text-center">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold text-sm">
                {exercise.sets}
              </span>
            </div>
            <div className="text-center">
              <span className="text-foreground font-medium text-sm">{exercise.reps}</span>
            </div>
            <div className="text-center">
              <span className="text-muted-foreground text-sm">{exercise.rest}</span>
            </div>
            <div className="text-center">
              <button
                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onExerciseClick(exercise);
                }}
              >
                <Play className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}