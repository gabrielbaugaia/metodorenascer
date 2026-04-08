import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Sparkles, FileText, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ManualProtocolInputProps {
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ManualProtocolInput({ userId, onSuccess, onCancel }: ManualProtocolInputProps) {
  const [protocolText, setProtocolText] = useState("");
  const [instructions, setInstructions] = useState("");
  const [title, setTitle] = useState("");
  const [processing, setProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState("escrever");

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleProcess = async () => {
    if (!protocolText && !selectedFile) {
      toast.error("Escreva o protocolo ou anexe uma imagem/PDF");
      return;
    }

    setProcessing(true);
    try {
      let imageBase64: string | undefined;

      if (selectedFile) {
        // Convert image to base64
        if (selectedFile.type.startsWith("image/")) {
          imageBase64 = await fileToBase64(selectedFile);
        } else {
          toast.error("Por enquanto, apenas imagens são suportadas para transcrição por IA");
          setProcessing(false);
          return;
        }
      }

      const { data, error } = await supabase.functions.invoke("transcribe-manual-protocol", {
        body: {
          text: protocolText || undefined,
          imageBase64,
          instructions: instructions || undefined,
          userId,
          title: title || undefined,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("Protocolo transcrito e salvo com sucesso!");
        onSuccess();
      } else {
        throw new Error(data?.error || "Erro desconhecido");
      }
    } catch (error: any) {
      console.error("Error processing manual protocol:", error);
      const msg = error?.message || "Erro ao processar protocolo";
      toast.error(msg);
    } finally {
      setProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Arquivo muito grande. Máximo 10MB.");
        return;
      }
      setSelectedFile(file);
    }
  };

  return (
    <Card className="border-primary/30 bg-card">
      <CardContent className="pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Entrada Manual de Protocolo
          </h4>
          <Button variant="ghost" size="icon" onClick={onCancel} className="h-7 w-7">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Título do protocolo (opcional)</Label>
          <Input
            placeholder="Ex: Treino Hipertrofia - Fase 2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="escrever" className="text-xs gap-1">
              <FileText className="h-3.5 w-3.5" />
              Escrever
            </TabsTrigger>
            <TabsTrigger value="anexar" className="text-xs gap-1">
              <Upload className="h-3.5 w-3.5" />
              Anexar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="escrever" className="mt-3">
            <Textarea
              placeholder={`Cole ou escreva o protocolo aqui. Exemplo:\n\nTreino A - Peito e Tríceps\n1. Supino reto com barra - 4x10-12 - 90s descanso\n2. Crucifixo inclinado - 3x12 - 60s descanso\n3. Tríceps corda - 3x15 - 45s descanso\n\nTreino B - Costas e Bíceps\n1. Puxada frontal - 4x10 - 90s\n...`}
              value={protocolText}
              onChange={(e) => setProtocolText(e.target.value)}
              rows={10}
              className="font-mono text-xs"
            />
          </TabsContent>

          <TabsContent value="anexar" className="mt-3">
            <div className="space-y-3">
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="protocol-file-upload"
                />
                <label htmlFor="protocol-file-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Clique para selecionar uma imagem
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG — máx. 10MB
                  </p>
                </label>
              </div>
              {selectedFile && (
                <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                  <span className="text-xs truncate flex-1">{selectedFile.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() => setSelectedFile(null)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
              <Textarea
                placeholder="Texto adicional para complementar a imagem (opcional)..."
                value={protocolText}
                onChange={(e) => setProtocolText(e.target.value)}
                rows={3}
                className="text-xs"
              />
            </div>
          </TabsContent>
        </Tabs>

        <div>
          <Label className="text-xs text-muted-foreground">
            Orientações adicionais para a IA (opcional)
          </Label>
          <Textarea
            placeholder="Ex: Foco em hipertrofia, aluno intermediário, evitar exercícios com impacto no joelho..."
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={2}
            className="text-xs"
          />
        </div>

        <Button
          onClick={handleProcess}
          disabled={processing || (!protocolText && !selectedFile)}
          variant="fire"
          className="w-full"
        >
          {processing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Processando com IA...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Processar com IA e Subir Treino
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
