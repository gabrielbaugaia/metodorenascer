import { Brain, Zap, Target, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Props {
  profileType: string;
  confidence: number;
}

const PROFILE_CONFIG: Record<string, { label: string; icon: typeof Brain; color: string }> = {
  consistent: { label: "Consistente", icon: Flame, color: "text-orange-500" },
  explorer: { label: "Explorador", icon: Brain, color: "text-blue-500" },
  resistant: { label: "Em adaptação", icon: Zap, color: "text-yellow-500" },
  executor: { label: "Executor", icon: Target, color: "text-emerald-500" },
};

export function BehaviorProfileBadge({ profileType, confidence }: Props) {
  const config = PROFILE_CONFIG[profileType] || PROFILE_CONFIG.executor;
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1">
        <Icon className={`h-3.5 w-3.5 ${config.color}`} />
        <span className="text-xs font-medium">{config.label}</span>
      </Badge>
      {confidence >= 70 && (
        <span className="text-[10px] text-muted-foreground">{confidence}% confiança</span>
      )}
    </div>
  );
}
