import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-border/50 hover:bg-transparent">
            <TableHead className="text-muted-foreground font-semibold">Exercício</TableHead>
            <TableHead className="text-center text-muted-foreground font-semibold">Séries</TableHead>
            <TableHead className="text-center text-muted-foreground font-semibold">Reps</TableHead>
            <TableHead className="text-center text-muted-foreground font-semibold">Intervalo</TableHead>
            <TableHead className="text-center text-muted-foreground font-semibold w-16">Vídeo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {exercises.map((exercise, index) => (
            <TableRow
              key={exercise.name}
              className={cn(
                "cursor-pointer transition-all hover:bg-primary/5 border-border/30",
                exercise.completed && "opacity-60"
              )}
              onClick={() => onExerciseClick(exercise)}
            >
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {exercise.completed && (
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  )}
                  <span className={cn(exercise.completed && "line-through")}>
                    {exercise.name}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold text-sm">
                  {exercise.sets}
                </span>
              </TableCell>
              <TableCell className="text-center">
                <span className="text-foreground font-medium">{exercise.reps}</span>
              </TableCell>
              <TableCell className="text-center">
                <span className="text-muted-foreground">{exercise.rest}</span>
              </TableCell>
              <TableCell className="text-center">
                <button
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary/20 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onExerciseClick(exercise);
                  }}
                >
                  <Play className="w-4 h-4" />
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
