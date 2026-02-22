import * as React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPIChipProps {
  label: string;
  value: string | number;
  icon?: React.ElementType;
  trend?: "up" | "down" | "stable";
  className?: string;
}

export function KPIChip({ label, value, icon: Icon, trend, className }: KPIChipProps) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border border-border/50 bg-card px-3 py-2",
        className
      )}
    >
      {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-sm font-semibold text-foreground">{value}</span>
        {trend && (
          <TrendIcon
            className={cn(
              "h-3 w-3",
              trend === "up" && "text-green-500",
              trend === "down" && "text-red-500",
              trend === "stable" && "text-muted-foreground"
            )}
          />
        )}
      </div>
    </div>
  );
}
