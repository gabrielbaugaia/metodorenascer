import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Upload, X, Camera } from "lucide-react";

interface PhotoUploadSectionProps {
  photoPreview: {
    frente: string;
    lado: string;
    costas: string;
  };
  uploadingPhoto: string | null;
  onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>, type: 'frente' | 'lado' | 'costas') => void;
  onRemovePhoto: (type: 'frente' | 'lado' | 'costas') => void;
}

function PhotoUploadBox({ 
  type, 
  label, 
  preview, 
  uploading, 
  onUpload, 
  onRemove 
}: { 
  type: 'frente' | 'lado' | 'costas'; 
  label: string; 
  preview: string;
  uploading: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}) {
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
            <button
              type="button"
              onClick={onRemove}
              className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center aspect-[3/4] border-2 border-dashed border-muted-foreground/30 rounded-lg cursor-pointer hover:border-primary/50 transition-colors bg-muted/20">
            <input
              type="file"
              accept="image/*"
              onChange={onUpload}
              className="hidden"
              disabled={uploading}
            />
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
  onPhotoUpload, 
  onRemovePhoto 
}: PhotoUploadSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Fotos Corporais
        </CardTitle>
        <CardDescription>
          Envie fotos para análise postural e acompanhamento de evolução (opcional, mas recomendado)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <PhotoUploadBox
            type="frente"
            label="Frente"
            preview={photoPreview.frente}
            uploading={uploadingPhoto === "frente"}
            onUpload={(e) => onPhotoUpload(e, "frente")}
            onRemove={() => onRemovePhoto("frente")}
          />
          <PhotoUploadBox
            type="lado"
            label="Lado"
            preview={photoPreview.lado}
            uploading={uploadingPhoto === "lado"}
            onUpload={(e) => onPhotoUpload(e, "lado")}
            onRemove={() => onRemovePhoto("lado")}
          />
          <PhotoUploadBox
            type="costas"
            label="Costas"
            preview={photoPreview.costas}
            uploading={uploadingPhoto === "costas"}
            onUpload={(e) => onPhotoUpload(e, "costas")}
            onRemove={() => onRemovePhoto("costas")}
          />
        </div>
      </CardContent>
    </Card>
  );
}
