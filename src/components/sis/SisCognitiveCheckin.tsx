import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Brain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";

const fields = [
  { key: "mental_energy", label: "Energia Mental", emoji: "⚡" },
  { key: "mental_clarity", label: "Clareza Mental", emoji: "💎" },
  { key: "focus", label: "Foco", emoji: "🎯" },
  { key: "irritability", label: "Irritabilidade", emoji: "😤" },
  { key: "food_discipline", label: "Disciplina Alimentar", emoji: "🥗" },
] as const;

export function SisCognitiveCheckin() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState({
    mental_energy: 3,
    mental_clarity: 3,
    focus: 3,
    irritability: 3,
    food_discipline: 3,
    alcohol: false,
    notes: "",
  });

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const { error } = await supabase
        .from("sis_cognitive_checkins")
        .upsert({
          user_id: user.id,
          date: today,
          ...values,
        }, { onConflict: "user_id,date" });

      if (error) throw error;

      // Trigger score recomputation
      await supabase.functions.invoke("compute-sis-score", {
        body: { target_date: today },
      });

      queryClient.invalidateQueries({ queryKey: ["sis-scores-30d"] });
      queryClient.invalidateQueries({ queryKey: ["sis-streak"] });
      toast.success("Check-in cognitivo salvo!");
      setOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar check-in");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full gap-2">
          <Brain className="h-4 w-4" />
          Check-in Cognitivo (1 min)
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">Check-in Cognitivo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {fields.map(f => (
            <div key={f.key} className="space-y-1">
              <div className="flex justify-between items-center">
                <Label className="text-xs">{f.emoji} {f.label}</Label>
                <span className="text-xs font-bold text-foreground">{values[f.key]}/5</span>
              </div>
              <Slider
                min={1} max={5} step={1}
                value={[values[f.key]]}
                onValueChange={([v]) => setValues(prev => ({ ...prev, [f.key]: v }))}
              />
            </div>
          ))}

          <div className="flex items-center justify-between">
            <Label className="text-xs">🍷 Consumiu álcool?</Label>
            <Switch
              checked={values.alcohol}
              onCheckedChange={(v) => setValues(prev => ({ ...prev, alcohol: v }))}
            />
          </div>

          <Textarea
            placeholder="Observações (opcional)"
            value={values.notes}
            onChange={(e) => setValues(prev => ({ ...prev, notes: e.target.value }))}
            className="text-xs h-16"
          />

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? "Salvando..." : "Salvar Check-in"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
