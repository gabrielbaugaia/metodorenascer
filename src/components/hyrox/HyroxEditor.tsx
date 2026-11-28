import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { emptyConfig, schedule90, type ProgramConfig } from "@/lib/hyrox90";
import type { Program } from "@/hooks/useHyrox90";
import type { Json } from "@/integrations/supabase/types";
export function HyroxEditor({
  program,
  userId,
  name,
  onSaved,
}: {
  program?: Program;
  userId: string;
  name: string;
  onSaved: (id: string) => Promise<void>;
}) {
  const { user } = useAuth();
  const [title, setTitle] = useState(program?.title ?? `${name} — HYROX 90`);
  const [start, setStart] = useState(program?.start_date ?? "2026-12-01");
  const [config, setConfig] = useState<ProgramConfig>(
    program?.config ?? emptyConfig(),
  );
  const [consent, setConsent] = useState(!!program?.consent_at);
  const [busy, setBusy] = useState(false);
  const editWorkout = (index: number, key: string, value: unknown) =>
    setConfig((c) => ({
      ...c,
      workouts: c.workouts.map((w, i) =>
        i === index ? { ...w, [key]: value } : w,
      ),
    }));
  async function save() {
    if (!user || !title.trim() || !start || !consent)
      return toast.error(
        "Informe título, início e autorização de uso privado.",
      );
    if (
      config.workouts.some(
        (w) =>
          !w.name.trim() ||
          w.exercises.some(
            (e) =>
              !e.name.trim() ||
              !Number.isInteger(e.sets) ||
              e.sets < 1 ||
              e.sets > 10,
          ),
      )
    )
      return toast.error("Confira nomes e séries (1–10).");
    setBusy(true);
    try {
      const payload = {
        title: title.trim(),
        start_date: start,
        config: config as unknown as Json,
      };
      let id: string;
      if (program?.status === "draft") {
        const { data, error } = await supabase.rpc("hyrox_save_draft", {
          _id: program.id,
          _title: payload.title,
          _start: start,
          _config: payload.config,
        });
        if (error || !data) throw error;
        id = data;
      } else {
        const { data, error } = await supabase
          .from("hyrox_programs")
          .insert({
            ...payload,
            user_id: userId,
            created_by: user.id,
            consent_at: new Date().toISOString(),
            supersedes_id: program?.id ?? null,
          })
          .select("id")
          .single();
        if (error || !data) throw error;
        id = data.id;
      }
      await onSaved(id);
      toast.success("Rascunho salvo; ainda não liberado ao aluno.");
    } catch {
      toast.error("Não foi possível salvar o rascunho.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="space-y-6">
      <h2 className="section-title">
        {program?.status === "published"
          ? "Nova versão para revisão"
          : "Prescrição para revisão"}
      </h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="space-y-2">
          <Label>Título do protocolo</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="space-y-2">
          <Label>Início do protocolo</Label>
          <Input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </label>
      </div>
      <label className="space-y-2 block">
        <Label>Objetivos e provas confirmadas / pendentes</Label>
        <Textarea
          value={config.goal}
          onChange={(e) => setConfig((c) => ({ ...c, goal: e.target.value }))}
        />
      </label>
      <div className="grid md:grid-cols-3 gap-5">
        {config.phases.map((phase, i) => (
          <div key={i} className="space-y-3">
            <Label>
              Fase {i + 1} · dias {i * 30 + 1}–{(i + 1) * 30}
            </Label>
            <Input
              value={phase.name}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  phases: c.phases.map((p, j) =>
                    j === i ? { ...p, name: e.target.value } : p,
                  ),
                }))
              }
            />
            <Textarea
              rows={4}
              value={phase.guidance}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  phases: c.phases.map((p, j) =>
                    j === i ? { ...p, guidance: e.target.value } : p,
                  ),
                }))
              }
            />
          </div>
        ))}
      </div>
      {config.workouts.map((workout, i) => (
        <section
          key={workout.key}
          className="border-t border-border pt-6 space-y-4"
        >
          <div className="flex gap-3 items-center">
            <Input
              aria-label={`Nome do treino ${i + 1}`}
              value={workout.name}
              onChange={(e) => editWorkout(i, "name", e.target.value)}
            />
            <Button
              size="icon"
              variant="ghost"
              title="Remover treino"
              aria-label="Remover treino"
              onClick={() => {
                if (confirm("Remover este treino do rascunho?"))
                  setConfig((c) => ({
                    ...c,
                    workouts: c.workouts.filter((_, j) => j !== i),
                    schedule: c.schedule.filter(
                      (s) => s.workout_key !== workout.key,
                    ),
                  }));
              }}
            >
              <Trash2 />
            </Button>
          </div>
          <Textarea
            aria-label={`Orientações do treino ${i + 1}`}
            value={workout.instructions}
            onChange={(e) => editWorkout(i, "instructions", e.target.value)}
          />
          {workout.exercises.map((ex, j) => (
            <div
              key={ex.id}
              className="grid grid-cols-2 sm:grid-cols-6 gap-3 border-b border-border pb-4"
            >
              <label className="col-span-2 space-y-1">
                <Label>Exercício</Label>
                <Input
                  value={ex.name}
                  onChange={(e) =>
                    editWorkout(
                      i,
                      "exercises",
                      workout.exercises.map((x, k) =>
                        k === j ? { ...x, name: e.target.value } : x,
                      ),
                    )
                  }
                />
              </label>
              {(["sets", "reps", "rir", "rest"] as const).map((k) => (
                <label key={k} className="space-y-1">
                  <Label>
                    {k === "sets"
                      ? "Séries"
                      : k === "reps"
                        ? "Repetições"
                        : k === "rir"
                          ? "RIR"
                          : "Pausa"}
                  </Label>
                  <Input
                    type={k === "sets" ? "number" : "text"}
                    min={1}
                    max={10}
                    value={ex[k]}
                    onChange={(e) =>
                      editWorkout(
                        i,
                        "exercises",
                        workout.exercises.map((x, l) =>
                          l === j
                            ? {
                                ...x,
                                [k]:
                                  k === "sets"
                                    ? Number(e.target.value)
                                    : e.target.value,
                              }
                            : x,
                        ),
                      )
                    }
                  />
                </label>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  editWorkout(
                    i,
                    "exercises",
                    workout.exercises.filter((_, k) => k !== j),
                  )
                }
              >
                <Trash2 />
                Remover exercício
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            onClick={() =>
              editWorkout(i, "exercises", [
                ...workout.exercises,
                {
                  id: crypto.randomUUID(),
                  name: "",
                  sets: 2,
                  reps: "",
                  rir: "",
                  rest: "",
                },
              ])
            }
          >
            <Plus />
            Adicionar exercício
          </Button>
        </section>
      ))}
      <Button
        variant="outline"
        onClick={() =>
          setConfig((c) => ({
            ...c,
            workouts: [
              ...c.workouts,
              {
                key: crypto.randomUUID(),
                name: "",
                instructions: "",
                exercises: [],
              },
            ],
          }))
        }
      >
        <Plus />
        Adicionar treino
      </Button>
      <section className="border-t border-border pt-5 space-y-4">
        <h3 className="section-title">Agenda semanal de referência</h3>
        {config.schedule.map((s, i) => (
          <div key={i} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <select
              aria-label={`Dia da sessão ${i + 1}`}
              className="h-10 border border-input rounded-md bg-background px-2"
              value={s.weekday}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  schedule: c.schedule.map((x, j) =>
                    j === i ? { ...x, weekday: Number(e.target.value) } : x,
                  ),
                }))
              }
            >
              {[
                "Domingo",
                "Segunda",
                "Terça",
                "Quarta",
                "Quinta",
                "Sexta",
                "Sábado",
              ].map((v, k) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <Input
              aria-label={`Horário da sessão ${i + 1}`}
              type="time"
              value={s.time}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  schedule: c.schedule.map((x, j) =>
                    j === i ? { ...x, time: e.target.value } : x,
                  ),
                }))
              }
            />
            <select
              aria-label={`Modalidade da sessão ${i + 1}`}
              className="h-10 border border-input rounded-md bg-background px-2"
              value={s.workout_key ?? s.kind}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  schedule: c.schedule.map((x, j) =>
                    j === i
                      ? {
                          ...x,
                          kind: ["running", "hyrox"].includes(e.target.value)
                            ? (e.target.value as "running" | "hyrox")
                            : "strength",
                          workout_key: ["running", "hyrox"].includes(
                            e.target.value,
                          )
                            ? undefined
                            : e.target.value,
                        }
                      : x,
                  ),
                }))
              }
            >
              <option value="running">Corrida externa</option>
              <option value="hyrox">HYROX externo</option>
              {config.workouts.map((w) => (
                <option key={w.key} value={w.key}>
                  {w.name || "Treino sem nome"}
                </option>
              ))}
            </select>
            <Button
              variant="ghost"
              onClick={() =>
                setConfig((c) => ({
                  ...c,
                  schedule: c.schedule.filter((_, j) => j !== i),
                }))
              }
            >
              <Trash2 />
              Remover
            </Button>
          </div>
        ))}
        <Button
          variant="outline"
          onClick={() =>
            setConfig((c) => ({
              ...c,
              schedule: [
                ...c.schedule,
                { weekday: 1, time: "07:00", kind: "running" },
              ],
            }))
          }
        >
          <Plus />
          Adicionar sessão à agenda
        </Button>
        <p className="text-sm text-muted-foreground">
          Agenda de referência; corrida e HYROX mantêm a prescrição dos
          respectivos treinadores.
        </p>
      </section>
      <label className="space-y-2 block">
        <Label>Orientações externas e rotina flexível</Label>
        <Textarea
          rows={4}
          value={config.external_notes}
          onChange={(e) =>
            setConfig((c) => ({ ...c, external_notes: e.target.value }))
          }
        />
      </label>
      <label className="space-y-2 block">
        <Label>Cuidados e encaminhamentos</Label>
        <Textarea
          value={config.safety}
          onChange={(e) => setConfig((c) => ({ ...c, safety: e.target.value }))}
        />
      </label>
      <label className="space-y-2 block max-w-[220px]">
        <Label>Duração</Label>
        <select
          className="h-10 w-full rounded-md border border-input bg-background px-3"
          value={config.duration_days ?? 90}
          onChange={(e) => setConfig((c) => ({ ...c, duration_days: Number(e.target.value) as 30 | 60 | 90 }))}
        >
          <option value={30}>30 dias</option>
          <option value={60}>60 dias</option>
          <option value={90}>90 dias</option>
        </select>
      </label>
      <label className="space-y-2 block">
        <Label>Orientações do treinador ao aluno</Label>
        <Textarea
          value={config.trainer_guidance ?? ""}
          onChange={(e) => setConfig((c) => ({ ...c, trainer_guidance: e.target.value }))}
        />
      </label>
      <section className="space-y-3">
        <Label>Períodos especiais (ex.: Natal e Ano Novo)</Label>
        {(config.special_periods ?? []).map((sp, i) => {
          const set = (k: string, v: string) =>
            setConfig((c) => ({
              ...c,
              special_periods: (c.special_periods ?? []).map((x, j) => (j === i ? { ...x, [k]: v } : x)),
            }));
          return (
            <div key={i} className="grid sm:grid-cols-3 gap-2 border-b border-border pb-3">
              <Input placeholder="Título" value={sp.title} onChange={(e) => set("title", e.target.value)} />
              <Input type="date" value={sp.start} onChange={(e) => set("start", e.target.value)} />
              <Input type="date" value={sp.end} onChange={(e) => set("end", e.target.value)} />
              <Textarea className="sm:col-span-3" placeholder="Orientações exibidas ao aluno" value={sp.guidance} onChange={(e) => set("guidance", e.target.value)} />
              <Button variant="ghost" size="sm" className="justify-self-start" onClick={() => setConfig((c) => ({ ...c, special_periods: (c.special_periods ?? []).filter((_, j) => j !== i) }))}>
                <Trash2 /> Remover período
              </Button>
            </div>
          );
        })}
        <Button variant="outline" size="sm" onClick={() => setConfig((c) => ({ ...c, special_periods: [...(c.special_periods ?? []), { title: "", start: start, end: start, guidance: "" }] }))}>
          <Plus /> Adicionar período
        </Button>
      </section>
      <label className="flex gap-3 items-center text-sm">
        <Checkbox
          checked={consent}
          onCheckedChange={(v) => setConsent(v === true)}
        />
        O aluno autorizou o tratamento privado dos documentos e dados.
      </label>
      <Button disabled={busy} onClick={save}>
        <Save />
        Salvar rascunho
      </Button>
    </section>
  );
}
