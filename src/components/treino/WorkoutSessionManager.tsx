import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Clock, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { useWorkoutSession, SessionSummary } from "@/hooks/useWorkoutSession";
import { ExerciseSetTracker } from "./ExerciseSetTracker";
import { RestCountdown } from "./RestCountdown";
import { WorkoutSummary } from "./WorkoutSummary";
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

interface WorkoutSessionManagerProps {
  workoutName: string;
  exercises: Exercise[];
  onComplete: (durationSeconds: number, sessionId: string) => void;
  onCancel: () => void;
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function WorkoutSessionManager({
  workoutName,
  exercises,
  onComplete,
  onCancel,
}: WorkoutSessionManagerProps) {
  const session = useWorkoutSession(exercises);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [started, setStarted] = useState(false);

  const handleStart = async () => {
    await session.startSession(workoutName);
    setStarted(true);
  };

  const handleFinish = async () => {
    const result = await session.finishSession();
    if (result) {
      setSummary(result);
    }
  };

  const handleSummaryClose = () => {
    if (summary && session.sessionId) {
      onComplete(summary.totalDurationSeconds, session.sessionId);
    }
    setSummary(null);
  };

  // Summary screen
  if (summary) {
    return (
      <WorkoutSummary
        summary={summary}
        workoutName={workoutName}
        onClose={handleSummaryClose}
      />
    );
  }

  // Pre-start screen
  if (!started) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-lg font-bold text-foreground uppercase">
              {workoutName}
            </h2>
            <p className="text-xs text-muted-foreground">
              {exercises.length} exercícios
            </p>
          </div>
        </div>

        <Card className="p-6 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
            <Clock className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Pronto para treinar?
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              O cronômetro vai iniciar e você registrará a carga de cada série.
              O descanso entre séries é obrigatório.
            </p>
          </div>
          <Button
            variant="fire"
            size="lg"
            className="w-full"
            onClick={handleStart}
          >
            Iniciar Treino
          </Button>
        </Card>
      </div>
    );
  }

  // Active session
  return (
    <div className="space-y-4">
      {/* Rest countdown overlay */}
      {session.restTimer.active && (
        <RestCountdown
          remainingSeconds={session.restTimer.remainingSeconds}
          totalSeconds={
            session.parseRest(
              exercises.find(
                (e) => e.name === session.restTimer.exerciseName
              )?.rest || "60s"
            )
          }
          exerciseName={session.restTimer.exerciseName}
        />
      )}

      {/* Header with timer */}
      <div className="flex items-center justify-between sticky top-0 z-40 bg-background/95 backdrop-blur-sm py-2 -mx-1 px-1">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-sm font-bold text-foreground uppercase">
              {workoutName}
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
          <Clock className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-primary tabular-nums">
            {formatElapsed(session.elapsedSeconds)}
          </span>
        </div>
      </div>

      {/* Exercise trackers */}
      <div className="space-y-3">
        {exercises.map((exercise) => (
          <ExerciseSetTracker
            key={exercise.name}
            exerciseName={exercise.name}
            totalSets={exercise.sets}
            prescribedReps={exercise.reps}
            prescribedRest={exercise.rest}
            restSeconds={session.parseRest(exercise.rest)}
            completedSets={session.getCompletedSets(exercise.name)}
            lastWeight={session.lastWeights[exercise.name] || 0}
            canLog={session.canLogSet()}
            onLogSet={session.logSet}
          />
        ))}
      </div>

      {/* Complete button */}
      <Button
        variant="fire"
        size="lg"
        className={cn("w-full", !session.canCompleteWorkout && "opacity-50")}
        disabled={!session.canCompleteWorkout || session.saving}
        onClick={handleFinish}
      >
        {session.saving ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <CheckCircle className="w-4 h-4 mr-2" />
        )}
        Concluir Treino
      </Button>
    </div>
  );
}
