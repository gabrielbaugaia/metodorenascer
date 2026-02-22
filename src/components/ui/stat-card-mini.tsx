import * as React from "react";
import { cn } from "@/lib/utils";

interface StatCardMiniProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  onClick?: () => void;
  className?: string;
}

export function StatCardMini({ label, value, icon: Icon, onClick, className }: StatCardMiniProps) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 rounded-xl border border-border/50 bg-card p-3 text-left transition-colors",
        onClick && "cursor-pointer hover:border-primary/30",
        className
      )}
    >
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
      <div className="min-w-0">
        <p className="text-lg font-semibold text-foreground leading-tight">{value}</p>
        <p className="text-[10px] text-muted-foreground truncate">{label}</p>
      </div>
    </Comp>
  );
}
