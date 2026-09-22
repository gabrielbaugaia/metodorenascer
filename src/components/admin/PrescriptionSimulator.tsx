// ============================================================================
// Motor de Prescrição — simulação (não gera nem salva protocolo)
// ============================================================================
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const TEST_PROFILES = [
  { key: "iniciante_3x_baixa_recuperacao", label: "Iniciante 3x/semana, recuperação baixa" },
  { key: "intermediario_4x_boa_recuperacao", label: "Intermediário 4x/semana, recuperação boa" },
  { key: "avancado_5x_dorsal_prioridade", label: "Avançado 5x/semana, costas prioridade" },
  { key: "alto_volume_performance_caindo", label: "Alto volume com performance caindo" },
  { key: "baixa_aderencia", label: "Baixa aderência" },
  { key: "pouco_tempo_por_sessao", label: "Pouco tempo por sessão" },
];

interface SimMuscle {
  muscle: string;
  label: string;
  directSets: number;
  frequency: number;
  repRange: string;
  targetRir: string;
  priority: string;
  status: string;
  previousSets: number | null;
  deltaVsPreviousCycle: number | null;
  rationale: string[];
}

interface SimResult {
  mode: string;
  student?: { id: string; name: string | null };
  profile?: { key: string; label: string };
  notes?: string[];
  plan: {
    confidence: string;
    confidenceReasons: string[];
    weeklyFrequency: number;
    deload: { recommended: boolean; reason: string | null };
    readiness: { score: number; confidence: string };
    safetyAlerts: string[];
    decisionSummary: string[];
    muscles: SimMuscle[];
    effort?: { avgRir: number | null; coveragePct: number; reading: string };
  };
}

export function PrescriptionSimulator() {
  const { toast } = useToast();
  const [students, setStudents] = useState<{ id: string; full_name: string | null }[]>([]);
  const [studentId, setStudentId] = useState<string>("");
  const [profileKey, setProfileKey] = useState<string>("");
  const [result, setResult] = useState<SimResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("id, full_name")
      .order("full_name", { ascending: true })
      .limit(200)
      .then(({ data }) => setStudents(data ?? []));
  }, []);

  const run = async (payload: { userId?: string; profileKey?: string }) => {
    setLoading(true);
    setResult(null);
    const { data, error } = await supabase.functions.invoke("simulate-prescription", { body: payload });
    setLoading(false);
    if (error || (data as { error?: string })?.error) {
      toast({
        title: "Simulação não concluída",
        description: (data as { error?: string })?.error || error?.message || "Tente novamente.",
        variant: "destructive",
      });
      return;
    }
    setResult(data as SimResult);
  };

  const plan = result?.plan;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Simular dose</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Aluno real</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger><SelectValue placeholder="Selecione um aluno" /></SelectTrigger>
              <SelectContent>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.full_name || s.id.slice(0, 8)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button disabled={!studentId || loading} onClick={() => run({ userId: studentId })}>
              Simular com dados reais
            </Button>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Perfil de teste</Label>
            <Select value={profileKey} onValueChange={setProfileKey}>
              <SelectTrigger><SelectValue placeholder="Selecione um perfil" /></SelectTrigger>
              <SelectContent>
                {TEST_PROFILES.map((p) => (
                  <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" disabled={!profileKey || loading} onClick={() => run({ profileKey })}>
              Simular perfil de teste
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && <p className="text-sm text-muted-foreground">Calculando a dose...</p>}

      {plan && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {result?.student?.name || result?.profile?.label || "Resultado"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant={plan.confidence === "alta" ? "default" : "secondary"}>
                Confiança: {plan.confidence}
              </Badge>
              <Badge variant="secondary">Frequência: {plan.weeklyFrequency}x/semana</Badge>
              <Badge variant="secondary">Recuperação: {plan.readiness.score}</Badge>
              {plan.deload.recommended && <Badge variant="destructive">Descarga sugerida</Badge>}
              {plan.effort && <Badge variant="secondary">Esforço: {plan.effort.reading}</Badge>}
            </div>

            {plan.safetyAlerts.length > 0 && (
              <ul className="list-disc pl-5 text-sm text-destructive">
                {plan.safetyAlerts.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grupo</TableHead>
                  <TableHead>Séries/sem.</TableHead>
                  <TableHead>Freq.</TableHead>
                  <TableHead>Reps</TableHead>
                  <TableHead>RIR</TableHead>
                  <TableHead>vs ciclo anterior</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plan.muscles.map((m) => (
                  <TableRow key={m.muscle}>
                    <TableCell>{m.label}</TableCell>
                    <TableCell>{m.directSets}</TableCell>
                    <TableCell>{m.frequency}x</TableCell>
                    <TableCell>{m.repRange}</TableCell>
                    <TableCell>{m.targetRir}</TableCell>
                    <TableCell>
                      {m.deltaVsPreviousCycle === null
                        ? "—"
                        : m.deltaVsPreviousCycle > 0
                          ? `+${m.deltaVsPreviousCycle}`
                          : String(m.deltaVsPreviousCycle)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{m.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="space-y-1 text-sm text-muted-foreground">
              {plan.decisionSummary.map((d, i) => <p key={i}>{d}</p>)}
              {plan.confidenceReasons.map((d, i) => <p key={`c${i}`}>{d}</p>)}
              {(result?.notes ?? []).map((d, i) => <p key={`n${i}`}>{d}</p>)}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
