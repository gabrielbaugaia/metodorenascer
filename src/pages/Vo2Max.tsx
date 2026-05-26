import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Activity, Pencil, Zap } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

import { Vo2MaxProtocolSelector } from "@/components/vo2max/Vo2MaxProtocolSelector";
import { Vo2MaxCooperForm, type CooperData } from "@/components/vo2max/Vo2MaxCooperForm";
import { Vo2MaxBruceForm, type BruceData } from "@/components/vo2max/Vo2MaxBruceForm";
import { Vo2MaxAstrandForm, type AstrandData } from "@/components/vo2max/Vo2MaxAstrandForm";
import { Vo2MaxResultCard } from "@/components/vo2max/Vo2MaxResultCard";
import { Vo2MaxHistoryList, type Vo2Test } from "@/components/vo2max/Vo2MaxHistoryList";
import { Vo2MaxDisclaimer } from "@/components/vo2max/Vo2MaxDisclaimer";
import { Vo2MaxLiveBruce, type BruceLiveResult } from "@/components/vo2max/Vo2MaxLiveBruce";
import { Vo2MaxLiveCooper } from "@/components/vo2max/Vo2MaxLiveCooper";
import {
  Vo2MaxAttachmentsStep,
  type AttachmentsData,
} from "@/components/vo2max/Vo2MaxAttachmentsStep";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  calcAstrand,
  calcBruce,
  calcCooper,
  classify,
  type Sex,
  type Vo2Protocol,
} from "@/lib/vo2maxCalc";

type Phase =
  | "select"
  | "mode" // só para cooper/bruce
  | "live" // execução ao vivo
  | "live-cooper-distance" // pós-cronômetro Cooper: digitar distância
  | "form" // manual
  | "result"
  | "attachments"
  | "history";

interface Computed {
  protocolo: Vo2Protocol;
  vo2: number;
  dados: Record<string, any>;
  test_date: string;
  local?: string;
  notas?: string;
  screenshotFile?: File | null;
  sex: Sex;
  modo_execucao: "ao_vivo" | "manual";
  estagio_max?: number;
  pausas?: number;
}

function ageFromProfile(p: { age?: number | null; data_nascimento?: string | null } | null): number {
  if (!p) return 30;
  if (p.age && p.age > 0) return p.age;
  if (p.data_nascimento) {
    const diff = Date.now() - new Date(p.data_nascimento).getTime();
    return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
  }
  return 30;
}

function sexFromProfile(p: { sexo?: string | null } | null): Sex {
  const s = (p?.sexo || "").toLowerCase();
  if (s.startsWith("f")) return "F";
  return "M";
}

export default function Vo2Max() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [phase, setPhase] = useState<Phase>("select");
  const [protocolo, setProtocolo] = useState<Vo2Protocol | null>(null);
  const [computed, setComputed] = useState<Computed | null>(null);
  const [cooperLive, setCooperLive] = useState<{ pausas: number } | null>(null);
  const [cooperDist, setCooperDist] = useState("");

  const { data: profile } = useQuery({
    queryKey: ["vo2-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("age, data_nascimento, sexo")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: tests = [], isLoading: loadingTests } = useQuery({
    queryKey: ["vo2max-tests", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vo2max_tests")
        .select("id, protocolo, valor_ml_kg_min, classificacao, test_date, local")
        .eq("user_id", user!.id)
        .order("test_date", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as Vo2Test[];
    },
    enabled: !!user,
  });

  const age = useMemo(() => ageFromProfile(profile as any), [profile]);
  const profileSex = useMemo(() => sexFromProfile(profile as any), [profile]);

  const classification = useMemo(() => {
    if (!computed) return null;
    return classify(computed.vo2, age, computed.sex);
  }, [computed, age]);

  const saveMutation = useMutation({
    mutationFn: async (extra?: AttachmentsData) => {
      if (!computed || !classification) throw new Error("no data");
      let screenshot_url: string | null = null;
      let screenshot_app_url: string | null = null;

      const ssFile = extra?.screenshotFile || computed.screenshotFile;
      if (ssFile) {
        const ext = ssFile.name.split(".").pop();
        const path = `${user!.id}/vo2max/${Date.now()}-esteira.${ext}`;
        const { error } = await supabase.storage
          .from("fitness-screenshots")
          .upload(path, ssFile);
        if (!error) screenshot_url = path;
      }
      if (extra?.appFile) {
        const ext = extra.appFile.name.split(".").pop();
        const path = `${user!.id}/vo2max/${Date.now()}-app.${ext}`;
        const { error } = await supabase.storage
          .from("fitness-screenshots")
          .upload(path, extra.appFile);
        if (!error) screenshot_app_url = path;
      }

      const { error } = await supabase.from("vo2max_tests").insert({
        user_id: user!.id,
        protocolo: computed.protocolo,
        valor_ml_kg_min: Number(computed.vo2.toFixed(2)),
        classificacao: classification.label,
        test_date: computed.test_date,
        local: computed.local || null,
        dados_brutos: computed.dados,
        screenshot_url,
        screenshot_app_url,
        notas: computed.notas || null,
        notas_execucao: extra?.notas_execucao || null,
        modo_execucao: computed.modo_execucao,
        estagio_max: computed.estagio_max ?? null,
        pausas: computed.pausas ?? 0,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vo2max-tests"] });
      qc.invalidateQueries({ queryKey: ["vo2max-latest"] });
      toast.success("Teste salvo no perfil!");
      setPhase("history");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao salvar teste"),
  });

  // ---------- Handlers manual (legado) ----------
  const handleCooper = (d: CooperData) => {
    const vo2 = calcCooper(d.distancia_m);
    setComputed({
      protocolo: "cooper",
      vo2,
      sex: profileSex,
      dados: d,
      test_date: d.test_date,
      local: d.local,
      notas: d.notas,
      screenshotFile: d.screenshotFile,
      modo_execucao: "manual",
    });
    setPhase("result");
  };

  const handleBruce = (d: BruceData) => {
    const vo2 = calcBruce(d.total_minutes, d.sex);
    setComputed({
      protocolo: "bruce",
      vo2,
      sex: d.sex,
      dados: d,
      test_date: d.test_date,
      local: d.local,
      notas: d.notas,
      screenshotFile: d.screenshotFile,
      modo_execucao: "manual",
    });
    setPhase("result");
  };

  const handleAstrand = (d: AstrandData) => {
    const vo2 = calcAstrand(d.watts, d.peso_kg);
    setComputed({
      protocolo: "astrand",
      vo2,
      sex: d.sex,
      dados: d,
      test_date: d.test_date,
      local: d.local,
      notas: d.notas,
      screenshotFile: d.screenshotFile,
      modo_execucao: "manual",
    });
    setPhase("result");
  };

  // ---------- Handlers ao vivo ----------
  const handleBruceLive = (r: BruceLiveResult) => {
    const today = new Date().toISOString().split("T")[0];
    const vo2 = calcBruce(r.total_minutes, profileSex);
    setComputed({
      protocolo: "bruce",
      vo2,
      sex: profileSex,
      dados: {
        total_minutes: r.total_minutes,
        estagio_max: r.estagio_max,
        pausas: r.pausas,
        modo: "ao_vivo",
      },
      test_date: today,
      modo_execucao: "ao_vivo",
      estagio_max: r.estagio_max,
      pausas: r.pausas,
    });
    setPhase("result");
  };

  const handleCooperLive = (r: { pausas: number }) => {
    setCooperLive(r);
    setPhase("live-cooper-distance");
  };

  const handleCooperDistance = () => {
    const d = Number(cooperDist);
    if (!d || d <= 0) {
      toast.error("Informe a distância percorrida");
      return;
    }
    const today = new Date().toISOString().split("T")[0];
    const vo2 = calcCooper(d);
    setComputed({
      protocolo: "cooper",
      vo2,
      sex: profileSex,
      dados: { distancia_m: d, pausas: cooperLive?.pausas ?? 0, modo: "ao_vivo" },
      test_date: today,
      modo_execucao: "ao_vivo",
      pausas: cooperLive?.pausas ?? 0,
    });
    setCooperDist("");
    setCooperLive(null);
    setPhase("result");
  };

  const backToSelect = () => {
    setProtocolo(null);
    setComputed(null);
    setCooperLive(null);
    setCooperDist("");
    setPhase("select");
  };

  // ---------- Render ----------
  return (
    <ClientLayout>
      <div className="space-y-4 max-w-2xl mx-auto pb-24">
        <PageHeader title="Teste de VO2 Máx" subtitle="Avaliação cardiorrespiratória" />

        <Button variant="ghost" size="sm" onClick={() => navigate("/cardio")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar para Aeróbico
        </Button>

        <Tabs
          value={phase === "history" ? "history" : "novo"}
          onValueChange={(v) => setPhase(v === "history" ? "history" : "select")}
        >
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="novo">Novo teste</TabsTrigger>
            <TabsTrigger value="history">Histórico ({tests.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="novo" className="space-y-4 mt-4">
            {phase === "select" && (
              <Vo2MaxProtocolSelector
                onSelect={(p) => {
                  setProtocolo(p);
                  // Astrand não tem modo ao vivo (depende de carga em bike)
                  if (p === "astrand") setPhase("form");
                  else setPhase("mode");
                }}
              />
            )}

            {phase === "mode" && (protocolo === "bruce" || protocolo === "cooper") && (
              <Card className="p-5 space-y-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Como você quer fazer este teste?
                  </p>
                  <h3 className="font-semibold">Escolha o modo</h3>
                </div>

                <button
                  onClick={() => setPhase("live")}
                  className="w-full text-left rounded-xl border-2 border-primary bg-primary/5 hover:bg-primary/10 transition p-4 flex items-start gap-3"
                >
                  <div className="rounded-lg bg-primary/15 p-2">
                    <Activity className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">Fazer agora (ao vivo)</p>
                      <span className="text-[9px] uppercase tracking-wider bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                        Recomendado
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      App cronometra, avisa os estágios e salva tudo automático.
                      <span className="inline-flex items-center gap-1 ml-1 text-primary">
                        <Zap className="h-3 w-3" /> ganha XP
                      </span>
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setPhase("form")}
                  className="w-full text-left rounded-xl border border-border hover:bg-muted/40 transition p-4 flex items-start gap-3"
                >
                  <div className="rounded-lg bg-muted p-2">
                    <Pencil className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Registrar manualmente</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Você já fez o teste — só digita os dados.
                    </p>
                  </div>
                </button>

                <Button variant="ghost" className="w-full" onClick={backToSelect}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
                </Button>
              </Card>
            )}

            {phase === "live" && protocolo === "bruce" && (
              <Vo2MaxLiveBruce onFinish={handleBruceLive} onBack={backToSelect} />
            )}
            {phase === "live" && protocolo === "cooper" && (
              <Vo2MaxLiveCooper onFinish={handleCooperLive} onBack={backToSelect} />
            )}

            {phase === "live-cooper-distance" && (
              <Card className="p-5 space-y-4">
                <div className="text-center space-y-1">
                  <h3 className="font-semibold">Tempo finalizado!</h3>
                  <p className="text-sm text-muted-foreground">
                    Quanto você percorreu nos 12 minutos?
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Distância (metros) *</Label>
                  <Input
                    type="number"
                    placeholder="2400"
                    value={cooperDist}
                    onChange={(e) => setCooperDist(e.target.value)}
                    autoFocus
                  />
                </div>
                <Button className="w-full" onClick={handleCooperDistance}>
                  Calcular VO2 Máx
                </Button>
              </Card>
            )}

            {phase === "form" && protocolo === "cooper" && (
              <Vo2MaxCooperForm onSubmit={handleCooper} onBack={backToSelect} />
            )}
            {phase === "form" && protocolo === "bruce" && (
              <Vo2MaxBruceForm onSubmit={handleBruce} onBack={backToSelect} />
            )}
            {phase === "form" && protocolo === "astrand" && (
              <Vo2MaxAstrandForm onSubmit={handleAstrand} onBack={backToSelect} />
            )}

            {phase === "result" && computed && classification && (
              <>
                <Vo2MaxResultCard
                  protocolo={computed.protocolo}
                  vo2={computed.vo2}
                  classification={classification}
                  testDate={computed.test_date}
                  local={computed.local}
                  onSave={() => {
                    if (computed.modo_execucao === "ao_vivo") {
                      setPhase("attachments");
                    } else {
                      saveMutation.mutate(undefined);
                    }
                  }}
                  onShowHistory={() => setPhase("history")}
                  isSaving={saveMutation.isPending}
                />
                <Button variant="ghost" className="w-full" onClick={backToSelect}>
                  Refazer teste
                </Button>
              </>
            )}

            {phase === "attachments" && computed && (
              <Vo2MaxAttachmentsStep
                onSave={(extra) => saveMutation.mutate(extra)}
                onSkip={() => saveMutation.mutate(undefined)}
                isSaving={saveMutation.isPending}
              />
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            {loadingTests ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : (
              <Vo2MaxHistoryList tests={tests} />
            )}
          </TabsContent>
        </Tabs>

        <Vo2MaxDisclaimer />
      </div>
    </ClientLayout>
  );
}
