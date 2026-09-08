import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAnalytics } from "@/hooks/useAnalytics";
import { SectionHeader } from "@/components/ui/premium";

type ViewKey = "frente" | "lado" | "costas";

const VIEWS: { key: ViewKey; label: string }[] = [
  { key: "frente", label: "Frente" },
  { key: "lado", label: "Lado" },
  { key: "costas", label: "Costas" },
];

interface Props {
  initial: Partial<Record<ViewKey, string | null>>;
  current: Partial<Record<ViewKey, string | null>>;
  initialDate?: string | null;
  currentDate?: string | null;
}

/** Antes/depois lado a lado — mobile-first, com seletor de ângulo. */
export function PhotoComparison({ initial, current, initialDate, currentDate }: Props) {
  const { trackEvolutionComparisonViewed, trackEvolutionPhotoCompared } = useAnalytics();
  const available = VIEWS.filter((v) => initial[v.key] || current[v.key]);
  const [view, setView] = useState<ViewKey>(available[0]?.key ?? "frente");

  useEffect(() => {
    trackEvolutionComparisonViewed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fmt = (value?: string | null) =>
    value ? format(new Date(value), "dd/MM/yyyy", { locale: ptBR }) : null;

  if (available.length === 0) {
    return (
      <section className="section-block">
        <SectionHeader title="Antes e depois" />
        <div className="surface p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Camera className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
          </div>
          <p className="text-sm font-semibold text-foreground">Nenhuma comparação disponível ainda</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Assim que você enviar o primeiro conjunto de fotos de evolução, elas aparecem aqui lado a lado
            com as fotos iniciais da anamnese.
          </p>
        </div>
      </section>
    );
  }

  const pairs: { label: string; src: string | null | undefined; date: string | null }[] = [
    { label: "Início", src: initial[view], date: fmt(initialDate) },
    { label: "Agora", src: current[view], date: fmt(currentDate) },
  ];

  return (
    <section className="section-block">
      <SectionHeader
        title="Antes e depois"
        description="Mesma pose, mesmo ângulo. A foto mostra o que a balança não conta."
        action={
          <div className="flex gap-1 rounded-xl border border-border/60 p-1" role="group" aria-label="Ângulo da foto">
            {available.map((v) => (
              <button
                key={v.key}
                type="button"
                onClick={() => {
                  setView(v.key);
                  trackEvolutionPhotoCompared(v.key);
                }}
                aria-pressed={view === v.key}
                className={cn(
                  "min-h-11 rounded-lg px-3 text-xs font-medium transition-colors duration-200",
                  view === v.key ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:gap-5">
        {pairs.map((p) => (
          <figure key={p.label} className="surface overflow-hidden p-0">
            <div className="relative aspect-[3/4] bg-muted">
              {p.src ? (
                <img
                  src={p.src}
                  alt={`Foto ${p.label.toLowerCase()} — ângulo ${view}`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                  <Camera className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
                  <span className="text-xs">Sem foto</span>
                </div>
              )}
            </div>
            <figcaption className="flex items-baseline justify-between gap-2 px-4 py-3">
              <span className="text-sm font-semibold text-foreground">{p.label}</span>
              {p.date && <span className="text-xs text-muted-foreground">{p.date}</span>}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
