import { useEffect, useState } from "react";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMovementAssessments } from "@/hooks/useMovementAssessments";
import { MovementReportView } from "@/components/assessment/MovementReport";

export default function MinhasAvaliacoesMovimento() {
  const { user } = useAuth();
  const query = useMovementAssessments(user?.id);
  const [selected, setSelected] = useState("");
  const items = query.data ?? [];
  useEffect(() => { if (items.length && !items.some(a => a.id === selected)) setSelected(items[0].id); }, [items, selected]);
  const current = items.find(a => a.id === selected);
  return <ClientLayout><div className="space-y-6">
    <PageHeader eyebrow="Equipe GB" title="Minhas avaliações de movimento" subtitle="Laudos, fotos e orientações publicados pela consultoria." />
    {query.isLoading ? <Loader2 className="animate-spin h-6 w-6" role="status" aria-label="Carregando avaliações" /> : query.error ? <div role="alert"><p>Não foi possível carregar seus laudos.</p><Button variant="outline" onClick={() => query.refetch()}>Tentar novamente</Button></div> : !items.length ? <p className="text-muted-foreground">Nenhuma avaliação de movimento publicada ainda.</p> : <>
      <nav aria-label="Histórico de movimento" className="flex gap-2 overflow-x-auto pb-2">{items.map(a => <Button key={a.id} variant={selected === a.id ? "default" : "outline"} className="shrink-0" aria-pressed={selected === a.id} onClick={() => setSelected(a.id)}>{new Date(a.assessed_at + "T12:00:00").toLocaleDateString("pt-BR")} · v{a.version}</Button>)}</nav>
      {current && <MovementReportView assessment={current} studentName={user?.user_metadata?.full_name ?? "Aluno"} />}
    </>}
  </div></ClientLayout>;
}