import { AchievementBadge } from "./AchievementBadge";
import { Trophy } from "lucide-react";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirement_value: number;
  points: number;
}

interface UserAchievement {
  achievement_id: string;
  unlocked_at: string;
  notified: boolean;
}

interface AchievementsGridProps {
  achievements: Achievement[];
  userAchievements: UserAchievement[];
  totalPoints: number;
}

export function AchievementsGrid({ achievements, userAchievements, totalPoints }: AchievementsGridProps) {
  const unlockedIds = new Set(userAchievements.map(ua => ua.achievement_id));
  const unlockedCount = userAchievements.length;

  // Group by category
  const groupedAchievements = achievements.reduce((acc, ach) => {
    if (!acc[ach.category]) acc[ach.category] = [];
    acc[ach.category].push(ach);
    return acc;
  }, {} as Record<string, Achievement[]>);

  const categoryLabels: Record<string, string> = {
    streak: "Sequências",
    workout: "Treinos",
    checkin: "Evolução",
    milestone: "Marcos",
    special: "Especiais",
  };

  return (
    <div className="space-y-6">
      {/* Points summary */}
      <div className="flex items-center justify-between bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <Trophy className="h-5 w-5 text-yellow-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total de pontos</p>
            <p className="text-xl font-bold text-yellow-500">{totalPoints}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Conquistas</p>
          <p className="text-xl font-bold">
            {unlockedCount}/{achievements.length}
          </p>
        </div>
      </div>

      {/* Achievements by category */}
      {Object.entries(groupedAchievements).map(([category, categoryAchievements]) => (
        <div key={category}>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">
            {categoryLabels[category] || category}
          </h3>
          <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
            {categoryAchievements.map((achievement) => {
              const userAch = userAchievements.find(ua => ua.achievement_id === achievement.id);
              return (
                <AchievementBadge
                  key={achievement.id}
                  {...achievement}
                  unlocked={unlockedIds.has(achievement.id)}
                  unlockedAt={userAch?.unlocked_at}
                  size="md"
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}