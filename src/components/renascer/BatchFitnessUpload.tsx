import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, Camera, X, Loader2, CheckCircle, Plus, Upload } from "lucide-react";

interface ExtractedDay {
  date: string;
  steps: number | null;
  active_calories: number | null;
  exercise_minutes: number | null;
  standing_hours: number | null;
  distance_km: number | null;
  file: File;
  base64: string;
}

interface BatchFitnessUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BatchFitnessUpload({ open, onOpenChange }: BatchFitnessUploadProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<{ file: File; preview: string }[]>([]);
  const [extractedDays, setExtractedDays] = useState<ExtractedDay[]>([]);
  const [processing, setProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<"upload" | "review" | "done">("upload");

  const maxImages = 7;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;

    const remaining = maxImages - files.length;
    const toAdd = selected.slice(0, remaining);

    for (const file of toAdd) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Imagem muito grande. Máximo 10MB.");
        continue;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        setFiles((prev) => [...prev, { file, preview: result }]);
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const processImages = async () => {
    if (!files.length) return;
    setProcessing(true);
    setProcessProgress(0);

    const results: ExtractedDay[] = [];
    for (let i = 0; i < files.length; i++) {
      try {
        const { data, error } = await supabase.functions.invoke("extract-fitness-data", {
          body: { image_base64: files[i].preview },
        });
        if (error) throw error;

        const detectedDate = data?.detected_date || format(new Date(), "yyyy-MM-dd");

        // Merge with existing result for same date
        const existing = results.find((r) => r.date === detectedDate);
        if (existing) {
          if (data?.steps != null) existing.steps = data.steps;
          if (data?.active_calories != null) existing.active_calories = data.active_calories;
          if (data?.exercise_minutes != null) existing.exercise_minutes = data.exercise_minutes;
          if (data?.standing_hours != null) existing.standing_hours = data.standing_hours;
          if (data?.distance_km != null) existing.distance_km = data.distance_km;
        } else {
          results.push({
            date: detectedDate,
            steps: data?.steps ?? null,
            active_calories: data?.active_calories ?? null,
            exercise_minutes: data?.exercise_minutes ?? null,
            standing_hours: data?.standing_hours ?? null,
            distance_km: data?.distance_km ?? null,
            file: files[i].file,
            base64: files[i].preview,
          });
        }
      } catch (err) {
        console.error(`Failed to extract image ${i + 1}:`, err);
        toast.error(`Falha ao ler imagem ${i + 1}`);
      }
      setProcessProgress(((i + 1) / files.length) * 100);
    }

    setExtractedDays(results.sort((a, b) => a.date.localeCompare(b.date)));
    setStep("review");
    setProcessing(false);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");
      setSaving(true);

      for (const day of extractedDays) {
        // Upload screenshot
        const ext = day.file.name.split(".").pop() || "jpg";
        const path = `${user.id}/${day.date}_batch.${ext}`;
        await supabase.storage
          .from("fitness-screenshots")
          .upload(path, day.file, { upsert: true });

        // Upsert manual_day_logs
        const { error: e1 } = await supabase
          .from("manual_day_logs")
          .upsert(
            {
              user_id: user.id,
              date: day.date,
              steps: day.steps,
              active_calories: day.active_calories,
              exercise_minutes: day.exercise_minutes,
              standing_hours: day.standing_hours,
              distance_km: day.distance_km,
              fitness_screenshot_path: path,
            } as any,
            { onConflict: "user_id,date" }
          );
        if (e1) console.warn("Upsert error:", e1);

        // Sync health_daily
        const healthData: Record<string, unknown> = {
          user_id: user.id,
          date: day.date,
          source: "manual",
        };
        if (day.steps != null) healthData.steps = day.steps;
        if (day.active_calories != null) healthData.active_calories = day.active_calories;
        if (day.exercise_minutes != null) healthData.exercise_minutes = day.exercise_minutes;
        if (day.standing_hours != null) healthData.standing_hours = day.standing_hours;
        if (day.distance_km != null) healthData.distance_km = day.distance_km;

        await supabase
          .from("health_daily")
          .upsert(healthData as any, { onConflict: "user_id,date" });
      }

      // Recompute SIS for each day
      for (const day of extractedDays) {
        try {
          await supabase.functions.invoke("compute-sis-score", {
            body: { target_date: day.date },
          });
        } catch (e) {
          console.warn("SIS recompute failed for", day.date, e);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recent-logs-history"] });
      queryClient.invalidateQueries({ queryKey: ["renascer-score"] });
      queryClient.invalidateQueries({ queryKey: ["sis-scores-30d"] });
      toast.success(`${extractedDays.length} dia(s) registrado(s) com sucesso!`);
      setStep("done");
      setSaving(false);
    },
    onError: () => {
      toast.error("Erro ao salvar dados. Tente novamente.");
      setSaving(false);
    },
  });

  const handleClose = () => {
    setFiles([]);
    setExtractedDays([]);
    setStep("upload");
    setProcessProgress(0);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-5 w-5 text-primary" />
            Recuperar Semana
          </DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Envie até 7 prints do Apple Fitness, Google Fit ou Samsung Health. A IA detecta a data e dados de cada imagem automaticamente.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* Preview grid */}
            {files.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {files.map((f, idx) => (
                  <div key={idx} className="relative">
                    <img
                      src={f.preview}
                      alt={`Print ${idx + 1}`}
                      className="rounded-lg border border-border/50 h-20 w-full object-cover"
                    />
                    <button
                      onClick={() => removeFile(idx)}
                      className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {files.length < maxImages && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="h-20 rounded-lg border-2 border-dashed border-primary/30 flex flex-col items-center justify-center text-primary/60 hover:border-primary/60 transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                    <span className="text-[10px]">{files.length}/{maxImages}</span>
                  </button>
                )}
              </div>
            )}

            {files.length === 0 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-10 rounded-xl border-2 border-dashed border-primary/30 flex flex-col items-center gap-2 text-primary/60 hover:border-primary/60 hover:text-primary transition-colors"
              >
                <Camera className="h-8 w-8" />
                <span className="text-sm font-medium">Selecionar imagens</span>
                <span className="text-xs text-muted-foreground">Até 7 prints da semana</span>
              </button>
            )}

            {processing && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-primary font-medium">
                    Processando imagens...
                  </span>
                </div>
                <Progress value={processProgress} className="h-2" />
              </div>
            )}

            <Button
              onClick={processImages}
              disabled={files.length === 0 || processing}
              className="w-full"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Lendo dados...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Processar {files.length} imagem(ns)
                </>
              )}
            </Button>
          </div>
        )}

        {step === "review" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Confira os dados extraídos antes de salvar:
            </p>

            <div className="space-y-3">
              {extractedDays.map((day, idx) => (
                <div key={idx} className="rounded-lg border border-border/50 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">
                      {format(new Date(day.date + "T12:00:00"), "EEE, dd/MM", { locale: ptBR })}
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {day.date}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {day.steps != null && (
                      <span>Passos: <span className="text-foreground font-medium">{day.steps.toLocaleString()}</span></span>
                    )}
                    {day.active_calories != null && (
                      <span>Calorias: <span className="text-foreground font-medium">{day.active_calories}</span></span>
                    )}
                    {day.exercise_minutes != null && (
                      <span>Exercício: <span className="text-foreground font-medium">{day.exercise_minutes} min</span></span>
                    )}
                    {day.standing_hours != null && (
                      <span>Em pé: <span className="text-foreground font-medium">{day.standing_hours}h</span></span>
                    )}
                    {day.distance_km != null && (
                      <span>Distância: <span className="text-foreground font-medium">{day.distance_km} km</span></span>
                    )}
                    {!day.steps && !day.active_calories && !day.exercise_minutes && (
                      <span className="col-span-2 text-yellow-500">Nenhum dado detectado</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("upload")} className="flex-1">
                Voltar
              </Button>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saving || extractedDays.length === 0}
                className="flex-1"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Salvando...
                  </>
                ) : (
                  `Salvar ${extractedDays.length} dia(s)`
                )}
              </Button>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center gap-4 py-6">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <p className="text-sm font-medium text-center">
              {extractedDays.length} dia(s) registrado(s) com sucesso!
              <br />
              <span className="text-muted-foreground">Scores e gráficos foram atualizados.</span>
            </p>
            <Button onClick={handleClose} variant="outline">
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
