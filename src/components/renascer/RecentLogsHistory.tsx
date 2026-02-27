import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Moon, Zap, Brain, Camera, X, Loader2, ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { calcScore, classify } from "@/lib/renascerScoreCalc";
import { toast } from "sonner";

interface DayLog {
  date: string;
  sleep_hours: number | null;
  stress_level: number | null;
  energy_focus: number | null;
  trained_today: boolean | null;
  rpe: number | null;
  steps: number | null;
  active_calories: number | null;
  exercise_minutes: number | null;
  standing_hours: number | null;
  distance_km: number | null;
  fitness_screenshot_path: string | null;
  fitness_screenshot_path_2: string | null;
  fitness_screenshot_path_3: string | null;
}

export function RecentLogsHistory() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: logs } = useQuery({
    queryKey: ["recent-logs-history", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const sevenAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");
      const { data } = await supabase
        .from("manual_day_logs")
        .select("date, sleep_hours, stress_level, energy_focus, trained_today, rpe, steps, active_calories, exercise_minutes, standing_hours, distance_km, fitness_screenshot_path, fitness_screenshot_path_2, fitness_screenshot_path_3")
        .eq("user_id", user!.id)
        .gte("date", sevenAgo)
        .lte("date", today)
        .order("date", { ascending: false });
      return (data ?? []) as DayLog[];
    },
  });

  if (!logs || logs.length === 0) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-4 text-center">
        <p className="text-sm text-muted-foreground">Registre seu primeiro dia</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border/30">
        <h3 className="text-sm font-semibold text-foreground">Últimos 7 dias</h3>
      </div>
      <div className="divide-y divide-border/30">
        {logs.map((log, i) => {
          const prev = i < logs.length - 1 ? logs[i + 1] : null;
          const dayScore = calcScore(log, prev);
          const { classification } = classify(dayScore);
          const classColors: Record<string, string> = {
            ELITE: "bg-green-500/15 text-green-400",
            ALTO: "bg-blue-500/15 text-blue-400",
            MODERADO: "bg-yellow-500/15 text-yellow-400",
            RISCO: "bg-red-500/15 text-red-400",
          };
          const hasScreenshots = log.fitness_screenshot_path || log.fitness_screenshot_path_2 || log.fitness_screenshot_path_3;

          return (
            <DayDetailDialog key={log.date} log={log} prev={prev} dayScore={dayScore} classification={classification} classColors={classColors} hasScreenshots={!!hasScreenshots} />
          );
        })}
      </div>
    </div>
  );
}

function DayDetailDialog({ log, prev, dayScore, classification, classColors, hasScreenshots }: {
  log: DayLog;
  prev: DayLog | null;
  dayScore: number;
  classification: string;
  classColors: Record<string, string>;
  hasScreenshots: boolean;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [fitnessData, setFitnessData] = useState({
    steps: log.steps,
    active_calories: log.active_calories,
    exercise_minutes: log.exercise_minutes,
    standing_hours: log.standing_hours,
    distance_km: log.distance_km,
  });
  const [dirty, setDirty] = useState(false);

  const existingPaths = [log.fitness_screenshot_path, log.fitness_screenshot_path_2, log.fitness_screenshot_path_3].filter(Boolean) as string[];
  const totalSlots = 3;
  const usedSlots = existingPaths.length + files.length;
  const canAddMore = usedSlots < totalSlots;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;

    const remaining = totalSlots - usedSlots;
    const toAdd = selected.slice(0, remaining);

    for (const file of toAdd) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Imagem muito grande. Máximo 10MB.");
        continue;
      }
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const result = ev.target?.result as string;
        setPreviews((p) => [...p, result]);
        setFiles((f) => [...f, file]);
        // OCR
        try {
          setExtracting(true);
          const { data, error } = await supabase.functions.invoke("extract-fitness-data", {
            body: { image_base64: result },
          });
          if (error) throw error;
          if (data) {
            setFitnessData((prev) => ({
              steps: data.steps != null ? data.steps : prev.steps,
              active_calories: data.active_calories != null ? data.active_calories : prev.active_calories,
              exercise_minutes: data.exercise_minutes != null ? data.exercise_minutes : prev.exercise_minutes,
              standing_hours: data.standing_hours != null ? data.standing_hours : prev.standing_hours,
              distance_km: data.distance_km != null ? data.distance_km : prev.distance_km,
            }));
            setDirty(true);
            toast.success("Dados lidos da imagem!");
          }
        } catch {
          toast.error("Não foi possível ler a imagem.");
        } finally {
          setExtracting(false);
        }
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeNewFile = (idx: number) => {
    setPreviews((p) => p.filter((_, i) => i !== idx));
    setFiles((f) => f.filter((_, i) => i !== idx));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");

      // Upload new files
      const allPaths = [...existingPaths];
      for (const file of files) {
        const slotNum = allPaths.length + 1;
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${user.id}/${log.date}_${slotNum}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("fitness-screenshots")
          .upload(path, file, { upsert: true });
        if (uploadErr) {
          console.warn("Upload failed:", uploadErr);
          continue;
        }
        allPaths.push(path);
      }

      // Build update
      const updateData: Record<string, unknown> = {
        steps: fitnessData.steps,
        active_calories: fitnessData.active_calories,
        exercise_minutes: fitnessData.exercise_minutes,
        standing_hours: fitnessData.standing_hours,
        distance_km: fitnessData.distance_km,
        fitness_screenshot_path: allPaths[0] || null,
        fitness_screenshot_path_2: allPaths[1] || null,
        fitness_screenshot_path_3: allPaths[2] || null,
      };

      const { error } = await supabase
        .from("manual_day_logs")
        .update(updateData as any)
        .eq("user_id", user.id)
        .eq("date", log.date);
      if (error) throw error;

      // Sync health_daily
      const healthData: Record<string, unknown> = {
        user_id: user.id,
        date: log.date,
        source: "manual",
      };
      if (fitnessData.steps != null) healthData.steps = fitnessData.steps;
      if (fitnessData.active_calories != null) healthData.active_calories = fitnessData.active_calories;

      await supabase
        .from("health_daily")
        .upsert(healthData as any, { onConflict: "user_id,date" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recent-logs-history"] });
      queryClient.invalidateQueries({ queryKey: ["renascer-score"] });
      toast.success(`Dados de fitness atualizados para ${format(new Date(log.date + "T12:00:00"), "dd/MM", { locale: ptBR })}!`);
      setFiles([]);
      setPreviews([]);
      setDirty(false);
    },
    onError: () => toast.error("Erro ao salvar. Tente novamente."),
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="flex items-center justify-between w-full px-4 py-2.5 text-left hover:bg-muted/30 transition-colors">
          <span className="text-sm font-medium text-foreground w-20">
            {format(new Date(log.date + "T12:00:00"), "EEE dd/MM", { locale: ptBR })}
          </span>
          <div className="flex items-center gap-3 text-muted-foreground">
            {hasScreenshots && <ImageIcon className="h-3 w-3 text-primary" />}
            <span className="flex items-center gap-1 text-xs">
              <Moon className="h-3 w-3" />
              {log.sleep_hours ?? "—"}h
            </span>
            <span className="flex items-center gap-1 text-xs">
              <Brain className="h-3 w-3" />
              {log.stress_level ?? "—"}
            </span>
            <span className="flex items-center gap-1 text-xs">
              <Zap className="h-3 w-3" />
              {log.energy_focus ?? "—"}
            </span>
          </div>
          <Badge className={`text-[10px] px-1.5 py-0 ${classColors[classification] || ""}`}>
            {dayScore}
          </Badge>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">
            {format(new Date(log.date + "T12:00:00"), "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Sono</span>
            <span className="font-medium">{log.sleep_hours ?? "—"} horas</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Estresse</span>
            <span className="font-medium">{log.stress_level ?? "—"}/100</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Energia/Foco</span>
            <span className="font-medium">{log.energy_focus ?? "—"}/5</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Treinou</span>
            <span className="font-medium">{log.trained_today ? "Sim" : "Não"}</span>
          </div>
          {log.trained_today && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">RPE</span>
              <span className="font-medium">{log.rpe ?? "—"}/10</span>
            </div>
          )}

          {/* Fitness data */}
          {(fitnessData.steps != null || fitnessData.active_calories != null || fitnessData.exercise_minutes != null) && (
            <div className="pt-2 border-t border-border/30 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fitness</p>
              {fitnessData.steps != null && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Passos</span>
                  <span className="font-medium">{fitnessData.steps.toLocaleString()}</span>
                </div>
              )}
              {fitnessData.active_calories != null && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Calorias Ativas</span>
                  <span className="font-medium">{fitnessData.active_calories}</span>
                </div>
              )}
              {fitnessData.exercise_minutes != null && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Minutos Exercício</span>
                  <span className="font-medium">{fitnessData.exercise_minutes}</span>
                </div>
              )}
              {fitnessData.standing_hours != null && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Horas em Pé</span>
                  <span className="font-medium">{fitnessData.standing_hours}</span>
                </div>
              )}
              {fitnessData.distance_km != null && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Distância</span>
                  <span className="font-medium">{fitnessData.distance_km} km</span>
                </div>
              )}
            </div>
          )}

          {/* Score */}
          <div className="flex justify-between text-sm pt-2 border-t border-border/30">
            <span className="text-muted-foreground">Score</span>
            <Badge className={`${classColors[classification] || ""}`}>
              {dayScore} — {classification}
            </Badge>
          </div>

          {/* Existing screenshots thumbnails */}
          {existingPaths.length > 0 && (
            <div className="pt-2 border-t border-border/30">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Prints anexados</p>
              <div className="flex gap-2 flex-wrap">
                {existingPaths.map((p, idx) => {
                  const { data: urlData } = supabase.storage.from("fitness-screenshots").getPublicUrl(p);
                  return (
                    <img
                      key={idx}
                      src={urlData.publicUrl}
                      alt={`Print ${idx + 1}`}
                      className="h-16 w-16 object-cover rounded-lg border border-border/50"
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* New screenshots previews */}
          {previews.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {previews.map((p, idx) => (
                <div key={idx} className="relative inline-block">
                  <img src={p} alt={`Novo print ${idx + 1}`} className="h-16 w-16 object-cover rounded-lg border border-primary/30" />
                  <button
                    onClick={() => removeNewFile(idx)}
                    className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Extracting indicator */}
          {extracting && (
            <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-primary/10 border border-primary/20">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-xs font-medium text-primary">Lendo dados da imagem...</span>
            </div>
          )}

          {/* Attach button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          {canAddMore && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/10"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="h-4 w-4" />
              Anexar print do Fitness ({usedSlots}/{totalSlots})
            </Button>
          )}

          {/* Save button */}
          {(dirty || files.length > 0) && (
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || extracting}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
            >
              {saveMutation.isPending ? "Salvando..." : "Salvar alterações"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
