import { Trophy } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Props {
  challengeLabel: string;
  targetDays: number;
  currentStreak: number;
}

export function ActiveChallengeCard({ challengeLabel, targetDays, currentStreak }: Props) {
  const progress = Math.min(100, (currentStreak / targetDays) * 100);
  const daysLeft = Math.max(0, targetDays - currentStreak);

  return (
    <div className="rounded-xl border border-border/50 bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="h-4 w-4 text-amber-500" />
        <h3 className="text-sm font-semibold">{challengeLabel}</h3>
      </div>
      <Progress value={progress} className="h-2 mb-2" />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Dia {Math.min(currentStreak, targetDays)} de {targetDays}</span>
        {daysLeft > 0 ? (
          <span>{daysLeft} dias restantes</span>
        ) : (
          <span className="text-emerald-500 font-medium">Completo! 🎉</span>
        )}
      </div>
    </div>
  );
}
