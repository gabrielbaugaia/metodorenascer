import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface TrendIndicatorProps {
  trend: "up" | "down" | "stable";
  text: string;
}

export function TrendIndicator({ trend, text }: TrendIndicatorProps) {
  const Icon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const color =
    trend === "up"
      ? "text-green-400"
      : trend === "down"
      ? "text-red-400"
      : "text-muted-foreground";

  return (
    <div className="flex items-center gap-2">
      <Icon className={`h-5 w-5 ${color}`} />
      <span className={`text-sm font-medium ${color}`}>{text}</span>
    </div>
  );
}
