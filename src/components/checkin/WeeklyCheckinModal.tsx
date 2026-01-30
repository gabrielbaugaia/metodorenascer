import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Smile, Meh, Frown, ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface WeeklyCheckinModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

const moodOptions = [
  { value: "great", icon: Smile, label: "Ótimo", color: "text-green-500" },
  { value: "good", icon: ThumbsUp, label: "Bom", color: "text-blue-500" },
  { value: "neutral", icon: Meh, label: "Normal", color: "text-yellow-500" },
  { value: "bad", icon: ThumbsDown, label: "Ruim", color: "text-orange-500" },
  { value: "terrible", icon: Frown, label: "Péssimo", color: "text-red-500" },
];

export function WeeklyCheckinModal({ open, onOpenChange, onComplete }: WeeklyCheckinModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [weight, setWeight] = useState("");
  const [energyLevel, setEnergyLevel] = useState<number>(3);
  const [adherenceLevel, setAdherenceLevel] = useState<number>(3);
  const [mood, setMood] = useState<string>("neutral");
  const [notes, setNotes] = useState("");

  const getWeekNumber = (date: Date) => {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + startOfYear.getDay() + 1) / 7);
  };

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const now = new Date();
      const weekNumber = getWeekNumber(now);
      const year = now.getFullYear();

      const { error } = await supabase.from("weekly_checkins").upsert({
        user_id: user.id,
        week_number: weekNumber,
        year: year,
        current_weight: weight ? parseFloat(weight) : null,
        energy_level: energyLevel,
        adherence_level: adherenceLevel,
        mood: mood,
        notes: notes || null,
      }, {
        onConflict: "user_id,week_number,year"
      });

      if (error) throw error;

      toast.success("Check-in semanal registrado com sucesso!");
      onComplete?.();
      onOpenChange(false);
      
      // Reset form
      setWeight("");
      setEnergyLevel(3);
      setAdherenceLevel(3);
      setMood("neutral");
      setNotes("");
    } catch (error) {
      console.error("Error saving weekly checkin:", error);
      toast.error("Erro ao salvar check-in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>Check-in Semanal</DialogTitle>
          <DialogDescription>
            Como foi sua semana? Registre seu progresso rapidamente.
          </DialogDescription>
        </DialogHeader>

        {/* Área scrollável */}
        <div className="flex-1 overflow-y-auto space-y-6 py-4 pr-2">
          {/* Weight */}
          <div className="space-y-2">
            <Label htmlFor="weight">Peso atual (kg) - opcional</Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              placeholder="Ex: 75.5"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>

          {/* Energy Level */}
          <div className="space-y-2">
            <Label>Nível de energia</Label>
            <div className="flex justify-between gap-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  onClick={() => setEnergyLevel(level)}
                  className={cn(
                    "flex-1 py-2 rounded-lg border-2 transition-all",
                    energyLevel === level
                      ? "border-primary bg-primary/20 text-primary"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  {level}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center">1 = Muito baixo, 5 = Excelente</p>
          </div>

          {/* Adherence Level */}
          <div className="space-y-2">
            <Label>Aderência ao plano</Label>
            <div className="flex justify-between gap-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  onClick={() => setAdherenceLevel(level)}
                  className={cn(
                    "flex-1 py-2 rounded-lg border-2 transition-all",
                    adherenceLevel === level
                      ? "border-green-500 bg-green-500/20 text-green-500"
                      : "border-border hover:border-green-500/50"
                  )}
                >
                  {level}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center">1 = Não segui, 5 = Segui 100%</p>
          </div>

          {/* Mood */}
          <div className="space-y-2">
            <Label>Como você está se sentindo?</Label>
            <div className="flex justify-between gap-2">
              {moodOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setMood(option.value)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all flex-1",
                    mood === option.value
                      ? `border-current bg-current/10 ${option.color}`
                      : "border-border hover:border-muted-foreground"
                  )}
                >
                  <option.icon className={cn("h-5 w-5", mood === option.value ? option.color : "text-muted-foreground")} />
                  <span className="text-[10px]">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Como foi sua semana? Alguma dificuldade?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* Footer fixo - sempre visível */}
        <div className="flex gap-3 pt-4 border-t border-border/50 shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="flex-1">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Salvando...
              </>
            ) : (
              "Registrar"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}