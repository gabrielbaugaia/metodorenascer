import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Upload, X, Loader2, AlertTriangle, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PhotoStandardGuide } from "./PhotoStandardGuide";
import { PhotoUploadSection } from "./PhotoUploadSection";
import { BodyAnalysisResult } from "./BodyAnalysisResult";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

interface ScheduleAndPhotosFieldsProps {
  formData: {
    horario_treino: string;
    horario_acorda: string;
    horario_dorme: string;
    foto_frente_url: string;
    foto_lado_url: string;
    foto_costas_url: string;
    observacoes_adicionais: string;
    weight?: string;
    height?: string;
    sexo?: string;
    objetivo_principal?: string;
    data_nascimento?: string;
  };
  userId: string;
  userName?: string;
  onChange: (field: string, value: string) => void;
}

interface BodyAnalysis {
  resumoGeral: string;
  biotipo?: {
    tipo: string;
    descricao: string;
  };
  composicaoCorporal?: {
    percentualGorduraEstimado: string;
    classificacao: string;
    distribuicaoGordura: string;
    massaMuscular: string;
  };
  [key: string]: unknown;
}

export function ScheduleAndPhotosFields({ formData, userId, userName, onChange }: ScheduleAndPhotosFieldsProps) {
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null);
  const [validatingPhoto, setValidatingPhoto] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState({
    frente: "",
    lado: "",
    costas: "",
  });
  const [bodyAnalysis, setBodyAnalysis] = useState<BodyAnalysis | null>(null);
  const [analyzingBody, setAnalyzingBody] = useState(false);
  const [analysisOpen, setAnalysisOpen] = useState(true);

  // Calculate age from birth date
  const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 0;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Trigger body analysis when all 3 photos are uploaded
  useEffect(() => {
    const hasAllPhotos = photoPreview.frente && photoPreview.lado && photoPreview.costas;
    const hasAllUrls = formData.foto_frente_url && formData.foto_lado_url && formData.foto_costas_url;
    
    if (hasAllPhotos && hasAllUrls && !bodyAnalysis && !analyzingBody) {
      runBodyAnalysis();
    }
  }, [formData.foto_frente_url, formData.foto_lado_url, formData.foto_costas_url, photoPreview]);

  const runBodyAnalysis = async () => {
    if (!photoPreview.frente || !photoPreview.lado || !photoPreview.costas) return;
    
    setAnalyzingBody(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("analyze-body-composition", {
        body: {
          photos: {
            frente: photoPreview.frente,
            lado: photoPreview.lado,
            costas: photoPreview.costas,
          },
          clientData: {
            name: userName || "Cliente",
            age: calculateAge(formData.data_nascimento || ""),
            weight: formData.weight,
            height: formData.height,
            sex: formData.sexo,
            goal: formData.objetivo_principal,
          },
        },
      });

      if (error) {
        console.error("Body analysis error:", error);
        toast.error("Não foi possível gerar a análise corporal");
        return;
      }

      if (data?.analysis) {
        setBodyAnalysis(data.analysis);
        toast.success("Avaliação física gerada com sucesso!");
      }
    } catch (err) {
      console.error("Body analysis failed:", err);
    } finally {
      setAnalyzingBody(false);
    }
  };

  const validatePhotoWithAI = async (base64Image: string): Promise<{ valid: boolean; reason: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke("validate-body-photo", {
        body: { imageBase64: base64Image },
      });

      if (error) {
        console.error("Validation error:", error);
        return { valid: true, reason: "OK" }; // Accept on error
      }

      return data || { valid: true, reason: "OK" };
    } catch (err) {
      console.error("Validation failed:", err);
      return { valid: true, reason: "OK" }; // Accept on error
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'frente' | 'lado' | 'costas') => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 10MB.");
      return;
    }

    // Read file as base64 for preview and validation
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      
      // Show preview immediately
      setPhotoPreview(prev => ({ ...prev, [type]: base64 }));
      
      // Validate with AI
      setValidatingPhoto(type);
      const validation = await validatePhotoWithAI(base64);
      setValidatingPhoto(null);

      if (!validation.valid) {
        toast.error(validation.reason, {
          duration: 6000,
          icon: <AlertTriangle className="h-5 w-5 text-destructive" />,
        });
        // Remove the preview since it was rejected
        setPhotoPreview(prev => ({ ...prev, [type]: "" }));
        onChange(`foto_${type}_url`, "");
        return;
      }

      // Photo is valid, upload to storage
      setUploadingPhoto(type);

      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${type}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('body-photos')
          .upload(fileName, file, { upsert: true });

        if (uploadError) throw uploadError;

        onChange(`foto_${type}_url`, fileName);
        toast.success(`Foto de ${type} aprovada e enviada!`);
      } catch (error) {
        console.error("Error uploading photo:", error);
        toast.error("Erro ao enviar foto");
        setPhotoPreview(prev => ({ ...prev, [type]: "" }));
      } finally {
        setUploadingPhoto(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = (type: 'frente' | 'lado' | 'costas') => {
    setPhotoPreview(prev => ({ ...prev, [type]: "" }));
    onChange(`foto_${type}_url`, "");
    // Reset analysis when a photo is removed
    setBodyAnalysis(null);
  };

  return (
    <>
      {/* Horários */}
      <Card>
        <CardHeader>
          <CardTitle>Horários</CardTitle>
          <CardDescription>
            Informe seus horários para ajustar seu plano de dieta e treino
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="horario_treino">Horário de Treino</Label>
              <Input
                id="horario_treino"
                type="time"
                value={formData.horario_treino}
                onChange={(e) => onChange("horario_treino", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="horario_acorda">Horário que Acorda</Label>
              <Input
                id="horario_acorda"
                type="time"
                value={formData.horario_acorda}
                onChange={(e) => onChange("horario_acorda", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="horario_dorme">Horário que Dorme</Label>
              <Input
                id="horario_dorme"
                type="time"
                value={formData.horario_dorme}
                onChange={(e) => onChange("horario_dorme", e.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            💡 Mudou o horário do treino? Avise para ajustarmos sua dieta!
          </p>
        </CardContent>
      </Card>

      {/* Fotos Obrigatórias */}
      <PhotoUploadSection
        photoPreview={photoPreview}
        uploadingPhoto={uploadingPhoto}
        validatingPhoto={validatingPhoto}
        onUpload={handlePhotoUpload}
        onRemove={removePhoto}
      />

      {/* Body Analysis Result */}
      {analyzingBody && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="py-8">
            <div className="flex flex-col items-center justify-center text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <h3 className="font-medium mb-1">Analisando sua composição corporal...</h3>
              <p className="text-sm text-muted-foreground">
                Nossa IA está avaliando suas fotos para gerar uma análise personalizada
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {bodyAnalysis && !analyzingBody && (
        <Collapsible open={analysisOpen} onOpenChange={setAnalysisOpen}>
          <Card className="border-primary/30">
            <CardHeader className="pb-2">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Avaliação Física por IA
                  </CardTitle>
                  <span className="text-sm text-muted-foreground">
                    {analysisOpen ? "Ocultar" : "Ver análise"}
                  </span>
                </Button>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent>
                <BodyAnalysisResult analysis={bodyAnalysis} />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Observações */}
      <Card>
        <CardHeader>
          <CardTitle>Observações Adicionais</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Alguma informação adicional que gostaria de compartilhar..."
            value={formData.observacoes_adicionais}
            onChange={(e) => onChange("observacoes_adicionais", e.target.value)}
            rows={4}
          />
        </CardContent>
      </Card>
    </>
  );
}
