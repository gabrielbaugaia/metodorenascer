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
    <Card className="p-8 text-center">
      <Icon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" strokeWidth={1.5} />
      <h3 className="text-base font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">{description}</p>
      {ctaLabel && ctaAction && (
        <Button onClick={ctaAction} size="sm">
          {ctaLabel}
        </Button>
      )}
    </Card>
  );
}
