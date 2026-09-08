import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useWeeklyConsistency } from "@/hooks/useWeeklyConsistency";
import { useAnalytics } from "@/hooks/useAnalytics";

interface Props {
  context: "hoje" | "evolucao";
  className?: string;
}

/**
 * Resumo único de consistência da semana — mesma fonte de dados em Hoje e Evolução.
 * Sem gamificação: apenas o número, as submétricas e a origem do cálculo.
 */
export function WeeklyConsistencyBlock({ context, className }: Props) {
  const { loading, index, dimensions, basisCount, periodLabel, hasAnyData } = useWeeklyConsistency();
  const { trackConsistencySummaryViewed, trackWeeklyConsistencyViewed } = useAnalytics();
  const [showSource, setShowSource] = useState(false);

  useEffect(() => {
    if (loading) return;
    trackConsistencySummaryViewed(context);
    trackWeeklyConsistencyViewed(context);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, context]);

  if (loading) {
    return (
      <section className={cn("surface p-6 md:p-8", className)} aria-busy="true">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="mt-4 h-10 w-28" />
        <Skeleton className="mt-6 h-16 w-full" />
      </section>
    );
  }

  return (
    <section className={cn("surface p-6 md:p-8", className)}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow-label">Consistência da semana</p>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="font-display text-4xl leading-none text-foreground md:text-5xl">
              {index != null ? `${index}%` : "—"}
            </span>
            <span className="text-xs text-muted-foreground">{periodLabel}</span>
          </div>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            {index != null
              ? `Média das ${basisCount} dimensões com meta clara. As demais aparecem como número absoluto.`
              : hasAnyData
                ? "Ainda não há meta suficiente para calcular um índice. Veja as dimensões abaixo."
                : "Sem registros nesta semana. Faça o registro do dia para começar a medir."}
          </p>
        </div>

        {index != null && (
          <div className="w-full max-w-xs">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-[220ms] ease-out"
                style={{ width: `${index}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
        {dimensions.map((d) => (
          <div key={d.key}>
            <dt className="metric-label">{d.label}</dt>
            <dd className="mt-1 text-lg font-semibold text-foreground">{d.display}</dd>
            {d.percent != null && (
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-foreground/45 transition-[width] duration-[220ms] ease-out"
                  style={{ width: `${d.percent}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </dl>

      <button
        type="button"
        onClick={() => setShowSource((v) => !v)}
        aria-expanded={showSource}
        className="mt-6 inline-flex min-h-11 items-center gap-2 text-xs text-muted-foreground transition-colors duration-200 hover:text-foreground"
      >
        De onde vem esse número
        <ChevronDown
          className={cn("h-3.5 w-3.5 transition-transform duration-200", showSource && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      <div
        className={cn(
          "grid transition-all duration-200 ease-out",
          showSource ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <ul className="overflow-hidden space-y-2 text-xs leading-relaxed text-muted-foreground">
          {dimensions.map((d) => (
            <li key={d.key} className={showSource ? "pt-2" : ""}>
              <span className="text-foreground">{d.label}:</span> {d.source}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
