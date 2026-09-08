import * as React from "react";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Estados padrão de página (carregando / erro / vazio).
 * Referência de qualidade: tela de Treino.
 */

interface PageLoadingStateProps {
  /** Texto discreto exibido abaixo do indicador. */
  message?: string;
  /** Quando true, mostra blocos de conteúdo em vez do indicador circular. */
  variant?: "spinner" | "skeleton";
}

export function PageLoadingState({
  message = "Carregando...",
  variant = "spinner",
}: PageLoadingStateProps) {
  if (variant === "skeleton") {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-6 animate-pulse" aria-busy="true">
        <div className="space-y-3">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-3 w-80 max-w-full" />
        </div>
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div
      className="flex min-h-[55dvh] flex-col items-center justify-center gap-4"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" strokeWidth={1.5} />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

interface PageErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  /** Ação secundária opcional (ex.: falar com o mentor). */
  secondaryLabel?: string;
  secondaryAction?: () => void;
}

export function PageErrorState({
  title = "Não foi possível carregar",
  description = "Houve uma falha de conexão. Tente novamente em instantes.",
  onRetry,
  retryLabel = "Tentar novamente",
  secondaryLabel,
  secondaryAction,
}: PageErrorStateProps) {
  return (
    <Card className="mx-auto max-w-lg border-destructive/40 p-8 text-center" role="alert">
      <AlertTriangle
        className="mx-auto mb-4 h-9 w-9 text-destructive"
        strokeWidth={1.4}
        aria-hidden="true"
      />
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="min-h-11">
            <RefreshCw className="mr-2 h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
            {retryLabel}
          </Button>
        )}
        {secondaryLabel && secondaryAction && (
          <Button size="sm" onClick={secondaryAction} className="min-h-11">
            {secondaryLabel}
          </Button>
        )}
      </div>
    </Card>
  );
}

interface PageEmptyStateProps {
  icon: React.ElementType;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaAction?: () => void;
  secondaryLabel?: string;
  secondaryAction?: () => void;
}

export function PageEmptyState({
  icon: Icon,
  title,
  description,
  ctaLabel,
  ctaAction,
  secondaryLabel,
  secondaryAction,
}: PageEmptyStateProps) {
  return (
    <Card className="mx-auto max-w-lg p-10 text-center">
      <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mx-auto mb-5 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {ctaLabel && ctaAction && (
          <Button size="sm" onClick={ctaAction} className="min-h-11">
            {ctaLabel}
          </Button>
        )}
        {secondaryLabel && secondaryAction && (
          <Button variant="outline" size="sm" onClick={secondaryAction} className="min-h-11">
            {secondaryLabel}
          </Button>
        )}
      </div>
    </Card>
  );
}
