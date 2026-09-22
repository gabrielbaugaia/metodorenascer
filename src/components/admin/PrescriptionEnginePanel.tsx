// ============================================================================
// ENGENHARIA DO MOVIMENTO — PRESCRIPTION ENGINE v1
// Painel de auditoria da dose: mostra ao treinador POR QUE a IA prescreveu
// assim, e compara a dose planejada com a efetivamente realizada pelo aluno.
// Visível apenas no admin — o aluno continua vendo só o treino.
// ============================================================================
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { aggregateVolume } from "@/lib/prescription/muscles";
import type { MuscleKey } from "@/lib/prescription/types";

interface EnginePlanMuscle {
  muscle: MuscleKey;
  label: string;
  directSets: number;
  frequency: number;
  maxSetsPerSession: number;
  repRange: string;
  targetRir: string;
  priority: string;
  status: string;
  previousSets: number | null;
  deltaVsPreviousCycle: number | null;
  rationale: string[];
}

export interface PrescriptionMeta {
  engine_version?: string;
  generated_at?: string;
  confidence?: "alta" | "media" | "baixa";
  confidence_reasons?: string[];
  deload?: { recommended: boolean; reason: string | null };
  readiness?: { score: number; confidence: string; signals: { label: string; value: string; impact: number }[]; missing: string[] };
  safety_alerts?: string[];
  decision_summary?: string[];
  engine_notes?: string[];
  plan?: {
    weeklyFrequency?: number;
    sessionMinutes?: number;
    weeklySetCapacity?: number;
    totalDirectSets?: number;
    muscles?: EnginePlanMuscle[];
  };
  compliance?: {
    compliant: boolean;
    perMuscle: {
      muscle: MuscleKey;
      label: string;
      planned: number;
      generatedDirect: number;
      generatedIndirect: number;
      deviation: number;
      withinTolerance: boolean;
    }[];
    unmatchedExercises?: string[];
    adjustments?: string[];
  };
}

const STATUS_LABEL: Record<string, string> = {
  SUBDOSE: "Subdose provável",
  DOSE_PRODUTIVA: "Dose produtiva",
  ALERTA_FADIGA: "Alerta de fadiga",
  MANUTENCAO: "Manutenção",
  PRIORIDADE: "Prioridade",
};

const CONFIDENCE_LABEL: Record<string, string> = {
  alta: "Confiança alta",
  media: "Confiança média",
  baixa: "Confiança baixa",
};

interface Props {
  meta: PrescriptionMeta | null | undefined;
  userId: string;
}

export function PrescriptionEnginePanel({ meta, userId }: Props) {
  const [realized, setRealized] = useState<Partial<Record<MuscleKey, number>> | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const since = new Date(Date.now() - 28 * 86400000).toISOString();
      const { data } = await supabase
        .from("workout_set_logs")
        .select("exercise_name")
        .eq("user_id", userId)
        .gte("created_at", since);
      if (cancelled) return;
      if (!data || data.length === 0) {
        setRealized({});
        return;
      }
      const counts = new Map<string, number>();
      for (const l of data) counts.set(l.exercise_name, (counts.get(l.exercise_name) || 0) + 1);
      const agg = aggregateVolume(Array.from(counts, ([name, sets]) => ({ name, sets })));
      const perWeek: Partial<Record<MuscleKey, number>> = {};
      for (const [k, v] of Object.entries(agg.direct)) perWeek[k as MuscleKey] = Math.round((v as number) / 4);
      setRealized(perWeek);
    }
    if (userId) load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const muscles = meta?.plan?.muscles || [];
  const complianceByMuscle = useMemo(() => {
    const map = new Map<string, NonNullable<PrescriptionMeta["compliance"]>["perMuscle"][number]>();
    for (const c of meta?.compliance?.perMuscle || []) map.set(c.muscle, c);
    return map;
  }, [meta]);

  if (!meta || muscles.length === 0) {
    return (
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Motor de prescrição</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Este protocolo foi criado antes do motor de prescrição ou de forma manual. A dose por grupo muscular
          aparece aqui nos próximos protocolos gerados por IA.
        </CardContent>
      </Card>
    );
  }

  const plan = meta.plan!;

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold">Por que a IA prescreveu assim?</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={meta.confidence === "alta" ? "default" : "secondary"}>
              {CONFIDENCE_LABEL[meta.confidence || "baixa"]}
            </Badge>
            {meta.readiness && <Badge variant="outline">Prontidão {meta.readiness.score}/100</Badge>}
            {meta.deload?.recommended && <Badge variant="destructive">Descarga sugerida</Badge>}
            {meta.compliance && !meta.compliance.compliant && <Badge variant="destructive">Desvio de dose</Badge>}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {meta.engine_version} · {plan.weeklyFrequency}x/semana · {plan.sessionMinutes} min por sessão ·{" "}
          {plan.totalDirectSets} séries efetivas/semana (capacidade ~{plan.weeklySetCapacity})
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {(meta.decision_summary?.length || 0) > 0 && (
          <ul className="space-y-1 text-sm text-muted-foreground">
            {meta.decision_summary!.map((s, i) => (
              <li key={i}>· {s}</li>
            ))}
          </ul>
        )}

        {(meta.safety_alerts?.length || 0) > 0 && (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
            {meta.safety_alerts!.map((a, i) => (
              <p key={i}>{a}</p>
            ))}
          </div>
        )}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Grupo</TableHead>
                <TableHead className="text-right">Planejado</TableHead>
                <TableHead className="text-right">No protocolo</TableHead>
                <TableHead className="text-right">Indireto</TableHead>
                <TableHead className="text-right">Realizado/sem</TableHead>
                <TableHead className="text-right">Freq.</TableHead>
                <TableHead>Reps</TableHead>
                <TableHead>RIR</TableHead>
                <TableHead className="text-right">Δ ciclo</TableHead>
                <TableHead>Leitura</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {muscles.map((m) => {
                const c = complianceByMuscle.get(m.muscle);
                const done = realized?.[m.muscle];
                return (
                  <TableRow key={m.muscle}>
                    <TableCell className="font-medium">{m.label}</TableCell>
                    <TableCell className="text-right">{m.directSets}</TableCell>
                    <TableCell className={`text-right ${c && !c.withinTolerance ? "text-destructive" : ""}`}>
                      {c ? c.generatedDirect : "—"}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{c ? c.generatedIndirect : "—"}</TableCell>
                    <TableCell className="text-right">
                      {realized === null ? "…" : typeof done === "number" ? done : "—"}
                    </TableCell>
                    <TableCell className="text-right">{m.frequency}x</TableCell>
                    <TableCell>{m.repRange}</TableCell>
                    <TableCell>{m.targetRir}</TableCell>
                    <TableCell className="text-right">
                      {m.deltaVsPreviousCycle === null
                        ? "—"
                        : `${m.deltaVsPreviousCycle > 0 ? "+" : ""}${m.deltaVsPreviousCycle}`}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{STATUS_LABEL[m.status] || m.status}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <p className="text-xs text-muted-foreground">
          Planejado = dose calculada pelo motor. No protocolo = séries efetivamente escritas pela IA.
          Realizado = média semanal das últimas 4 semanas registrada pelo aluno.
        </p>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="racional">
            <AccordionTrigger className="text-sm">Racional por grupo muscular</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                {muscles.map((m) => (
                  <div key={m.muscle} className="text-sm">
                    <p className="font-medium">
                      {m.label}: {m.directSets} séries/semana em {m.frequency} sessão(ões)
                    </p>
                    <ul className="ml-4 list-disc text-xs text-muted-foreground">
                      {m.rationale.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {meta.readiness && (
            <AccordionItem value="recuperacao">
              <AccordionTrigger className="text-sm">Recuperação e fontes de dados</AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {meta.readiness.signals.map((s, i) => (
                    <li key={i}>
                      {s.label}: {s.value} ({s.impact > 0 ? "+" : ""}
                      {s.impact})
                    </li>
                  ))}
                  {meta.readiness.missing.length > 0 && <li>Sem dados de: {meta.readiness.missing.join(", ")}.</li>}
                  {(meta.engine_notes || []).map((n, i) => (
                    <li key={`n${i}`}>{n}</li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          )}

          {(meta.confidence_reasons?.length || 0) > 0 && (
            <AccordionItem value="confianca">
              <AccordionTrigger className="text-sm">Por que a confiança não é alta</AccordionTrigger>
              <AccordionContent>
                <ul className="ml-4 list-disc text-xs text-muted-foreground">
                  {meta.confidence_reasons!.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          )}

          {((meta.compliance?.adjustments?.length || 0) > 0 ||
            (meta.compliance?.unmatchedExercises?.length || 0) > 0) && (
            <AccordionItem value="conformidade">
              <AccordionTrigger className="text-sm">Ajustes aplicados sobre a saída da IA</AccordionTrigger>
              <AccordionContent>
                <ul className="ml-4 list-disc text-xs text-muted-foreground">
                  {(meta.compliance?.adjustments || []).map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                  {(meta.compliance?.unmatchedExercises || []).length > 0 && (
                    <li>
                      Exercícios sem mapeamento muscular (não entram na contagem):{" "}
                      {meta.compliance!.unmatchedExercises!.join(", ")}
                    </li>
                  )}
                </ul>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </CardContent>
    </Card>
  );
}
