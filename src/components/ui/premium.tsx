import * as React from "react";
import { cn } from "@/lib/utils";

export function SectionHeader({
  title,
  description,
  action,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div>
        <h2 className="section-title">{title}</h2>
        {description && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function MetricStrip({
  items,
  className,
}: {
  items: Array<{ label: React.ReactNode; value: React.ReactNode; hint?: React.ReactNode }>;
  className?: string;
}) {
  return (
    <div className={cn("metric-strip", className)}>
      {items.map((item, index) => (
        <div key={index} className="metric-strip-item">
          <p className="metric-label">{item.label}</p>
          <p className="metric-value">{item.value}</p>
          {item.hint && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.hint}</p>}
        </div>
      ))}
    </div>
  );
}

export function StatusLabel({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "accent" | "success" | "warning" | "danger";
  className?: string;
}) {
  return <span className={cn("status-label", `status-label-${tone}`, className)}>{children}</span>;
}

export function FormField({
  label,
  hint,
  children,
  className,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold text-foreground">{label}</span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}