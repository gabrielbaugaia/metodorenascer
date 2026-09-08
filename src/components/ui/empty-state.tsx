import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, ctaLabel, ctaAction }: EmptyStateProps) {
  return (
    <Card className="p-10 text-center">
      <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground mb-5 max-w-sm mx-auto">{description}</p>
      {ctaLabel && ctaAction && (
        <Button onClick={ctaAction} size="sm">
          {ctaLabel}
        </Button>
      )}
    </Card>
  );
}
