import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Save, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
}

interface SetEntry {
  weightKg: string;
  repsDone: string;
}

interface ManualSetLoggerProps {
  workoutName: string;
  exercises: Exercise[];
  onComplete: (durationSeconds?: number, sessionId?: string) => void;
  onCancel: () => void;
}

export function ManualSetLogger({
  workoutName,
  exercises,
  onComplete,
  onCancel,
}: ManualSetLoggerProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [lastWeights, setLastWeights] = useState<Record<string, number>>({});

  // Initialize set entries for all exercises
  const [entries, setEntries] = useState<Record<string, SetEntry[]>>(() => {
    const init: Record<string, SetEntry[]> = {};
    for (const ex of exercises) {
      init[ex.name] = Array.from({ length: ex.sets }, () => ({
        weightKg: "",
        repsDone: "",
      }));
    }
    return init;
  });

  // Load last weights
  useEffect(() => {
    if (!user) return;
    const names = exercises.map((e) => e.name);
    supabase
      .from("workout_set_logs")
      .select("exercise_name, weight_kg, created_at")
      .eq("user_id", user.id)
      .in("exercise_name", names)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, number> = {};
        for (const row of data) {
          if (!map[row.exercise_name] && Number(row.weight_kg) > 0) {
            map[row.exercise_name] = Number(row.weight_kg);
          }
        }
        setLastWeights(map);
        // Pre-fill weights
        setEntries((prev) => {
          const next = { ...prev };
          for (const name of Object.keys(next)) {
            if (map[name]) {
              next[name] = next[name].map((s) => ({
                ...s,
                weightKg: s.weightKg || String(map[name]),
              }));
            }
          }
          return next;
        });
      });
  }, [user, exercises]);

  const updateEntry = useCallback(
    (exerciseName: string, setIdx: number, field: keyof SetEntry, value: string) => {
      setEntries((prev) => {
        const next = { ...prev };
        next[exerciseName] = [...next[exerciseName]];
        next[exerciseName][setIdx] = { ...next[exerciseName][setIdx], [field]: value };
        return next;
      });
    },
    []
  );

  const hasAnyData = Object.values(entries).some((sets) =>
    sets.some((s) => s.weightKg || s.repsDone)
  );

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      // Create a manual session
      const { data: session, error: sessionErr } = await supabase
        .from("active_workout_sessions")
        .insert({
          user_id: user.id,
          workout_name: workoutName,
          status: "finished",
          ended_at: new Date().toISOString(),
          total_duration_seconds: 0,
        })
        .select("id")
        .single();

      if (sessionErr) throw sessionErr;

      // Insert all set logs
      const setLogs: any[] = [];
      for (const ex of exercises) {
        const sets = entries[ex.name] || [];
        sets.forEach((s, idx) => {
          if (s.weightKg || s.repsDone) {
            setLogs.push({
              user_id: user.id,
              session_id: session.id,
              exercise_name: ex.name,
              set_number: idx + 1,
              weight_kg: parseFloat(s.weightKg) || 0,
              reps_done: parseInt(s.repsDone) || 0,
              rest_seconds: 0,
              rest_respected: true,
            });
          }
        });
      }

      if (setLogs.length > 0) {
        await supabase.from("workout_set_logs").insert(setLogs);
      }

      queryClient.invalidateQueries({ queryKey: ["workout-completions"] });
      toast.success("Cargas registradas com sucesso!");
      onComplete(0, session.id);
    } catch (err) {
      console.error("[ManualSetLogger] Error:", err);
      toast.error("Erro ao salvar cargas. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-sm font-bold text-foreground uppercase">
            Registrar Cargas
          </h2>
          <p className="text-xs text-muted-foreground">{workoutName}</p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground px-1">
        Anote o peso e repetições de cada série. Campos vazios serão ignorados.
      </p>

      {/* Exercise entries */}
      <div className="space-y-3">
        {exercises.map((ex) => (
          <Card key={ex.name} className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground truncate">
                {ex.name}
              </h3>
              <span className="text-[10px] text-muted-foreground shrink-0">
                {ex.sets}x{ex.reps}
              </span>
            </div>

            {lastWeights[ex.name] && (
              <p className="text-[10px] text-muted-foreground">
                Última carga: {lastWeights[ex.name]}kg
              </p>
            )}

            <div className="space-y-1.5">
              <div className="grid grid-cols-[auto_1fr_1fr] gap-2 items-center text-[10px] text-muted-foreground px-0.5">
                <span className="w-8">Série</span>
                <span>Peso (kg)</span>
                <span>Reps</span>
              </div>
              {(entries[ex.name] || []).map((set, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-[auto_1fr_1fr] gap-2 items-center"
                >
                  <span className="w-8 text-xs text-muted-foreground text-center font-medium">
                    {idx + 1}
                  </span>
                  <Input
                    type="number"
                    inputMode="decimal"
                    placeholder="0"
                    value={set.weightKg}
                    onChange={(e) =>
                      updateEntry(ex.name, idx, "weightKg", e.target.value)
                    }
                    className="h-9 text-sm"
                  />
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder="0"
                    value={set.repsDone}
                    onChange={(e) =>
                      updateEntry(ex.name, idx, "repsDone", e.target.value)
                    }
                    className="h-9 text-sm"
                  />
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Save button */}
      <Button
        variant="fire"
        size="lg"
        className="w-full"
        disabled={saving || !hasAnyData}
        onClick={handleSave}
      >
        {saving ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Save className="w-4 h-4 mr-2" />
        )}
        Salvar e Concluir Treino
      </Button>
    </div>
  );
}
