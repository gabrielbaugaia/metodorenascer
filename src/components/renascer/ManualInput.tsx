import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { WearableModal } from "./WearableModal";
import { useWearables } from "@/lib/wearables/useWearables";
import { ChevronDown, Camera, X, Footprints, Flame, Timer, PersonStanding, Route } from "lucide-react";

interface ManualInputProps {
  dataMode: string;
  todayLog: {
    sleep_hours: number | null;
    stress_level: number | null;
    energy_focus: number | null;
    trained_today: boolean | null;
    rpe: number | null;
  } | null;
  onSaveSuccess?: () => void;
}

export function ManualInput({ dataMode, todayLog, onSaveSuccess }: ManualInputProps) {
  const { user } = useAuth();
  const { isConnected } = useWearables(user?.id);
  const queryClient = useQueryClient();
  const [wearableOpen, setWearableOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [sleep, setSleep] = useState(todayLog?.sleep_hours ?? 7.5);
  const [stress, setStress] = useState(todayLog?.stress_level ?? 30);
  const [energy, setEnergy] = useState(todayLog?.energy_focus ?? 3);
  const [trained, setTrained] = useState(todayLog?.trained_today ?? false);
  const [rpe, setRpe] = useState(todayLog?.rpe ?? 7);

  // Fitness fields
  const [fitnessOpen, setFitnessOpen] = useState(false);
  const [steps, setSteps] = useState<string>("");
  const [activeCals, setActiveCals] = useState<string>("");
  const [exerciseMins, setExerciseMins] = useState<string>("");
  const [standingHrs, setStandingHrs] = useState<string>("");
  const [distanceKm, setDistanceKm] = useState<string>("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 10MB.");
      return;
    }
    setScreenshotFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setScreenshotPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const removeScreenshot = () => {
    setScreenshotFile(null);
    setScreenshotPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");
      const today = format(new Date(), "yyyy-MM-dd");

      // Upload screenshot if provided
      let screenshotPath: string | null = null;
      if (screenshotFile) {
        const ext = screenshotFile.name.split(".").pop() || "jpg";
        const path = `${user.id}/${today}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("fitness-screenshots")
          .upload(path, screenshotFile, { upsert: true });
        if (uploadErr) {
          console.warn("Screenshot upload failed:", uploadErr);
          toast.error("Falha ao enviar print. Dados serão salvos sem a imagem.");
        } else {
          screenshotPath = path;
        }
      }

      // Parse fitness values
      const stepsVal = steps ? parseInt(steps) : null;
      const activeCalsVal = activeCals ? parseInt(activeCals) : null;
      const exerciseMinsVal = exerciseMins ? parseInt(exerciseMins) : null;
      const standingHrsVal = standingHrs ? parseInt(standingHrs) : null;
      const distanceKmVal = distanceKm ? parseFloat(distanceKm) : null;

      // Upsert manual_day_logs
      const upsertData: Record<string, unknown> = {
        user_id: user.id,
        date: today,
        sleep_hours: sleep,
        stress_level: stress,
        energy_focus: energy,
        trained_today: trained,
        rpe: trained ? rpe : null,
        steps: stepsVal,
        active_calories: activeCalsVal,
        exercise_minutes: exerciseMinsVal,
        standing_hours: standingHrsVal,
        distance_km: distanceKmVal,
      };
      if (screenshotPath) {
        upsertData.fitness_screenshot_path = screenshotPath;
      }

      const { error: e1 } = await supabase
        .from("manual_day_logs")
        .upsert(upsertData as any, { onConflict: "user_id,date" });
      if (e1) throw e1;

      // Sync to health_daily for backward compat
      const healthData: Record<string, unknown> = {
        user_id: user.id,
        date: today,
        sleep_minutes: Math.round(sleep * 60),
        source: "manual",
      };
      if (stepsVal !== null) healthData.steps = stepsVal;
      if (activeCalsVal !== null) healthData.active_calories = activeCalsVal;

      const { error: e2 } = await supabase
        .from("health_daily")
        .upsert(healthData as any, { onConflict: "user_id,date" });
      if (e2) console.warn("health_daily sync failed:", e2);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["renascer-score"] });
      toast.success("Dia registrado. Seu Score foi atualizado.");
      onSaveSuccess?.();
    },
    onError: () => toast.error("Erro ao salvar. Tente novamente."),
  });

  if (dataMode === "auto" && isConnected) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
          Registrar hoje (30s)
        </h3>
        <div className="flex items-center justify-between">
          <Label className="text-sm text-muted-foreground">Dados automáticos</Label>
          <span className="text-xs text-primary font-medium">Ativado</span>
        </div>
        <div className="text-center py-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Conectar relógio (em breve)
          </p>
          <p className="text-xs text-muted-foreground">
            Quando ativarmos, sono, passos e frequência serão preenchidos automaticamente.
          </p>
          <Button variant="outline" size="sm" onClick={() => setWearableOpen(true)}>
            Saiba mais
          </Button>
        </div>
        <WearableModal open={wearableOpen} onOpenChange={setWearableOpen} />
      </div>
    );
  }

  const hasFitnessData = steps || activeCals || exerciseMins || standingHrs || distanceKm || screenshotFile;

  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 space-y-5">
      <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
        Registrar hoje (30s)
      </h3>

      {/* Sleep */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Sono (horas)</Label>
        <Input
          type="number"
          min={0}
          max={12}
          step={0.5}
          value={sleep}
          onChange={(e) => setSleep(parseFloat(e.target.value) || 0)}
          className="bg-muted/50"
        />
      </div>

      {/* Stress */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label className="text-xs text-muted-foreground">Estresse</Label>
          <span className="text-xs text-muted-foreground">{stress}</span>
        </div>
        <Slider
          min={0}
          max={100}
          step={5}
          value={[stress]}
          onValueChange={([v]) => setStress(v)}
        />
      </div>

      {/* Energy */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Energia / Foco</Label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((v) => (
            <button
              key={v}
              onClick={() => setEnergy(v)}
              className={cn(
                "flex-1 py-2 rounded-lg text-sm font-semibold border transition-all",
                energy === v
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/50 text-muted-foreground border-border/50 hover:border-primary/50"
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Training */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Switch checked={trained} onCheckedChange={setTrained} />
          <Label className="text-xs text-muted-foreground">Treinei hoje?</Label>
        </div>
        {trained && (
          <div className="space-y-2 pl-1">
            <div className="flex justify-between">
              <Label className="text-xs text-muted-foreground">RPE</Label>
              <span className="text-xs text-muted-foreground">{rpe}</span>
            </div>
            <Slider
              min={1}
              max={10}
              step={1}
              value={[rpe]}
              onValueChange={([v]) => setRpe(v)}
            />
          </div>
        )}
      </div>

      {/* Fitness Data - Collapsible */}
      <Collapsible open={fitnessOpen} onOpenChange={setFitnessOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between py-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
            <span className="flex items-center gap-1.5">
              📱 Dados do Fitness (opcional)
              {hasFitnessData && (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </span>
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", fitnessOpen && "rotate-180")} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-2">
          <p className="text-[11px] text-muted-foreground">
            Preencha com os dados do Apple Fitness, Google Fit ou relógio.
          </p>

          {/* Steps */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Footprints className="h-3.5 w-3.5" /> Passos
            </Label>
            <Input
              type="number"
              min={0}
              placeholder="ex: 8500"
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              className="bg-muted/50"
            />
          </div>

          {/* Active Calories */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5" /> Calorias Ativas
            </Label>
            <Input
              type="number"
              min={0}
              placeholder="ex: 450"
              value={activeCals}
              onChange={(e) => setActiveCals(e.target.value)}
              className="bg-muted/50"
            />
          </div>

          {/* Exercise Minutes */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Timer className="h-3.5 w-3.5" /> Minutos de Exercício
            </Label>
            <Input
              type="number"
              min={0}
              placeholder="ex: 45"
              value={exerciseMins}
              onChange={(e) => setExerciseMins(e.target.value)}
              className="bg-muted/50"
            />
          </div>

          {/* Standing Hours */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <PersonStanding className="h-3.5 w-3.5" /> Horas em Pé
            </Label>
            <Input
              type="number"
              min={0}
              max={24}
              placeholder="ex: 10"
              value={standingHrs}
              onChange={(e) => setStandingHrs(e.target.value)}
              className="bg-muted/50"
            />
          </div>

          {/* Distance */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Route className="h-3.5 w-3.5" /> Distância (km)
            </Label>
            <Input
              type="number"
              min={0}
              step={0.1}
              placeholder="ex: 5.2"
              value={distanceKm}
              onChange={(e) => setDistanceKm(e.target.value)}
              className="bg-muted/50"
            />
          </div>

          {/* Screenshot Upload */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Print da tela do Fitness</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            {screenshotPreview ? (
              <div className="relative inline-block">
                <img
                  src={screenshotPreview}
                  alt="Print do fitness"
                  className="rounded-lg border border-border/50 max-h-40 object-contain"
                />
                <button
                  onClick={removeScreenshot}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-3.5 w-3.5" />
                Enviar print
              </Button>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Button
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
      >
        {saveMutation.isPending ? "Salvando..." : "Salvar meu dia"}
      </Button>
    </div>
  );
}
