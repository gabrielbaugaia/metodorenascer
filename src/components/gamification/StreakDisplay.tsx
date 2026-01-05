import { Flame, Trophy, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
  compact?: boolean;
}

export function StreakDisplay({ currentStreak, longestStreak, compact = false }: StreakDisplayProps) {
  const getStreakColor = (streak: number) => {
    if (streak >= 30) return "text-yellow-400";
    if (streak >= 14) return "text-orange-400";
    if (streak >= 7) return "text-primary";
    return "text-muted-foreground";
  };

  const getFlameIntensity = (streak: number) => {
    if (streak >= 30) return "animate-pulse";
    if (streak >= 7) return "";
    return "";
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
        <Flame className={cn("h-4 w-4", getStreakColor(currentStreak), getFlameIntensity(currentStreak))} />
        <span className={cn("font-bold text-sm", getStreakColor(currentStreak))}>
          {currentStreak} {currentStreak === 1 ? "dia" : "dias"}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "h-12 w-12 rounded-full flex items-center justify-center",
            currentStreak > 0 ? "bg-primary/20" : "bg-muted"
          )}>
            <Flame className={cn(
              "h-6 w-6",
              getStreakColor(currentStreak),
              getFlameIntensity(currentStreak)
            )} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Sequência atual</p>
            <p className={cn("text-2xl font-bold", getStreakColor(currentStreak))}>
              {currentStreak} {currentStreak === 1 ? "dia" : "dias"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground">
          <Trophy className="h-4 w-4 text-yellow-500" />
          <span className="text-sm">Recorde: {longestStreak}</span>
        </div>
      </div>

      {/* Progress to next milestone */}
      {currentStreak > 0 && (
        <div className="mt-4">
          <StreakProgress current={currentStreak} />
        </div>
      )}
    </div>
  );
}

function StreakProgress({ current }: { current: number }) {
  const milestones = [3, 7, 14, 30];
  const nextMilestone = milestones.find(m => m > current) || 30;
  const prevMilestone = milestones.filter(m => m <= current).pop() || 0;
  
  const progress = ((current - prevMilestone) / (nextMilestone - prevMilestone)) * 100;

  const getMilestoneLabel = (milestone: number) => {
    switch (milestone) {
      case 3: return "3 dias";
      case 7: return "Semana";
      case 14: return "Guerreiro";
      case 30: return "Imparável";
      default: return `${milestone}d`;
    }
  };

  return (
    <div>
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>{current >= nextMilestone ? "Meta alcançada!" : `Próxima: ${getMilestoneLabel(nextMilestone)}`}</span>
        <span>{current}/{nextMilestone}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-primary to-orange-500 transition-all duration-500"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </div>
  );
}