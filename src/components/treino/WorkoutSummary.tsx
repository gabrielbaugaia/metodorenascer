import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trophy, Clock, Dumbbell, Flame, CheckCircle } from "lucide-react";
import type { SessionSummary } from "@/hooks/useWorkoutSession";

interface WorkoutSummaryProps {
  summary: SessionSummary;
  workoutName: string;
  onClose: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function WorkoutSummary({
  summary,
  workoutName,
  onClose,
}: WorkoutSummaryProps) {
  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <Card className="w-full max-w-md p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
            <Trophy className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground uppercase">
            Treino Concluído!
          </h2>
          <p className="text-sm text-muted-foreground">{workoutName}</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-center">
            <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground tabular-nums">
              {formatDuration(summary.totalDurationSeconds)}
            </p>
            <p className="text-xs text-muted-foreground">Duração</p>
          </div>
          <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-center">
            <Dumbbell className="w-5 h-5 text-orange-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">
              {summary.totalSets}
            </p>
            <p className="text-xs text-muted-foreground">Séries</p>
          </div>
          <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
            <Flame className="w-5 h-5 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">
              {Math.round(summary.totalVolume).toLocaleString()} kg
            </p>
            <p className="text-xs text-muted-foreground">Volume Total</p>
          </div>
          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
            <CheckCircle className="w-5 h-5 text-purple-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">
              {summary.exercisesCompleted}
            </p>
            <p className="text-xs text-muted-foreground">Exercícios</p>
          </div>
        </div>

        <Button variant="fire" className="w-full" size="lg" onClick={onClose}>
          Salvar e Fechar
        </Button>
      </Card>
    </div>
  );
}
