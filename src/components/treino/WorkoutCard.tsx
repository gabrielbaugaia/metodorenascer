import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, Clock, CheckCircle, Flame, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";
import { ExerciseTable } from "./ExerciseTable";
import { ExerciseVideoModal } from "./ExerciseVideoModal";

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  videoUrl: string;
  tips?: string;
  completed?: boolean;
}

interface WorkoutCardProps {
  day: string;
  focus: string;
  exercises: Exercise[];
  duration: string;
  completed: boolean;
  calories?: number;
  index: number;
}

export function WorkoutCard({
  day,
  focus,
  exercises,
  duration,
  completed,
  calories = 350,
  index,
}: WorkoutCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleExerciseClick = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setModalOpen(true);
  };

  const completedCount = exercises.filter((e) => e.completed).length;
  const progressPercent = (completedCount / exercises.length) * 100;

  return (
    <>
      <Card
        className={cn(
          "animate-fade-in overflow-hidden transition-all",
          completed
            ? "border-primary/40 bg-primary/5"
            : "border-border/50 hover:border-primary/30"
        )}
        style={{ animationDelay: `${index * 0.1}s` }}
      >
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer select-none">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Day badge */}
                  <div
                    className={cn(
                      "w-14 h-14 rounded-2xl flex flex-col items-center justify-center",
                      completed
                        ? "bg-primary text-primary-foreground"
                        : "bg-gradient-to-br from-orange-500 to-red-500 text-white"
                    )}
                  >
                    {completed ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <>
                        <span className="text-[10px] uppercase font-medium opacity-80">
                          {day.slice(0, 3)}
                        </span>
                        <Dumbbell className="w-5 h-5" />
                      </>
                    )}
                  </div>

                  {/* Info */}
                  <div>
                    <CardTitle className="text-lg font-display mb-1">
                      {focus}
                    </CardTitle>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-orange-500" />
                        ~{calories} kcal
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge
                    variant={completed ? "default" : "outline"}
                    className={cn(
                      completed && "bg-primary/20 text-primary border-primary/30"
                    )}
                  >
                    {exercises.length} exercícios
                  </Badge>
                  <ChevronDown
                    className={cn(
                      "w-5 h-5 text-muted-foreground transition-transform",
                      isOpen && "rotate-180"
                    )}
                  />
                </div>
              </div>

              {/* Progress bar */}
              {!completed && completedCount > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Progresso</span>
                    <span>
                      {completedCount}/{exercises.length}
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-0">
              <ExerciseTable
                exercises={exercises}
                onExerciseClick={handleExerciseClick}
              />

              {!completed && (
                <Button className="mt-4 w-full" size="lg">
                  <Dumbbell className="w-4 h-4 mr-2" />
                  Iniciar Treino
                </Button>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      <ExerciseVideoModal
        exercise={selectedExercise}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  );
}
