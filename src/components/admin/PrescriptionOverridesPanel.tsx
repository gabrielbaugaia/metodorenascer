import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { MUSCLE_LABELS } from "@/lib/prescription/labels";
import type { MuscleKey, MusclePriority } from "@/lib/prescription/types";

interface StudentRow { id: string; full_name: string | null; email: string | null }

interface MuscleLock {
  lockedSets?: number | null;
  minSets?: number | null;
  maxSets?: number | null;
  priority?: MusclePriority | null;
  lockedFrequency?: number | null;
}

const MUSCLES = Object.keys(MUSCLE_LABELS) as MuscleKey[];
const PRIORITIES: MusclePriority[] = ["alta", "desenvolvimento", "manutencao", "reduzir"];
const PRIORITY_LABEL: Record<MusclePriority, string> = {
  alta: "Foco",
  desenvolvimento: "Normal",
  manutencao: "Manter",
  reduzir: "Reduzir",
};

const num = (v: string): number | null => (v.trim() === "" ? null : Number(v));

export function PrescriptionOverridesPanel() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [studentId, setStudentId] = useState("");
  const [locks, setLocks] = useState<Partial<Record<MuscleKey, MuscleLock>>>({});
  const [lockedFrequency, setLockedFrequency] = useState("");
  const [excluded, setExcluded] = useState("");
  const [lockedExercises, setLockedExercises] = useState("");
  const [deload, setDeload] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .order("full_name", { ascending: true })
      .limit(300)
      .then(({ data }) => setStudents((data as StudentRow[]) || []));
  }, []);

  useEffect(() => {
    if (!studentId) return;
    supabase
      .from("prescription_overrides")
      .select("*")
      .eq("user_id", studentId)
      .maybeSingle()
      .then(({ data }) => {
        const row = data as Record<string, any> | null;
        setLocks((row?.muscle_locks as Partial<Record<MuscleKey, MuscleLock>>) || {});
        setLockedFrequency(row?.locked_frequency ? String(row.locked_frequency) : "");
        setExcluded((row?.excluded_exercises || []).join(", "));
        setLockedExercises((row?.locked_exercises || []).join(", "));
        setDeload(row?.deload_directive || "");
        setNotes(row?.notes || "");
      });
  }, [studentId]);

  const setLock = (muscle: MuscleKey, patch: MuscleLock) => {
    setLocks((prev) => {
      const next = { ...prev, [muscle]: { ...prev[muscle], ...patch } };
      const entries = Object.entries(next[muscle] as MuscleLock).filter(([, v]) => v !== null && v !== undefined);
      if (entries.length === 0) delete next[muscle];
      return next;
    });
  };

  const save = async () => {
    if (!studentId) return;
    setSaving(true);
    const { data: authData } = await supabase.auth.getUser();
    const { error } = await supabase.from("prescription_overrides").upsert(
      {
        user_id: studentId,
        muscle_locks: locks,
        locked_frequency: lockedFrequency ? Number(lockedFrequency) : null,
        excluded_exercises: excluded.split(",").map((s) => s.trim()).filter(Boolean),
        locked_exercises: lockedExercises.split(",").map((s) => s.trim()).filter(Boolean),
        deload_directive: deload || null,
        notes: notes || null,
        updated_by: authData.user?.id ?? null,
      } as never,
      { onConflict: "user_id" },
    );
    setSaving(false);
    if (error) { toast.error("Não foi possível salvar as travas."); return; }
    toast.success("Travas do treinador salvas. Elas têm prioridade sobre o motor.");
  };

  const clearAll = async () => {
    if (!studentId) return;
    if (!window.confirm("Remover todas as travas deste aluno?")) return;
    const { error } = await supabase.from("prescription_overrides").delete().eq("user_id", studentId);
    if (error) { toast.error("Não foi possível remover."); return; }
    setLocks({}); setLockedFrequency(""); setExcluded(""); setLockedExercises(""); setDeload(""); setNotes("");
    toast.success("Travas removidas.");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Travas do treinador</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            O que você define aqui vence o motor e a IA em qualquer geração. Deixe em branco o que o motor deve decidir.
          </p>
          <Select value={studentId} onValueChange={setStudentId}>
            <SelectTrigger className="h-11 sm:max-w-md" aria-label="Selecionar aluno">
              <SelectValue placeholder="Selecione o aluno" />
            </SelectTrigger>
            <SelectContent>
              {students.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.full_name || s.email || s.id}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {studentId && (
        <>
          <Card>
            <CardHeader><CardTitle className="text-base">Por grupo muscular</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead className="text-muted-foreground text-xs uppercase tracking-wide">
                  <tr className="text-left">
                    <th className="py-2 pr-3">Grupo</th>
                    <th className="py-2 pr-3">Séries travadas</th>
                    <th className="py-2 pr-3">Mínimo</th>
                    <th className="py-2 pr-3">Máximo</th>
                    <th className="py-2 pr-3">Frequência</th>
                    <th className="py-2">Prioridade</th>
                  </tr>
                </thead>
                <tbody>
                  {MUSCLES.map((m) => {
                    const lock = locks[m] || {};
                    return (
                      <tr key={m} className="border-t border-border/60">
                        <td className="py-2 pr-3">{MUSCLE_LABELS[m]}</td>
                        <td className="py-2 pr-3">
                          <Input type="number" min={0} max={40} className="h-10 w-20"
                            aria-label={`Séries travadas de ${MUSCLE_LABELS[m]}`}
                            value={lock.lockedSets ?? ""}
                            onChange={(e) => setLock(m, { lockedSets: num(e.target.value) })} />
                        </td>
                        <td className="py-2 pr-3">
                          <Input type="number" min={0} max={40} className="h-10 w-20"
                            aria-label={`Mínimo de ${MUSCLE_LABELS[m]}`}
                            value={lock.minSets ?? ""}
                            onChange={(e) => setLock(m, { minSets: num(e.target.value) })} />
                        </td>
                        <td className="py-2 pr-3">
                          <Input type="number" min={0} max={40} className="h-10 w-20"
                            aria-label={`Máximo de ${MUSCLE_LABELS[m]}`}
                            value={lock.maxSets ?? ""}
                            onChange={(e) => setLock(m, { maxSets: num(e.target.value) })} />
                        </td>
                        <td className="py-2 pr-3">
                          <Input type="number" min={1} max={7} className="h-10 w-20"
                            aria-label={`Frequência de ${MUSCLE_LABELS[m]}`}
                            value={lock.lockedFrequency ?? ""}
                            onChange={(e) => setLock(m, { lockedFrequency: num(e.target.value) })} />
                        </td>
                        <td className="py-2">
                          <Select
                            value={lock.priority ?? "auto"}
                            onValueChange={(v) => setLock(m, { priority: v === "auto" ? null : (v as MusclePriority) })}
                          >
                            <SelectTrigger className="h-10 w-36" aria-label={`Prioridade de ${MUSCLE_LABELS[m]}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="auto">Motor decide</SelectItem>
                              {PRIORITIES.map((p) => (
                                <SelectItem key={p} value={p}>{PRIORITY_LABEL[p]}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Regras gerais</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ov-freq">Frequência semanal travada</Label>
                  <Input id="ov-freq" type="number" min={1} max={7} className="h-11"
                    value={lockedFrequency} onChange={(e) => setLockedFrequency(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ov-deload">Semana de descarga</Label>
                  <Select value={deload || "auto"} onValueChange={(v) => setDeload(v === "auto" ? "" : v)}>
                    <SelectTrigger id="ov-deload" className="h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Motor decide</SelectItem>
                      <SelectItem value="forcar">Forçar descarga</SelectItem>
                      <SelectItem value="ignorar">Ignorar sugestão</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ov-excl">Exercícios que não devem ser usados (separados por vírgula)</Label>
                <Textarea id="ov-excl" value={excluded} onChange={(e) => setExcluded(e.target.value)} rows={2} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ov-lock">Exercícios obrigatórios (separados por vírgula)</Label>
                <Textarea id="ov-lock" value={lockedExercises} onChange={(e) => setLockedExercises(e.target.value)} rows={2} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ov-notes">Observações internas</Label>
                <Textarea id="ov-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button className="min-h-11" onClick={save} disabled={saving}>
                  {saving ? "Salvando..." : "Salvar travas"}
                </Button>
                <Button variant="outline" className="min-h-11" onClick={clearAll}>Remover todas</Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
