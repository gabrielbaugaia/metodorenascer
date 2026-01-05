import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Upload, X, Camera } from "lucide-react";
import { PhotoStandardGuide } from "./PhotoStandardGuide";

interface PhotoUploadSectionProps {
  photoPreview: {
    frente: string;
    lado: string;
    costas: string;
  };
  uploadingPhoto: string | null;
  validatingPhoto?: string | null;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>, type: 'frente' | 'lado' | 'costas') => void;
  onRemove: (type: 'frente' | 'lado' | 'costas') => void;
}

function PhotoUploadBox({ 
  type, 
  label, 
  preview, 
  isUploading,
  isValidating,
  onUpload, 
  onRemove 
}: { 
  type: 'frente' | 'lado' | 'costas'; 
  label: string; 
  preview: string;
  isUploading: boolean;
  isValidating: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}) {
  const isProcessing = isUploading || isValidating;

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        {preview ? (
          <div className="relative aspect-[3/4] rounded-lg overflow-hidden border border-border">
            <img 
              src={preview} 
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
                onClick={onRemove}
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
              onChange={onUpload}
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
}

export function PhotoUploadSection({ 
  photoPreview, 
  uploadingPhoto, 
  validatingPhoto,
  onUpload, 
  onRemove 
}: PhotoUploadSectionProps) {
  return (
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
          <PhotoUploadBox
            type="frente"
            label="Frente *"
            preview={photoPreview.frente}
            isUploading={uploadingPhoto === "frente"}
            isValidating={validatingPhoto === "frente"}
            onUpload={(e) => onUpload(e, "frente")}
            onRemove={() => onRemove("frente")}
          />
          <PhotoUploadBox
            type="lado"
            label="Lado *"
            preview={photoPreview.lado}
            isUploading={uploadingPhoto === "lado"}
            isValidating={validatingPhoto === "lado"}
            onUpload={(e) => onUpload(e, "lado")}
            onRemove={() => onRemove("lado")}
          />
          <PhotoUploadBox
            type="costas"
            label="Costas *"
            preview={photoPreview.costas}
            isUploading={uploadingPhoto === "costas"}
            isValidating={validatingPhoto === "costas"}
            onUpload={(e) => onUpload(e, "costas")}
            onRemove={() => onRemove("costas")}
          />
        </div>
      </CardContent>
    </Card>
  );
}
