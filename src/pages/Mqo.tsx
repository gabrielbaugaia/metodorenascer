import { useState, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { MqoLayout } from "@/components/mqo/MqoLayout";
import { MqoClientSelector } from "@/components/mqo/MqoClientSelector";
import { MqoMaterialUpload } from "@/components/mqo/MqoMaterialUpload";
import { MqoAnalysisPanel } from "@/components/mqo/MqoAnalysisPanel";
import { MqoProtocolGenerator, GenerationOptions } from "@/components/mqo/MqoProtocolGenerator";
import { MqoProtocolEditor } from "@/components/mqo/MqoProtocolEditor";
import { MqoVersionHistory } from "@/components/mqo/MqoVersionHistory";
import { MqoPublishPanel } from "@/components/mqo/MqoPublishPanel";

interface MqoClient {
  id: string;
  name: string;
  profile_id: string | null;
  summary: string | null;
  objectives: string | null;
  strengths: string | null;
  attention_points: string | null;
  suggested_strategy: string | null;
  trainer_direction: string | null;
}

export default function Mqo() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const [client, setClient] = useState<MqoClient | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [analysis, setAnalysis] = useState({
    summary: "",
    objectives: "",
    strengths: "",
    attention_points: "",
    suggested_strategy: "",
    trainer_direction: "",
  });

  const handleSelectClient = (c: MqoClient) => {
    setClient(c);
    setAnalysis({
      summary: c.summary || "",
      objectives: c.objectives || "",
      strengths: c.strengths || "",
      attention_points: c.attention_points || "",
      suggested_strategy: c.suggested_strategy || "",
      trainer_direction: c.trainer_direction || "",
    });
  };

  const handleAnalysisChange = async (field: string, value: string) => {
    setAnalysis((prev) => ({ ...prev, [field]: value }));
    if (client) {
      await supabase.from("mqo_clients").update({ [field]: value }).eq("id", client.id);
    }
  };

  const handleAnalyze = async (materialIds: string[]) => {
    if (!client) return;
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("mqo-analyze", {
        body: { clientId: client.id, materialIds },
      });
      if (error) throw error;
      if (data?.analysis) {
        const a = data.analysis;
        setAnalysis({
          summary: a.summary || "",
          objectives: a.objectives || "",
          strengths: a.strengths || "",
          attention_points: a.attention_points || "",
          suggested_strategy: a.suggested_strategy || "",
          trainer_direction: analysis.trainer_direction,
        });
        toast.success("Análise concluída");
      }
    } catch (e: any) {
      toast.error(e.message || "Erro na análise");
    }
    setAnalyzing(false);
  };

  const handleGenerate = async (type: string, options: GenerationOptions) => {
    if (!client) return;
    setGenerating(type);
    try {
      // Save trainer direction before generating
      await supabase.from("mqo_clients").update({
        trainer_direction: analysis.trainer_direction,
        summary: analysis.summary,
        objectives: analysis.objectives,
        strengths: analysis.strengths,
        attention_points: analysis.attention_points,
        suggested_strategy: analysis.suggested_strategy,
      }).eq("id", client.id);

      const { data, error } = await supabase.functions.invoke("mqo-generate-protocol", {
        body: { clientId: client.id, type, options },
      });
      if (error) throw error;
      toast.success(`Protocolo de ${type} gerado!`);
      setRefreshTrigger((p) => p + 1);
    } catch (e: any) {
      toast.error(e.message || "Erro ao gerar protocolo");
    }
    setGenerating(null);
  };

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user || !isAdmin) return <Navigate to="/entrar" replace />;

  return (
    <MqoLayout>
      <div className="space-y-6">
        {/* Client Selector */}
        <MqoClientSelector selectedClient={client} onSelect={handleSelectClient} />

        {client && (
          <>
            {/* Upload */}
            <MqoMaterialUpload
              clientId={client.id}
              onAnalyze={handleAnalyze}
              analyzing={analyzing}
            />

            {/* Analysis */}
            <MqoAnalysisPanel analysis={analysis} onChange={handleAnalysisChange} />

            {/* Generator */}
            <MqoProtocolGenerator onGenerate={handleGenerate} generating={generating} />

            {/* Editor */}
            <MqoProtocolEditor clientId={client.id} refreshTrigger={refreshTrigger} />

            {/* Version History */}
            <MqoVersionHistory
              clientId={client.id}
              refreshTrigger={refreshTrigger}
              onRestore={() => setRefreshTrigger((p) => p + 1)}
            />

            {/* Publish */}
            <MqoPublishPanel
              clientId={client.id}
              clientName={client.name}
              profileId={client.profile_id}
              refreshTrigger={refreshTrigger}
              onPublished={() => setRefreshTrigger((p) => p + 1)}
            />
          </>
        )}
      </div>
    </MqoLayout>
  );
}
