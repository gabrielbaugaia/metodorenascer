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
        "flex items-center gap-3 rounded-2xl border border-border/80 bg-card p-4 text-left shadow-[var(--shadow-soft)] transition-colors",
        onClick && "cursor-pointer hover:border-primary/35",
        className
      )}
    >
      <Icon className="h-4 w-4 text-primary shrink-0" strokeWidth={1.5} />
      <div className="min-w-0">
        <p className="text-xl font-bold text-foreground leading-tight">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground truncate">{label}</p>
      </div>
    </Comp>
  );
}
