import * as React from "react";

interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  eyebrow?: React.ReactNode;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, eyebrow, actions }: PageHeaderProps) {
  return (
    <header className="pb-7 md:pb-9 border-b border-border/70">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-2.5">
          {eyebrow && <p className="eyebrow-label">{eyebrow}</p>}
          <h1 className="display-title flex items-center gap-3 min-w-0">{title}</h1>
          {subtitle && (
            <p className="text-[15px] text-muted-foreground max-w-2xl leading-relaxed">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </header>
  );
}
