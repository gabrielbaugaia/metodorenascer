import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Link2, Sparkles, Activity, Scale, Ruler, Heart, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BodyAssessmentImportProps {
  clientId: string;
  onAssessmentImported?: () => void;
}

interface Assessment {
  id: string;
  assessed_at: string;
  source_name: string;
  weight: number | null;
  height: number | null;
  bmi: number | null;
  body_fat_pct: number | null;
  muscle_pct: number | null;
  subcutaneous_fat_pct: number | null;
  visceral_fat: number | null;
  protein_pct: number | null;
  hydration_pct: number | null;
  bone_mass_kg: number | null;
  bmr_kcal: number | null;
  waist_hip_ratio: number | null;
  body_age: number | null;
  fat_mass_kg: number | null;
  muscle_mass_kg: number | null;
  waist_cm: number | null;
  hip_cm: number | null;
  arm_circumference_cm: number | null;
  thigh_circumference_cm: number | null;
  shoulder_width_cm: number | null;
  body_type: string | null;
  postural_analysis: any;
  segment_analysis: any;
}

export function BodyAssessmentImport({ clientId, onAssessmentImported }: BodyAssessmentImportProps) {
  const [url, setUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    fetchAssessments();
  }, [clientId]);

  const fetchAssessments = async () => {
    try {
      const { data, error } = await supabase
        .from("body_assessments")
        .select("*")
        .eq("user_id", clientId)
        .order("assessed_at", { ascending: false })
        .limit(5);

      if (!error && data) {
        setAssessments(data as unknown as Assessment[]);
      }
    } catch (e) {
      console.error("Error fetching assessments:", e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleImport = async () => {
    if (!url.trim()) {
      toast.error("Cole o link da avaliação");
      return;
    }

    setImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("extract-body-assessment", {
        body: { url: url.trim(), client_id: clientId },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("Avaliação corporal importada com sucesso!");
        setUrl("");
        fetchAssessments();
        onAssessmentImported?.();
      } else {
        toast.error(data?.error || "Erro ao importar avaliação");
      }
    } catch (error: any) {
      console.error("Import error:", error);
      toast.error(error.message || "Erro ao importar avaliação");
    } finally {
      setImporting(false);
    }
  };

  const MetricItem = ({ label, value, unit, icon: Icon }: { label: string; value: number | null; unit?: string; icon?: any }) => {
    if (value == null) return null;
    return (
      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
        {Icon && <Icon className="h-4 w-4 text-primary shrink-0" />}
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          <p className="text-sm font-semibold">
            {typeof value === "number" ? value.toFixed(1) : value}
            {unit && <span className="text-xs text-muted-foreground ml-0.5">{unit}</span>}
          </p>
        </div>
      </div>
    );
  };

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Avaliação Corporal Externa
        </CardTitle>
        <CardDescription>
          Cole o link da avaliação (Anovator, InBody, etc.) para importar automaticamente os dados
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Import Form */}
        <div className="space-y-2">
          <Label>Link da Avaliação</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.anovator.com/body/mobile8.0.html?id=..."
                className="pl-9"
                disabled={importing}
              />
            </div>
            <Button onClick={handleImport} disabled={importing || !url.trim()} variant="fire">
              {importing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              {importing ? "Lendo..." : "Importar"}
            </Button>
          </div>
          {importing && (
            <p className="text-xs text-muted-foreground animate-pulse">
              Acessando link → Extraindo dados com IA → Salvando no perfil...
            </p>
          )}
        </div>

        {/* Assessment History */}
        {loadingHistory ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : assessments.length > 0 ? (
          <div className="space-y-3">
            <Label>Histórico de Avaliações</Label>
            {assessments.map((a) => (
              <div key={a.id} className="border border-border rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {a.source_name || "anovator"}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(a.assessed_at), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                  {a.body_type && (
                    <Badge variant="secondary" className="text-xs">
                      {a.body_type}
                    </Badge>
                  )}
                </div>

                {/* Key metrics grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  <MetricItem label="Peso" value={a.weight} unit="kg" icon={Scale} />
                  <MetricItem label="Altura" value={a.height} unit="cm" icon={Ruler} />
                  <MetricItem label="IMC" value={a.bmi} icon={TrendingUp} />
                  <MetricItem label="Gordura" value={a.body_fat_pct} unit="%" icon={Activity} />
                  <MetricItem label="Músculo" value={a.muscle_pct} unit="%" icon={Activity} />
                  <MetricItem label="Gordura Visceral" value={a.visceral_fat} icon={Heart} />
                  <MetricItem label="TMB" value={a.bmr_kcal} unit="kcal" />
                  <MetricItem label="Idade Corporal" value={a.body_age} />
                  <MetricItem label="Hidratação" value={a.hydration_pct} unit="%" />
                  <MetricItem label="Proteína" value={a.protein_pct} unit="%" />
                  <MetricItem label="Massa Óssea" value={a.bone_mass_kg} unit="kg" />
                  <MetricItem label="Cintura/Quadril" value={a.waist_hip_ratio} />
                  <MetricItem label="Gordura (kg)" value={a.fat_mass_kg} unit="kg" />
                  <MetricItem label="Músculo (kg)" value={a.muscle_mass_kg} unit="kg" />
                  <MetricItem label="Cintura" value={a.waist_cm} unit="cm" />
                  <MetricItem label="Quadril" value={a.hip_cm} unit="cm" />
                  <MetricItem label="Braço" value={a.arm_circumference_cm} unit="cm" />
                  <MetricItem label="Coxa" value={a.thigh_circumference_cm} unit="cm" />
                  <MetricItem label="Ombros" value={a.shoulder_width_cm} unit="cm" />
                </div>

                {/* Postural Analysis Summary */}
                {a.postural_analysis && typeof a.postural_analysis === "object" && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Análise Postural</p>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(a.postural_analysis).map(([key, val]: [string, any]) => {
                        const risk = typeof val === "object" ? val?.risk || val?.level : val;
                        if (!risk) return null;
                        const color =
                          risk === "Baixo" || risk === "Low"
                            ? "bg-green-500/10 text-green-700"
                            : risk === "Leve" || risk === "Mild"
                            ? "bg-yellow-500/10 text-yellow-700"
                            : risk === "Moderado" || risk === "Moderate"
                            ? "bg-orange-500/10 text-orange-700"
                            : "bg-red-500/10 text-red-700";
                        return (
                          <span key={key} className={`text-xs px-2 py-0.5 rounded-full ${color}`}>
                            {key.replace(/_/g, " ")}: {risk}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma avaliação importada ainda
          </p>
        )}
      </CardContent>
    </Card>
  );
}
