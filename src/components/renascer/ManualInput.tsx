import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { WearableModal } from "./WearableModal";

interface ManualInputProps {
  dataMode: string;
  todayLog: {
    sleep_hours: number | null;
    stress_level: number | null;
    energy_focus: number | null;
    trained_today: boolean | null;
    rpe: number | null;
  } | null;
}

export function ManualInput({ dataMode, todayLog }: ManualInputProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [wearableOpen, setWearableOpen] = useState(false);

  const [sleep, setSleep] = useState(todayLog?.sleep_hours ?? 7.5);
  const [stress, setStress] = useState(todayLog?.stress_level ?? 30);
  const [energy, setEnergy] = useState(todayLog?.energy_focus ?? 3);
  const [trained, setTrained] = useState(todayLog?.trained_today ?? false);
  const [rpe, setRpe] = useState(todayLog?.rpe ?? 7);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");
      const today = format(new Date(), "yyyy-MM-dd");

      // Upsert manual_day_logs
      const { error: e1 } = await supabase
        .from("manual_day_logs")
        .upsert(
          {
            user_id: user.id,
            date: today,
            sleep_hours: sleep,
            stress_level: stress,
            energy_focus: energy,
            trained_today: trained,
            rpe: trained ? rpe : null,
          },
          { onConflict: "user_id,date" }
        );
      if (e1) throw e1;

      // Sync to health_daily for backward compat
      const { error: e2 } = await supabase
        .from("health_daily")
        .upsert(
          {
            user_id: user.id,
            date: today,
            sleep_minutes: Math.round(sleep * 60),
            source: "manual",
          },
          { onConflict: "user_id,date" }
        );
      if (e2) console.warn("health_daily sync failed:", e2);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["renascer-score"] });
      toast.success("Dia registrado. Seu Score foi atualizado.");
    },
    onError: () => toast.error("Erro ao salvar. Tente novamente."),
  });

  if (dataMode === "auto") {
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
