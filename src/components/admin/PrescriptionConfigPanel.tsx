// ============================================================================
// Motor de Prescrição — parâmetros editáveis (admin)
// ============================================================================
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { MUSCLE_LABELS } from "@/lib/prescription/labels";
import type { MuscleKey } from "@/lib/prescription/types";
import {
  DEFAULT_ENGINE_CONFIG,
  mergeEngineConfig,
  type EditableEngineConfig,
} from "@/lib/prescription/engineDefaults";

interface HistoryRow {
  id: string;
  action: string;
  summary: string | null;
  created_at: string;
}

const MUSCLES = Object.keys(MUSCLE_LABELS) as MuscleKey[];

export function PrescriptionConfigPanel() {
  const { toast } = useToast();
  const [config, setConfig] = useState<EditableEngineConfig>(DEFAULT_ENGINE_CONFIG);
  const [configId, setConfigId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("prescription_engine_config")
      .select("id, config")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setConfigId(data?.id ?? null);
    setConfig(mergeEngineConfig(data?.config ?? null));

    const { data: hist } = await supabase
      .from("prescription_engine_config_history")
      .select("id, action, summary, created_at")
      .order("created_at", { ascending: false })
      .limit(15);
    setHistory((hist as HistoryRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const persist = async (next: EditableEngineConfig, action: "update" | "reset", summary: string) => {
    setSaving(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id ?? null;
      const previous = config;

      let id = configId;
      if (id) {
        const { error } = await supabase
          .from("prescription_engine_config")
          .update({ config: next as never, updated_at: new Date().toISOString() })
          .eq("id", id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("prescription_engine_config")
          .insert({ version: "v1", label: "Padrão", active: true, config: next as never, created_by: uid })
          .select("id")
          .single();
        if (error) throw error;
        id = data.id;
        setConfigId(id);
      }

      await supabase.from("prescription_engine_config_history").insert({
        config_id: id,
        changed_by: uid,
        action,
        summary,
        previous_config: previous as never,
        new_config: next as never,
      });

      setConfig(next);
      toast({ title: "Parâmetros salvos", description: summary });
      load();
    } catch (err) {
      toast({
        title: "Não foi possível salvar",
        description: err instanceof Error ? err.message : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const setRange = (muscle: MuscleKey, field: keyof EditableEngineConfig["ranges"][MuscleKey], value: string) => {
    const n = Number(value);
    setConfig((prev) => ({
      ...prev,
      ranges: { ...prev.ranges, [muscle]: { ...prev.ranges[muscle], [field]: Number.isFinite(n) ? n : 0 } },
    }));
  };

  const setParam = (path: string, value: string) => {
    const n = Number(value);
    setConfig((prev) => {
      const next = structuredClone(prev);
      const keys = path.split(".");
      let node: Record<string, unknown> = next.defaults as unknown as Record<string, unknown>;
      for (let i = 0; i < keys.length - 1; i++) node = node[keys[i]] as Record<string, unknown>;
      node[keys[keys.length - 1]] = Number.isFinite(n) ? n : 0;
      return next;
    });
  };

  const getParam = (path: string): number => {
    const keys = path.split(".");
    let node: unknown = config.defaults;
    for (const k of keys) node = (node as Record<string, unknown>)[k];
    return Number(node);
  };

  const numberField = (label: string, path: string, step = "1") => (
    <div className="space-y-1" key={path}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type="number"
        step={step}
        value={getParam(path)}
        onChange={(e) => setParam(path, e.target.value)}
        className="h-9"
      />
    </div>
  );

  if (loading) return <p className="text-sm text-muted-foreground">Carregando parâmetros...</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => persist(config, "update", "Parâmetros atualizados manualmente")} disabled={saving}>
          Salvar parâmetros
        </Button>
        <Button
          variant="outline"
          disabled={saving}
          onClick={() =>
            persist(structuredClone(DEFAULT_ENGINE_CONFIG), "reset", "Parâmetros restaurados para o padrão")
          }
        >
          Restaurar padrões
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Séries semanais por grupo muscular</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {MUSCLES.map((m) => (
            <div key={m} className="grid grid-cols-2 gap-3 sm:grid-cols-5 items-end">
              <span className="text-sm sm:col-span-1">{MUSCLE_LABELS[m]}</span>
              {(["min", "defaultLow", "defaultHigh", "max"] as const).map((f) => (
                <div key={f} className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">
                    {f === "min" ? "Mín." : f === "defaultLow" ? "Padrão baixo" : f === "defaultHigh" ? "Padrão alto" : "Máx."}
                  </Label>
                  <Input
                    type="number"
                    className="h-9"
                    value={config.ranges[m][f]}
                    onChange={(e) => setRange(m, f, e.target.value)}
                  />
                </div>
              ))}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Limites por sessão e volume equivalente</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          {numberField("Peso da série indireta", "indirectSetWeight", "0.1")}
          {numberField("Máx. séries por músculo/sessão", "maxSetsPerMusclePerSession")}
          {numberField("Preferido por músculo/sessão", "preferredSetsPerMusclePerSession")}
          {numberField("Minutos por série", "minutesPerSet", "0.1")}
          {numberField("Minutos fixos por sessão", "sessionOverheadMinutes")}
          {numberField("Máx. séries por sessão", "maxSetsPerSession")}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recuperação, aderência e ajuste por ciclo</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          {numberField("Recuperação boa a partir de", "readinessThresholds.good")}
          {numberField("Recuperação baixa abaixo de", "readinessThresholds.low")}
          {numberField("Ajuste com recuperação boa", "readinessAdjust.good")}
          {numberField("Ajuste com recuperação baixa", "readinessAdjust.low")}
          {numberField("Bloqueia progressão com aderência abaixo de (%)", "adherenceBlockProgressionBelow")}
          {numberField("Reduz volume com aderência abaixo de (%)", "adherenceReduceBelow")}
          {numberField("Ajuste máximo de séries por ciclo", "maxWeeklyDelta")}
          {numberField("Semanas mínimas entre descargas", "deload.minWeeksBetween")}
          {numberField("Recuperação que dispara descarga", "deload.readinessFloor")}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Esforço registrado (RIR)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-4">
          {numberField("Mínimo de séries com RIR", "effort.minSamples")}
          {numberField("RIR médio de esforço muito alto", "effort.highEffortRirMax", "0.1")}
          {numberField("RIR médio de esforço baixo", "effort.lowEffortRirMin", "0.1")}
          {numberField("Ajuste com esforço muito alto", "effort.highEffortSetsAdjust")}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de alterações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma alteração registrada ainda.</p>
          ) : (
            history.map((h) => (
              <div key={h.id}>
                <div className="flex flex-wrap justify-between gap-2 text-sm">
                  <span>{h.summary || (h.action === "reset" ? "Restaurado para o padrão" : "Atualização")}</span>
                  <span className="text-muted-foreground">
                    {new Date(h.created_at).toLocaleString("pt-BR")}
                  </span>
                </div>
                <Separator className="mt-2" />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
