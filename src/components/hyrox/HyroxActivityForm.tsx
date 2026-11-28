import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { useWakeLock } from "@/hooks/useWakeLock";
import type { Activity, Program } from "@/hooks/useHyrox90";
import {
  blankSets,
  kindLabel,
  validateSets,
  type SetEntry,
} from "@/lib/hyrox90";
import type { Json } from "@/integrations/supabase/types";
export function HyroxActivityForm({
  activity,
  program,
  close,
  refresh,
}: {
  activity: Activity;
  program: Program;
  close: () => void;
  refresh: () => Promise<void>;
}) {
  const [form, setForm] = useState({
    ...activity,
    actual_date: activity.actual_date ?? activity.planned_date,
  });
  const workout = program.config.workouts.find(
    (w) => w.key === activity.workout_key,
  );
  const [entries, setEntries] = useState<SetEntry[]>(
    Array.isArray(activity.set_entries) && activity.set_entries.length
      ? (activity.set_entries as unknown as SetEntry[])
      : blankSets(workout),
  );
  const [busy, setBusy] = useState(false);
  useWakeLock(activity.kind === "strength");
  function update(k: keyof typeof form, value: unknown) {
    setForm((f) => ({ ...f, [k]: value }));
  }
  async function save(completed = false) {
    setBusy(true);
    try {
      validateSets(entries);
      const { error } = await supabase
        .from("hyrox_activities")
        .update({
          planned_date: form.planned_date,
          planned_time: form.planned_time,
          actual_date: completed
            ? form.actual_date
            : form.status === "completed"
              ? form.actual_date
              : null,
          status: completed ? "completed" : form.status,
          duration_min: form.duration_min,
          distance_km: form.distance_km,
          pace: form.pace,
          heart_rate: form.heart_rate,
          rpe: form.rpe,
          sleep_hours: form.sleep_hours,
          energy: form.energy,
          fatigue: form.fatigue,
          discomfort: form.discomfort,
          notes: form.notes,
          station_notes: form.station_notes,
          set_entries: entries as unknown as Json,
        })
        .eq("id", activity.id);
      if (error) throw error;
      await refresh();
      toast.success(
        completed ? "Treino concluído e registrado." : "Registro salvo.",
      );
      if (completed) close();
    } catch (e) {
      toast.error(
        e instanceof Error && e.message.startsWith("Confira")
          ? e.message
          : "Não foi possível salvar. Seus campos continuam nesta tela.",
      );
    } finally {
      setBusy(false);
    }
  }
  const numberField = (
    key: keyof typeof form,
    label: string,
    min: number,
    max?: number,
  ) => (
    <label className="space-y-2">
      <Label>{label}</Label>
      <Input
        type="number"
        min={min}
        max={max}
        step="any"
        value={(form[key] as number) ?? ""}
        onChange={(e) =>
          update(key, e.target.value === "" ? null : Number(e.target.value))
        }
      />
    </label>
  );
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (
          !open &&
          window.confirm(
            "Fechar este registro? Salve antes para manter suas anotações.",
          )
        )
          close();
      }}
    >
      <DialogContent className="max-w-3xl max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{workout?.name ?? kindLabel[activity.kind]}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="grid sm:grid-cols-3 gap-4">
            <label className="space-y-2">
              <Label>Data planejada</Label>
              <Input
                type="date"
                value={form.planned_date}
                onChange={(e) => update("planned_date", e.target.value)}
              />
            </label>
            <label className="space-y-2">
              <Label>Horário planejado</Label>
              <Input
                type="time"
                value={form.planned_time ?? ""}
                onChange={(e) => update("planned_time", e.target.value || null)}
              />
            </label>
            <label className="space-y-2">
              <Label>Data realizada</Label>
              <Input
                type="date"
                value={form.actual_date}
                onChange={(e) => update("actual_date", e.target.value)}
              />
            </label>
          </div>
          <label className="space-y-2 block">
            <Label>Situação do treino</Label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3"
              value={form.status}
              onChange={(e) => update("status", e.target.value)}
            >
              <option value="planned">Planejado</option>
              <option value="completed">Realizado</option>
              <option value="planned_absence">
                Ausência planejada / férias
              </option>
            </select>
          </label>
          {workout && (
            <>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {workout.instructions}
              </p>
              {workout.exercises.map((ex) => (
                <section
                  key={ex.id}
                  className="border-t border-border pt-4 space-y-3"
                >
                  <h3 className="font-medium">{ex.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    Planejado: {ex.sets} × {ex.reps} · RIR {ex.rir} · pausa{" "}
                    {ex.rest}
                  </p>
                  {entries.map(
                    (entry, i) =>
                      entry.exercise_id === ex.id && (
                        <div
                          key={`${entry.exercise_id}-${entry.set}`}
                          className="border-b border-border pb-4 space-y-2"
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              id={`done-${i}`}
                              checked={entry.done}
                              onCheckedChange={(v) =>
                                setEntries((all) =>
                                  all.map((e, j) =>
                                    j === i ? { ...e, done: v === true } : e,
                                  ),
                                )
                              }
                            />
                            <Label htmlFor={`done-${i}`}>
                              Série {entry.set} realizada
                            </Label>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {(["weight", "reps", "rir"] as const).map((k) => (
                              <label key={k} className="space-y-1">
                                <span className="text-xs text-muted-foreground">
                                  {k === "weight"
                                    ? "Carga (kg)"
                                    : k === "reps"
                                      ? "Repetições"
                                      : "RIR (opcional)"}
                                </span>
                                <Input
                                  aria-label={`${ex.name} série ${entry.set} ${k === "weight" ? "carga" : k === "reps" ? "repetições" : "RIR"}`}
                                  type="number"
                                  min={0}
                                  max={k === "rir" ? 10 : undefined}
                                  step={k === "reps" ? 1 : "any"}
                                  value={entry[k] ?? ""}
                                  onChange={(ev) =>
                                    setEntries((all) =>
                                      all.map((e, j) =>
                                        j === i
                                          ? {
                                              ...e,
                                              [k]:
                                                ev.target.value === ""
                                                  ? null
                                                  : Number(ev.target.value),
                                            }
                                          : e,
                                      ),
                                    )
                                  }
                                />
                              </label>
                            ))}
                          </div>
                          <Input
                            aria-label={`${ex.name} série ${entry.set} observação`}
                            placeholder="Observação da série"
                            value={entry.note}
                            onChange={(ev) =>
                              setEntries((all) =>
                                all.map((e, j) =>
                                  j === i ? { ...e, note: ev.target.value } : e,
                                ),
                              )
                            }
                          />
                        </div>
                      ),
                  )}
                </section>
              ))}
            </>
          )}
          {activity.kind !== "strength" && (
            <p className="text-sm text-muted-foreground">
              Registro declarado do treino realizado; mantenha a prescrição do
              seu treinador.
            </p>
          )}
          <h3 className="section-title">Como foi o treino?</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {numberField("duration_min", "Duração (min)", 1)}
            {numberField("rpe", "Esforço — RPE (0–10)", 0, 10)}
            {numberField("sleep_hours", "Sono (horas)", 0, 24)}
            {numberField("energy", "Energia (1–5)", 1, 5)}
            {numberField("fatigue", "Fadiga (1–5)", 1, 5)}
            {activity.kind === "running" && (
              <>
                {numberField("distance_km", "Distância (km)", 0.01)}
                {numberField("heart_rate", "FC média (bpm)", 20, 250)}
                <label className="space-y-2">
                  <Label>Pace (min/km)</Label>
                  <Input
                    value={form.pace ?? ""}
                    placeholder="5:40"
                    onChange={(e) => update("pace", e.target.value)}
                  />
                </label>
              </>
            )}
          </div>
          {activity.kind === "hyrox" && (
            <label className="space-y-2 block">
              <Label>Estações, tempos, Burpees e Wall Balls</Label>
              <Textarea
                value={form.station_notes}
                onChange={(e) => update("station_notes", e.target.value)}
              />
            </label>
          )}
          <label className="space-y-2 block">
            <Label>Dor ou desconforto</Label>
            <Textarea
              value={form.discomfort}
              onChange={(e) => update("discomfort", e.target.value)}
            />
          </label>
          <label className="space-y-2 block">
            <Label>Dificuldades e observações para Gabriel</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" disabled={busy} onClick={() => save()}>
              <Save />
              Salvar registro
            </Button>
            <Button
              disabled={busy || form.status === "planned_absence"}
              onClick={() => save(true)}
            >
              Concluir treino
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
