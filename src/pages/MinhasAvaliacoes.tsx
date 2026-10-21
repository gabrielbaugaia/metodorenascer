import { useEffect, useState } from "react";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAssessments } from "@/hooks/usePhysicalAssessments";
import { AssessmentSummary, ComparisonPanel, EvolutionCharts, dateBR } from "@/components/assessment/AssessmentEvolution";
import { fmt } from "@/lib/physicalAssessment";

export default function MinhasAvaliacoes() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useAssessments(user?.id, "student");
  const items = data ?? [];
  const [selected, setSelected] = useState<string>("");
  useEffect(() => {
    if (items.length && !items.some((x) => x.id === selected)) setSelected(items[items.length - 1].id);
  }, [items, selected]);
  const current = items.find((x) => x.id === selected);
  const name = (user?.user_metadata as any)?.full_name || user?.email || "Aluno";

  return (
    <ClientLayout>
      <div className="space-y-8">
        <PageHeader eyebrow="Composição corporal" title="Minhas Avaliações" subtitle="Histórico das suas avaliações físicas publicadas pela Equipe GB." />
        {isLoading ? (
          <div className="flex justify-center py-16" role="status" aria-label="Carregando"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : error ? (
          <div className="surface p-6 space-y-3" role="alert">
            <p>Não foi possível carregar suas avaliações.</p>
            <Button variant="outline" onClick={() => refetch()}>Tentar novamente</Button>
          </div>
        ) : !items.length ? (
          <div className="surface p-8 text-center text-muted-foreground">Nenhuma avaliação publicada ainda. Quando sua avaliação for publicada, ela aparece aqui.</div>
        ) : (
          <>
            <nav aria-label="Avaliações por data" className="flex gap-2 overflow-x-auto pb-1">
              {[...items].reverse().map((a) => (
                <button
                  key={a.id}
                  onClick={() => setSelected(a.id)}
                  aria-pressed={a.id === selected}
                  className={`shrink-0 rounded-xl border px-4 py-3 text-left min-h-11 transition-colors duration-200 ${a.id === selected ? "border-primary bg-primary/10" : "border-border hover:bg-muted/40"}`}
                >
                  <span className="block text-sm font-semibold">{dateBR(a.assessed_at)}</span>
                  <span className="block text-xs text-muted-foreground">{fmt(a.results?.body_fat_pct, 1)}% gordura</span>
                </button>
              ))}
            </nav>
            {current && <AssessmentSummary a={current} studentName={name} />}
            <EvolutionCharts items={items} />
            <ComparisonPanel items={items} />
          </>
        )}
      </div>
    </ClientLayout>
  );
}
