import { useEffect, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAnalytics } from "@/hooks/useAnalytics";

interface Props {
  /** Última análise salva no check-in (texto simples ou JSON estruturado). */
  analysis: string | null | undefined;
  analysisDate?: string | null;
  /** Observações escritas pelo próprio aluno no último check-in. */
  studentNotes?: string | null;
}

function extractSummary(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as { resumoGeral?: string };
      return parsed.resumoGeral?.trim() || null;
    } catch {
      return null;
    }
  }
  return trimmed;
}

/** Leitura do treinador — usa apenas conteúdo já salvo. Sem texto inventado. */
export function CoachReading({ analysis, analysisDate, studentNotes }: Props) {
  const { trackEvolutionInsightViewed } = useAnalytics();
  const summary = useMemo(() => extractSummary(analysis), [analysis]);

  useEffect(() => {
    trackEvolutionInsightViewed(summary ? "disponivel" : "vazio");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary]);

  return (
    <section className="surface-quiet p-7 md:p-9">
      <p className="eyebrow-label">Leitura do treinador</p>
      {summary ? (
        <>
          <p className="font-display mt-3 max-w-2xl text-lg leading-snug text-foreground md:text-xl">
            {summary}
          </p>
          {studentNotes && (
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Suas observações no check-in: “{studentNotes}”
            </p>
          )}
          <p className="mt-5 text-xs text-muted-foreground">
            Gabriel Baú · Consultoria
            {analysisDate ? ` · ${format(new Date(analysisDate), "dd/MM/yyyy", { locale: ptBR })}` : ""}
          </p>
        </>
      ) : (
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Ainda não há leitura registrada para o seu ciclo. Ela é gerada quando você envia um novo conjunto
          de fotos de evolução com o peso do período.
        </p>
      )}
    </section>
  );
}
