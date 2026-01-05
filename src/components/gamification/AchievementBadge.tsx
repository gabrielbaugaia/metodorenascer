import { Flame, Dumbbell, Camera, Star, Calendar, Trophy, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AchievementBadgeProps {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  unlocked: boolean;
  unlockedAt?: string;
  size?: "sm" | "md" | "lg";
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  flame: Flame,
  dumbbell: Dumbbell,
  camera: Camera,
  star: Star,
  calendar: Calendar,
  trophy: Trophy,
};

const categoryColors: Record<string, string> = {
  streak: "from-orange-500 to-red-500",
  workout: "from-blue-500 to-indigo-500",
  checkin: "from-green-500 to-emerald-500",
  milestone: "from-purple-500 to-pink-500",
  special: "from-yellow-500 to-amber-500",
};

export function AchievementBadge({
  id,
  name,
  description,
  icon,
  category,
  points,
  unlocked,
  unlockedAt,
  size = "md",
}: AchievementBadgeProps) {
  const IconComponent = iconMap[icon] || Star;
  const gradientColor = categoryColors[category] || categoryColors.milestone;

  const sizeClasses = {
    sm: "h-10 w-10",
    md: "h-14 w-14",
    lg: "h-20 w-20",
  };

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-10 w-10",
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex flex-col items-center gap-2">
            <div
              className={cn(
                "rounded-full flex items-center justify-center transition-all duration-300",
                sizeClasses[size],
                unlocked
                  ? `bg-gradient-to-br ${gradientColor} shadow-lg`
                  : "bg-muted border-2 border-dashed border-muted-foreground/30"
              )}
            >
              {unlocked ? (
                <IconComponent className={cn(iconSizes[size], "text-white")} />
              ) : (
                <Lock className={cn(iconSizes[size], "text-muted-foreground/50")} />
              )}
            </div>
            {size !== "sm" && (
              <div className="text-center">
                <p className={cn(
                  "text-xs font-medium",
                  unlocked ? "text-foreground" : "text-muted-foreground"
                )}>
                  {name}
                </p>
                {unlocked && (
                  <p className="text-[10px] text-primary">+{points} pts</p>
                )}
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold">{name}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
            {unlocked && unlockedAt && (
              <p className="text-xs text-primary">
                Desbloqueado em {new Date(unlockedAt).toLocaleDateString("pt-BR")}
              </p>
            )}
            {!unlocked && (
              <p className="text-xs text-muted-foreground">
                Recompensa: {points} pontos
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}