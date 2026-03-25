import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, Upload, Loader2, FileText, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function EcgUploadCard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [heartRate, setHeartRate] = useState("");
  const [classification, setClassification] = useState("normal");
  const [notes, setNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: records, isLoading } = useQuery({
    queryKey: ["ecg-records", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ecg_records")
        .select("*")
        .eq("user_id", user!.id)
        .order("recorded_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!user || !selectedFile) throw new Error("Missing data");
      setUploading(true);

      const ext = selectedFile.name.split(".").pop() || "pdf";
      const path = `${user.id}/${Date.now()}.${ext}`;
      
      const { error: uploadErr } = await supabase.storage
        .from("ecg-records")
        .upload(path, selectedFile);
      if (uploadErr) throw uploadErr;

      const { error: insertErr } = await supabase
        .from("ecg_records")
        .insert({
          user_id: user.id,
          file_url: path,
          heart_rate_bpm: heartRate ? parseInt(heartRate) : null,
          classification,
          notes: notes || null,
        } as any);
      if (insertErr) throw insertErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ecg-records"] });
      toast.success("ECG registrado com sucesso!");
      setSelectedFile(null);
      setHeartRate("");
      setClassification("normal");
      setNotes("");
      setUploading(false);
    },
    onError: () => {
      toast.error("Erro ao salvar ECG.");
      setUploading(false);
    },
  });

  const classificationLabels: Record<string, string> = {
    normal: "Ritmo Sinusal",
    afib: "Fibrilação Atrial",
    inconclusive: "Inconclusivo",
  };

  const classificationColors: Record<string, string> = {
    normal: "bg-green-500/10 text-green-500",
    afib: "bg-red-500/10 text-red-500",
    inconclusive: "bg-yellow-500/10 text-yellow-500",
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <Heart className="h-4 w-4 text-red-500" />
        Eletrocardiograma (ECG)
      </h3>

      {/* Upload form */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
          />

          {selectedFile ? (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border/50">
              <FileText className="h-4 w-4 text-primary shrink-0" />
              <span className="text-xs truncate flex-1">{selectedFile.name}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => setSelectedFile(null)}
              >
                Trocar
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full gap-2 border-dashed"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              Anexar ECG (PDF ou imagem)
            </Button>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground">BPM</label>
              <Input
                type="number"
                inputMode="numeric"
                placeholder="72"
                value={heartRate}
                onChange={(e) => setHeartRate(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">Resultado</label>
              <Select value={classification} onValueChange={setClassification}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Ritmo Sinusal</SelectItem>
                  <SelectItem value="afib">Fibrilação Atrial</SelectItem>
                  <SelectItem value="inconclusive">Inconclusivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Input
            placeholder="Observações (opcional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="h-9 text-sm"
          />

          <Button
            onClick={() => uploadMutation.mutate()}
            disabled={!selectedFile || uploading}
            className="w-full"
            size="sm"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Heart className="h-4 w-4 mr-2" />
            )}
            Salvar ECG
          </Button>
        </CardContent>
      </Card>

      {/* History */}
      {records && records.length > 0 && (
        <div className="space-y-2">
          {records.map((record: any) => (
            <Card key={record.id}>
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-medium">
                      {format(new Date(record.recorded_at), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                    {record.heart_rate_bpm && (
                      <p className="text-[10px] text-muted-foreground">
                        {record.heart_rate_bpm} BPM
                      </p>
                    )}
                  </div>
                </div>
                <Badge
                  className={`text-[10px] ${classificationColors[record.classification] || ""}`}
                >
                  {classificationLabels[record.classification] || record.classification}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
