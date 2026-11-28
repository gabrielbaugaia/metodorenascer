import { useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import type { Activity, Program } from "@/hooks/useHyrox90";
import { checkinAlerts, dateBR, durationOf, dayDate } from "@/lib/hyrox90";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const scales = [
  ["sleep_quality", "Qualidade do sono"],
  ["energy", "Energia"],
  ["fatigue", "Fadiga muscular"],
  ["recovery", "Recuperação"],
  ["difficulty", "Dificuldade nos treinos"],
] as const;
type Key = (typeof scales)[number][0];

export function HyroxCheckin({
  program,
  activities,
  admin,
  canRecord,
  refresh,
}: {
  program: Program;
  activities: Activity[];
  admin: boolean;
  canRecord: boolean;
  refresh: () => Promise<void>;
}) {
  const today = format(new Date(), "yyyy-MM-dd");
  const end = dayDate(program.start_date, durationOf(program.config));
  const within = today >= program.start_date && today <= end;
  const checkins = activities
    .filter((a) => a.kind === "checkin")
    .sort((a, b) => b.planned_date.localeCompare(a.planned_date));
  const [vals, setVals] = useState<Record<Key, number | null>>({
    sleep_quality: null,
    energy: null,
    fatigue: null,
    recovery: null,
    difficulty: null,
  });
  const [weight, setWeight] = useState("");
  const [discomfort, setDiscomfort] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const done = checkins.some((c) => c.planned_date === today);

  async function send() {
    if (scales.some(([k]) => vals[k] === null))
      return toast.error("Toque em uma nota para cada item.");
    setBusy(true);
    try {
      const { error } = await supabase.from("hyrox_activities").insert({
        program_id: program.id,
        kind: "checkin",
        planned_date: today,
        actual_date: today,
        status: "completed",
        weight_kg: weight ? Number(weight) : null,
        ...vals,
        discomfort,
        notes,
      });
      if (error) throw error;
      await refresh();
      toast.success("Check-in enviado ao Gabriel.");
    } catch {
      toast.error("Não foi possível enviar o check-in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-6">
      {!admin && canRecord && program.status === "published" && within && !done && (
        <div className="space-y-5 border-b border-border pb-6">
          <p className="text-sm text-muted-foreground">
            1 = muito baixo · 5 = muito alto. Leva menos de um minuto.
          </p>
          <label className="space-y-2 block max-w-[200px]">
            <Label>Peso corporal (kg)</Label>
            <Input type="number" step="0.1" min={20} value={weight} onChange={(e) => setWeight(e.target.value)} />
          </label>
          {scales.map(([k, label]) => (
            <div key={k} className="space-y-2">
              <Label>{label}</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Button
                    key={n}
                    type="button"
                    variant={vals[k] === n ? "default" : "outline"}
                    className="h-11 w-11 p-0"
                    aria-pressed={vals[k] === n}
                    aria-label={`${label} ${n}`}
                    onClick={() => setVals((v) => ({ ...v, [k]: n }))}
                  >
                    {n}
                  </Button>
                ))}
              </div>
            </div>
          ))}
          <label className="space-y-2 block">
            <Label>Dores ou desconfortos</Label>
            <Textarea rows={2} value={discomfort} onChange={(e) => setDiscomfort(e.target.value)} />
          </label>
          <label className="space-y-2 block">
            <Label>Observações</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
          <Button disabled={busy} onClick={send}>Enviar check-in</Button>
        </div>
      )}
      {done && !admin && (
        <p className="text-sm text-muted-foreground">Check-in de hoje enviado. Obrigado.</p>
      )}
      <ul className="divide-y divide-border">
        {!checkins.length && (
          <li className="py-4 text-sm text-muted-foreground">Nenhum check-in enviado ainda.</li>
        )}
        {checkins.map((c) => {
          const alerts = checkinAlerts({
            fatigue: c.fatigue,
            recovery: c.recovery,
            discomfort: c.discomfort,
            difficulty: c.difficulty,
          });
          return (
            <li key={c.id} className="py-4 text-sm space-y-1">
              <p className="font-medium">{dateBR(c.planned_date)}{c.weight_kg ? ` · ${c.weight_kg} kg` : ""}</p>
              <p className="text-muted-foreground">
                Sono {c.sleep_quality ?? "—"} · Energia {c.energy ?? "—"} · Fadiga {c.fatigue ?? "—"} · Recuperação {c.recovery ?? "—"} · Dificuldade {c.difficulty ?? "—"}
              </p>
              {c.discomfort && <p>Desconforto: {c.discomfort}</p>}
              {c.notes && <p className="text-muted-foreground">{c.notes}</p>}
              {admin && alerts.length > 0 && (
                <p className="text-primary">{alerts.join(" · ")}</p>
              )}
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-muted-foreground">
        Os check-ins orientam a conversa com o treinador. Não fazem diagnóstico e não alteram a prescrição.
      </p>
    </section>
  );
}
