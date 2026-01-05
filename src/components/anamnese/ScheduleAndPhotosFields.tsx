import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Upload, X, Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PhotoStandardGuide } from "./PhotoStandardGuide";

interface ScheduleAndPhotosFieldsProps {
  formData: {
    horario_treino: string;
    horario_acorda: string;
    horario_dorme: string;
    foto_frente_url: string;
    foto_lado_url: string;
    foto_costas_url: string;
    observacoes_adicionais: string;
  };
  userId: string;
  onChange: (field: string, value: string) => void;
}

export function ScheduleAndPhotosFields({ formData, userId, onChange }: ScheduleAndPhotosFieldsProps) {
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null);
  const [validatingPhoto, setValidatingPhoto] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState({
    frente: "",
    lado: "",
    costas: "",
  });

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
  };

  const PhotoUploadBox = ({ type, label }: { type: 'frente' | 'lado' | 'costas'; label: string }) => {
    const isUploading = uploadingPhoto === type;
    const isValidating = validatingPhoto === type;
    const isProcessing = isUploading || isValidating;

    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="relative">
          {photoPreview[type] ? (
            <div className="relative aspect-[3/4] rounded-lg overflow-hidden border border-border">
              <img 
                src={photoPreview[type]} 
                alt={`Foto de ${type}`} 
                className="w-full h-full object-cover"
              />
              {isProcessing && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-1" />
                    <span className="text-xs">{isValidating ? "Validando..." : "Enviando..."}</span>
                  </div>
                </div>
              )}
              {!isProcessing && (
                <button
                  type="button"
                  onClick={() => removePhoto(type)}
                  className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center aspect-[3/4] border-2 border-dashed border-muted-foreground/30 rounded-lg cursor-pointer hover:border-primary/50 transition-colors bg-muted/20">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handlePhotoUpload(e, type)}
                className="hidden"
                disabled={isProcessing}
              />
              {isProcessing ? (
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-1" />
                  <span className="text-xs text-muted-foreground">{isValidating ? "Validando..." : "Enviando..."}</span>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Clique para selecionar</span>
                  <span className="text-xs text-muted-foreground mt-1">Máximo 10MB</span>
                </>
              )}
            </label>
          )}
        </div>
      </div>
    );
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
      <Card className="border-primary/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Fotos Corporais <span className="text-destructive">*</span>
          </CardTitle>
          <CardDescription>
            <span className="text-destructive font-medium">Obrigatório:</span> Envie as 3 fotos abaixo para liberar acesso às suas prescrições personalizadas.
            As fotos são essenciais para análise postural e acompanhamento de evolução.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Photo Standard Guide */}
          <PhotoStandardGuide />
          
          <div className="grid grid-cols-3 gap-4">
            <PhotoUploadBox type="frente" label="Frente *" />
            <PhotoUploadBox type="lado" label="Lado *" />
            <PhotoUploadBox type="costas" label="Costas *" />
          </div>
        </CardContent>
      </Card>

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
