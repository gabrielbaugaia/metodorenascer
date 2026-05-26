import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

import { Vo2MaxProtocolSelector } from "@/components/vo2max/Vo2MaxProtocolSelector";
import { Vo2MaxCooperForm, type CooperData } from "@/components/vo2max/Vo2MaxCooperForm";
import { Vo2MaxBruceForm, type BruceData } from "@/components/vo2max/Vo2MaxBruceForm";
import { Vo2MaxAstrandForm, type AstrandData } from "@/components/vo2max/Vo2MaxAstrandForm";
import { Vo2MaxResultCard } from "@/components/vo2max/Vo2MaxResultCard";
import { Vo2MaxHistoryList, type Vo2Test } from "@/components/vo2max/Vo2MaxHistoryList";
import { Vo2MaxDisclaimer } from "@/components/vo2max/Vo2MaxDisclaimer";
import {
  calcAstrand,
  calcBruce,
  calcCooper,
  classify,
  type Sex,
  type Vo2Protocol,
} from "@/lib/vo2maxCalc";

type Phase = "select" | "form" | "result" | "history";

interface Computed {
  protocolo: Vo2Protocol;
  vo2: number;
  dados: Record<string, any>;
  test_date: string;
  local?: string;
  notas?: string;
  screenshotFile?: File | null;
  sex: Sex;
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
    mutationFn: async () => {
      if (!computed || !classification) throw new Error("no data");
      let screenshot_url: string | null = null;
      if (computed.screenshotFile) {
        const ext = computed.screenshotFile.name.split(".").pop();
        const path = `${user!.id}/vo2max/${Date.now()}.${ext}`;
        const { error } = await supabase.storage
          .from("fitness-screenshots")
          .upload(path, computed.screenshotFile);
        if (!error) screenshot_url = path;
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
        notas: computed.notas || null,
      });
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
    });
    setPhase("result");
  };

  const backToSelect = () => {
    setProtocolo(null);
    setComputed(null);
    setPhase("select");
  };

  return (
    <ClientLayout>
      <div className="space-y-4 max-w-2xl mx-auto pb-24">
        <PageHeader title="Teste de VO2 Máx" subtitle="Avaliação cardiorrespiratória" />

        <Button variant="ghost" size="sm" onClick={() => navigate("/cardio")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar para Aeróbico
        </Button>

        <Tabs value={phase === "history" ? "history" : "novo"} onValueChange={(v) => setPhase(v === "history" ? "history" : "select")}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="novo">Novo teste</TabsTrigger>
            <TabsTrigger value="history">Histórico ({tests.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="novo" className="space-y-4 mt-4">
            {phase === "select" && (
              <Vo2MaxProtocolSelector
                onSelect={(p) => {
                  setProtocolo(p);
                  setPhase("form");
                }}
              />
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
                  onSave={() => saveMutation.mutate()}
                  onShowHistory={() => setPhase("history")}
                  isSaving={saveMutation.isPending}
                />
                <Button variant="ghost" className="w-full" onClick={backToSelect}>
                  Refazer teste
                </Button>
              </>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            {loadingTests ? (
              <div className="flex justify-center py-8"><LoadingSpinner /></div>
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
