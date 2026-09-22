import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface RunRow {
  id: string;
  user_id: string;
  mode: string;
  engine_version: string | null;
  status: string;
  confidence: string | null;
  review_reasons: string[] | null;
  overrides_applied: string[] | null;
  trainer_decision: string;
  created_at: string;
  proposed_volume: Record<string, number> | null;
}

const STATUS_LABEL: Record<string, string> = {
  APROVADO: "Aprovado pelo motor",
  REQUER_REVISAO: "Requer revisão",
  BLOQUEADO: "Bloqueado",
};

const MODE_LABEL: Record<string, string> = {
  shadow: "Modo sombra",
  geracao: "Geração de treino",
  geracao_bloqueada: "Geração bloqueada",
};

export function PrescriptionRunsHistory() {
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("prescription_runs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    const rows = (data as unknown as RunRow[]) || [];
    setRuns(rows);
    const ids = [...new Set(rows.map((r) => r.user_id).filter(Boolean))];
    if (ids.length) {
      const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", ids);
      const map: Record<string, string> = {};
      (profiles || []).forEach((p: { id: string; full_name: string | null }) => {
        map[p.id] = p.full_name || "Aluno";
      });
      setNames(map);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const decide = async (id: string, decision: "aceito" | "alterou" | "rejeitou") => {
    const { data: authData } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("prescription_runs")
      .update({
        trainer_decision: decision,
        decided_by: authData.user?.id ?? null,
        decided_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) { toast.error("Não foi possível registrar a decisão."); return; }
    toast.success("Decisão registrada.");
    load();
  };

  if (loading) return <Skeleton className="h-64 w-full" />;

  if (runs.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Nenhuma execução do motor registrada ainda. Rode o modo sombra ou gere um treino para começar o histórico.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {runs.map((run) => (
        <Card key={run.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex flex-wrap items-center gap-2">
              <span>{names[run.user_id] || "Aluno"}</span>
              <Badge variant="outline">{MODE_LABEL[run.mode] || run.mode}</Badge>
              <Badge variant="outline">{STATUS_LABEL[run.status] || run.status}</Badge>
              {run.confidence && <Badge variant="outline">confiança {run.confidence}</Badge>}
              <span className="text-xs font-normal text-muted-foreground">
                {new Date(run.created_at).toLocaleString("pt-BR")}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-xs text-muted-foreground">
              Motor {run.engine_version || "—"} · séries diretas propostas:{" "}
              {run.proposed_volume ? Object.values(run.proposed_volume).reduce((a, b) => a + b, 0) : "—"}
            </p>
            {run.review_reasons && run.review_reasons.length > 0 && (
              <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1">
                {run.review_reasons.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            )}
            {run.overrides_applied && run.overrides_applied.length > 0 && (
              <p className="text-xs text-brand-gold">{run.overrides_applied.length} decisão(ões) de override humano</p>
            )}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-muted-foreground">Decisão: {run.trainer_decision}</span>
              <Button size="sm" variant="outline" className="min-h-9" onClick={() => decide(run.id, "aceito")}>Aceitei</Button>
              <Button size="sm" variant="outline" className="min-h-9" onClick={() => decide(run.id, "alterou")}>Alterei</Button>
              <Button size="sm" variant="outline" className="min-h-9" onClick={() => decide(run.id, "rejeitou")}>Rejeitei</Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
