import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";

interface StudentRow { id: string; full_name: string | null; email: string | null }

interface DiffRow {
  muscle: string;
  label: string;
  currentSets: number | null;
  suggestedSets: number;
  diff: number | null;
  currentFrequency: number | null;
  suggestedFrequency: number;
  targetRir: string;
  repRange: string;
  priority: string;
  source: string;
  reason: string;
}

interface ShadowResponse {
  student?: { id: string; name: string | null };
  plan: Record<string, any>;
  gate: { status: "APROVADO" | "REQUER_REVISAO" | "BLOQUEADO"; reasons: string[] };
  diff: DiffRow[];
  runId: string | null;
  notes: string[];
  currentProtocol: { id: string; titulo: string; created_at: string; volumeSource: string } | null;
}

const STATUS_META = {
  APROVADO: { label: "Aprovado pelo motor", icon: ShieldCheck, className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  REQUER_REVISAO: { label: "Requer revisão", icon: ShieldAlert, className: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  BLOQUEADO: { label: "Bloqueado", icon: ShieldX, className: "bg-destructive/15 text-destructive border-destructive/30" },
} as const;

export function PrescriptionShadowMode() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ShadowResponse | null>(null);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .order("full_name", { ascending: true })
      .limit(300)
      .then(({ data }) => setStudents((data as StudentRow[]) || []));
  }, []);

  const run = async () => {
    if (!studentId) return;
    setLoading(true);
    setResult(null);
    const { data, error } = await supabase.functions.invoke("simulate-prescription", {
      body: { userId: studentId, log: true },
    });
    setLoading(false);
    if (error) {
      toast.error("Não foi possível rodar a simulação.");
      return;
    }
    setResult(data as ShadowResponse);
  };

  const useAsBase = async () => {
    if (!result?.runId || !studentId) return;
    const ok = window.confirm(
      "Confirmar o uso desta sugestão como base do próximo treino? Nenhum treino atual será alterado agora.",
    );
    if (!ok) return;
    const { data: authData } = await supabase.auth.getUser();
    const [runRes, ovRes] = await Promise.all([
      supabase
        .from("prescription_runs")
        .update({
          trainer_decision: "aceito",
          decided_by: authData.user?.id ?? null,
          decided_at: new Date().toISOString(),
        })
        .eq("id", result.runId),
      supabase
        .from("prescription_overrides")
        .upsert(
          { user_id: studentId, baseline_plan: result.plan, updated_by: authData.user?.id ?? null },
          { onConflict: "user_id" },
        ),
    ]);
    if (runRes.error || ovRes.error) {
      toast.error("Não foi possível salvar como base.");
      return;
    }
    toast.success("Sugestão salva como base. O treino atual segue intacto.");
  };

  const status = result?.gate.status;
  const meta = status ? STATUS_META[status] : null;
  const StatusIcon = meta?.icon;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Modo sombra</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Roda o motor completo para um aluno real e compara com o treino atual. Nada é gravado no treino do aluno.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger className="h-11 sm:max-w-md" aria-label="Selecionar aluno">
                <SelectValue placeholder="Selecione o aluno" />
              </SelectTrigger>
              <SelectContent>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.full_name || s.email || s.id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button className="min-h-11" onClick={run} disabled={!studentId || loading}>
              {loading ? "Calculando..." : "Rodar modo sombra"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && <Skeleton className="h-64 w-full" />}

      {result && (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
              <CardTitle className="text-base">Resultado</CardTitle>
              {meta && StatusIcon && (
                <Badge variant="outline" className={meta.className}>
                  <StatusIcon className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                  {meta.label}
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid gap-2 sm:grid-cols-3">
                <div><span className="text-muted-foreground">Confiança: </span>{result.plan.confidence}</div>
                <div><span className="text-muted-foreground">Frequência sugerida: </span>{result.plan.weeklyFrequency}x/semana</div>
                <div><span className="text-muted-foreground">Séries diretas/semana: </span>{result.plan.totalDirectSets}</div>
              </div>
              {result.currentProtocol && (
                <p className="text-xs text-muted-foreground">
                  Comparando com o treino de {new Date(result.currentProtocol.created_at).toLocaleDateString("pt-BR")}
                  {result.currentProtocol.volumeSource === "conteudo" && " (volume atual estimado pelo conteúdo do treino)"}
                </p>
              )}
              {result.gate.reasons.length > 0 && (
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  {result.gate.reasons.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              )}
              {Array.isArray(result.plan.overridesApplied) && result.plan.overridesApplied.length > 0 && (
                <div className="rounded-lg border border-brand-gold/30 bg-brand-gold/5 p-3">
                  <p className="text-xs uppercase tracking-wide text-brand-gold mb-1">Decisões humanas aplicadas</p>
                  <ul className="list-disc pl-5 space-y-1 text-muted-foreground text-xs">
                    {result.plan.overridesApplied.map((o: string, i: number) => <li key={i}>{o}</li>)}
                  </ul>
                </div>
              )}
              <Button
                variant="outline"
                className="min-h-11"
                onClick={useAsBase}
                disabled={status === "BLOQUEADO" || !result.runId}
              >
                Usar como base
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Atual x sugerido por grupo muscular</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm min-w-[720px]">
                <thead className="text-muted-foreground text-xs uppercase tracking-wide">
                  <tr className="text-left">
                    <th className="py-2 pr-3">Grupo</th>
                    <th className="py-2 pr-3">Atual</th>
                    <th className="py-2 pr-3">Sugerido</th>
                    <th className="py-2 pr-3">Diferença</th>
                    <th className="py-2 pr-3">Freq.</th>
                    <th className="py-2 pr-3">RIR</th>
                    <th className="py-2 pr-3">Reps</th>
                    <th className="py-2">Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {result.diff.map((row) => (
                    <tr key={row.muscle} className="border-t border-border/60 align-top">
                      <td className="py-2 pr-3">
                        {row.label}
                        {row.source === "override" && (
                          <span className="ml-2 text-[10px] uppercase text-brand-gold">override</span>
                        )}
                      </td>
                      <td className="py-2 pr-3">{row.currentSets ?? "—"}</td>
                      <td className="py-2 pr-3">{row.suggestedSets}</td>
                      <td className="py-2 pr-3">
                        {row.diff === null ? "—" : row.diff > 0 ? `+${row.diff}` : row.diff}
                      </td>
                      <td className="py-2 pr-3">
                        {row.currentFrequency ?? "—"} → {row.suggestedFrequency}x
                      </td>
                      <td className="py-2 pr-3">{row.targetRir}</td>
                      <td className="py-2 pr-3">{row.repRange}</td>
                      <td className="py-2 text-muted-foreground text-xs">{row.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
