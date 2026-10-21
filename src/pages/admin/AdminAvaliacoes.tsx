import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Loader2, Plus, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  CALC_METHOD, CALC_VERSION, CIRCUMFERENCES, PHOTO_POSITIONS, SKINFOLDS, ageAt, calculateAssessment, fmt,
  parseDecimal, validateForm, type FormValues, type PhotoPosition,
} from "@/lib/physicalAssessment";
import { ASSESSMENT_BUCKET, assessmentKeys, useAssessmentPhotos, useAssessments, type AssessmentRow } from "@/hooks/usePhysicalAssessments";
import { AssessmentSummary, ComparisonPanel, EvolutionCharts, dateBR } from "@/components/assessment/AssessmentEvolution";

const db = supabase as any;
const STATUS: Record<AssessmentRow["status"], string> = { draft: "Rascunho", published: "Publicada", unpublished: "Despublicada", superseded: "Substituída" };

const toStr = (n: number | null | undefined) => (n == null ? "" : String(n).replace(".", ","));
function toForm(a: AssessmentRow): FormValues {
  return {
    assessed_at: a.assessed_at, birth_date: a.birth_date ?? "", sex: a.sex ?? "",
    weight: toStr(a.weight_kg), height: toStr(a.height_cm),
    skinfolds: Object.fromEntries(SKINFOLDS.map((s) => [s.key, toStr(a.skinfolds?.[s.key])])),
    circumferences: Object.fromEntries(CIRCUMFERENCES.map((c) => [c.key, toStr(a.circumferences?.[c.key])])),
  };
}
function mapSex(v: string | null | undefined): "male" | "female" | null {
  const s = (v ?? "").toLowerCase();
  if (s.startsWith("m")) return "male";
  if (s.startsWith("f")) return "female";
  return null;
}

export default function AdminAvaliacoes() {
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const studentId = params.get("aluno") ?? "";
  const [search, setSearch] = useState("");

  const students = useQuery({
    queryKey: ["assessment-students"],
    queryFn: async () => {
      const { data, error } = await db.from("profiles").select("id, full_name, email, data_nascimento, sexo").order("full_name");
      if (error) throw error;
      return data as { id: string; full_name: string | null; email: string | null; data_nascimento: string | null; sexo: string | null }[];
    },
  });
  const student = students.data?.find((s) => s.id === studentId);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (students.data ?? []).filter((s) => !q || `${s.full_name} ${s.email} ${s.id}`.toLowerCase().includes(q)).slice(0, 30);
  }, [students.data, search]);

  const list = useAssessments(studentId || undefined, "admin");
  const items = list.data ?? [];
  const [editingId, setEditingId] = useState<string>("");
  const editing = items.find((x) => x.id === editingId);
  const published = items.filter((x) => x.status === "published");
  const refresh = () => qc.invalidateQueries({ queryKey: ["physical-assessments"] });

  const createDraft = async () => {
    if (!student) return;
    const { data, error } = await db.from("physical_assessments").insert({
      user_id: student.id,
      assessed_at: new Date().toISOString().slice(0, 10),
      birth_date: student.data_nascimento ?? null,
      sex: mapSex(student.sexo),
    }).select().single();
    if (error) return toast.error(error.message);
    await refresh();
    setEditingId(data.id);
  };

  const createCorrection = async (a: AssessmentRow) => {
    const reason = window.prompt("Motivo da correção (fica registrado no histórico):");
    if (!reason?.trim()) return;
    const { id, created_at, updated_at, published_at, published_by, status, ...rest } = a;
    const { data, error } = await db.from("physical_assessments").insert({
      ...rest, supersedes_id: a.id, root_id: a.root_id ?? a.id, version: a.version + 1, correction_reason: reason.trim().slice(0, 500),
    }).select().single();
    if (error) return toast.error(error.message);
    const { data: photos } = await db.from("physical_assessment_photos").select("position, storage_path, mime_type").eq("assessment_id", a.id);
    if (photos?.length) {
      await db.from("physical_assessment_photos").insert(photos.map((p: any) => ({ ...p, assessment_id: data.id, user_id: a.user_id })));
    }
    toast.success("Nova versão criada como rascunho. A versão publicada continua preservada.");
    await refresh();
    setEditingId(data.id);
  };

  const setStatus = async (a: AssessmentRow, status: AssessmentRow["status"]) => {
    const { error } = await db.from("physical_assessments").update({ status }).eq("id", a.id);
    if (error) return toast.error(error.message);
    toast.success(status === "published" ? "Avaliação publicada para o aluno." : "Avaliação ocultada do aluno.");
    refresh();
  };

  return (
    <ClientLayout>
      <div className="space-y-8">
        <PageHeader eyebrow="Composição corporal" title="Avaliações Físicas" subtitle="Jackson & Pollock 7 dobras · Siri. Histórico versionado por aluno." />

        <Card>
          <CardHeader><CardTitle className="text-lg">Aluno</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {student ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold break-words">{student.full_name || "Sem nome"}</p>
                  <p className="text-xs text-muted-foreground break-all">{student.email} · ID {student.id}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={createDraft} className="min-h-11"><Plus className="h-4 w-4 mr-2" />Nova avaliação</Button>
                  <Button variant="outline" className="min-h-11" onClick={() => { setParams({}); setEditingId(""); }}>Trocar aluno</Button>
                </div>
              </div>
            ) : (
              <>
                <Label htmlFor="student-search">Buscar por nome, e-mail ou ID</Label>
                <Input id="student-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Digite para filtrar" className="min-h-11" />
                {students.isLoading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  : students.error ? <p className="text-sm text-destructive" role="alert">Não foi possível carregar os alunos.</p>
                  : (
                    <ul className="divide-y divide-border rounded-lg border border-border max-h-80 overflow-y-auto">
                      {filtered.map((s) => (
                        <li key={s.id}>
                          <button className="w-full text-left px-3 py-3 hover:bg-muted/40 min-h-11" onClick={() => setParams({ aluno: s.id })}>
                            <span className="block text-sm font-medium break-words">{s.full_name || "Sem nome"}</span>
                            <span className="block text-xs text-muted-foreground break-all">{s.email} · {s.id.slice(0, 8)}</span>
                          </button>
                        </li>
                      ))}
                      {!filtered.length && <li className="px-3 py-3 text-sm text-muted-foreground">Nenhum aluno encontrado.</li>}
                    </ul>
                  )}
              </>
            )}
          </CardContent>
        </Card>

        {student && (
          <>
            {editing?.status === "draft" && (
              <DraftEditor key={editing.id} a={editing} onSaved={refresh} onClose={() => setEditingId("")} onPublish={() => setStatus(editing, "published")} />
            )}

            <Card>
              <CardHeader><CardTitle className="text-lg">Histórico completo</CardTitle></CardHeader>
              <CardContent>
                {list.isLoading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  : list.error ? <p className="text-sm text-destructive" role="alert">Erro ao carregar avaliações.</p>
                  : !items.length ? <p className="text-sm text-muted-foreground">Nenhuma avaliação para este aluno.</p>
                  : (
                    <ul className="space-y-2">
                      {[...items].reverse().map((a) => (
                        <li key={a.id} className="rounded-lg border border-border p-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold">{dateBR(a.assessed_at)}</span>
                              <Badge variant={a.status === "published" ? "default" : "outline"}>{STATUS[a.status]}</Badge>
                              <span className="text-xs text-muted-foreground">v{a.version}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {a.results ? `${fmt(a.results.body_fat_pct, 2)}% gordura · ${fmt(a.weight_kg)} kg` : "Sem cálculo"}
                              {a.correction_reason ? ` · Correção: ${a.correction_reason}` : ""}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {a.status === "draft" && <Button size="sm" variant="outline" onClick={() => setEditingId(a.id)}>Editar</Button>}
                            {a.status === "draft" && (
                              <Button size="sm" variant="ghost" onClick={async () => {
                                if (!window.confirm("Descartar este rascunho?")) return;
                                const { error } = await db.from("physical_assessments").delete().eq("id", a.id);
                                if (error) toast.error(error.message); else { if (editingId === a.id) setEditingId(""); refresh(); }
                              }}>Descartar</Button>
                            )}
                            {a.status === "published" && <Button size="sm" variant="outline" onClick={() => setStatus(a, "unpublished")}>Despublicar</Button>}
                            {a.status === "unpublished" && <Button size="sm" variant="outline" onClick={() => setStatus(a, "published")}>Republicar</Button>}
                            {(a.status === "published" || a.status === "unpublished") && <Button size="sm" variant="ghost" onClick={() => createCorrection(a)}>Corrigir (nova versão)</Button>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
              </CardContent>
            </Card>

            {published.length > 0 && <AssessmentSummary a={published[published.length - 1]} studentName={student.full_name || "Aluno"} />}
            <EvolutionCharts items={published} />
            <ComparisonPanel items={items.filter((x) => x.results)} />
          </>
        )}
      </div>
    </ClientLayout>
  );
}

function DraftEditor({ a, onSaved, onClose, onPublish }: { a: AssessmentRow; onSaved: () => void; onClose: () => void; onPublish: () => void }) {
  const [form, setForm] = useState<FormValues>(() => toForm(a));
  const [notes, setNotes] = useState(a.notes ?? "");
  const [recs, setRecs] = useState(a.recommendations ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const validation = useMemo(() => validateForm(form), [form]);
  const preview = useMemo(() => {
    if (!validation.parsed || !form.sex) return null;
    const p = validation.parsed;
    return calculateAssessment({ sex: form.sex, age: p.age, weightKg: p.weight, heightCm: p.height, skinfolds: p.skinfolds, waistCm: p.circumferences.waist, hipCm: p.circumferences.hip });
  }, [validation, form.sex]);

  const save = async (publish: boolean) => {
    // Erros de formato/limite sempre bloqueiam; campos ausentes só bloqueiam publicação.
    const formatErrors = Object.fromEntries(Object.entries(validation.errors).filter(([, m]) => !m.includes("obrigatório") && !m.includes("obrigatória")));
    if (Object.keys(formatErrors).length || (publish && !validation.canCalculate)) {
      setErrors(publish ? validation.errors : formatErrors);
      toast.error(publish ? "Complete os campos obrigatórios para publicar." : "Corrija os valores destacados.");
      return;
    }
    setErrors({});
    setSaving(true);
    const num = (s: string) => { const n = parseDecimal(s); return n == null || Number.isNaN(n) ? null : n; };
    const pick = (o: Record<string, string>) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, num(v)]).filter(([, v]) => v != null));
    const payload = {
      assessed_at: form.assessed_at,
      birth_date: form.birth_date || null,
      age_years: form.birth_date && form.assessed_at ? ageAt(form.birth_date, form.assessed_at) : null,
      sex: form.sex || null,
      weight_kg: num(form.weight),
      height_cm: num(form.height),
      skinfolds: pick(form.skinfolds),
      circumferences: pick(form.circumferences),
      results: preview,
      calc_method: preview ? CALC_METHOD : null,
      calc_version: preview ? CALC_VERSION : null,
      notes: notes.trim().slice(0, 3000) || null,
      recommendations: recs.trim().slice(0, 3000) || null,
    };
    const { error } = await db.from("physical_assessments").update(payload).eq("id", a.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    if (publish) onPublish(); else { toast.success("Rascunho salvo."); onSaved(); }
  };

  const field = (key: string, label: string, value: string, onChange: (v: string) => void, unit: string) => (
    <div className="space-y-1 min-w-0" key={key}>
      <Label htmlFor={key} className="text-xs">{label} <span className="text-muted-foreground">({unit})</span></Label>
      <Input id={key} inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={!!errors[key]}
        aria-describedby={errors[key] ? `${key}-err` : undefined} className="min-h-11" />
      {errors[key] && <p id={`${key}-err`} className="text-xs text-destructive">{errors[key]}</p>}
    </div>
  );
  const set = (patch: Partial<FormValues>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <Card className="border-primary/40">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between space-y-0">
        <CardTitle className="text-lg">Rascunho · v{a.version}</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>Fechar</Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="grid gap-3 grid-cols-2 md:grid-cols-5">
          <div className="space-y-1">
            <Label htmlFor="assessed_at" className="text-xs">Data da avaliação</Label>
            <Input id="assessed_at" type="date" value={form.assessed_at} onChange={(e) => set({ assessed_at: e.target.value })} className="min-h-11" />
            {errors.assessed_at && <p className="text-xs text-destructive">{errors.assessed_at}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="birth_date" className="text-xs">Nascimento</Label>
            <Input id="birth_date" type="date" value={form.birth_date} onChange={(e) => set({ birth_date: e.target.value })} className="min-h-11" />
            {form.birth_date && form.assessed_at && <p className="text-xs text-muted-foreground">{ageAt(form.birth_date, form.assessed_at)} anos na data</p>}
            {errors.birth_date && <p className="text-xs text-destructive">{errors.birth_date}</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Sexo biológico (equação)</Label>
            <Select value={form.sex} onValueChange={(v) => set({ sex: v as any })}>
              <SelectTrigger className="min-h-11"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent><SelectItem value="male">Masculino</SelectItem><SelectItem value="female">Feminino</SelectItem></SelectContent>
            </Select>
            {errors.sex && <p className="text-xs text-destructive">{errors.sex}</p>}
          </div>
          {field("weight", "Peso", form.weight, (v) => set({ weight: v }), "kg")}
          {field("height", "Altura", form.height, (v) => set({ height: v }), "cm")}
        </section>

        <section className="space-y-2">
          <p className="eyebrow-label">7 dobras cutâneas</p>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            {SKINFOLDS.map((s) => field(`sf_${s.key}`, s.label, form.skinfolds[s.key] ?? "", (v) => set({ skinfolds: { ...form.skinfolds, [s.key]: v } }), "mm"))}
          </div>
        </section>

        <section className="space-y-2">
          <p className="eyebrow-label">Circunferências</p>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            {CIRCUMFERENCES.map((c) => field(`c_${c.key}`, c.label, form.circumferences[c.key] ?? "", (v) => set({ circumferences: { ...form.circumferences, [c.key]: v } }), "cm"))}
          </div>
        </section>

        <section className="rounded-lg border border-border p-4" aria-live="polite">
          <p className="eyebrow-label mb-2">Prévia do cálculo</p>
          {preview ? (
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
              {[["Soma dobras", `${fmt(preview.skinfold_sum)} mm`], ["Densidade", fmt(preview.density, 5)], ["Gordura", `${fmt(preview.body_fat_pct, 2)}%`],
                ["Massa gorda", `${fmt(preview.fat_mass_kg, 2)} kg`], ["Massa livre", `${fmt(preview.lean_mass_kg, 2)} kg`], ["IMC", fmt(preview.bmi, 2)],
                ["RCQ", fmt(preview.whr, 3)], ["RCE", fmt(preview.whtr, 3)]].map(([k, v]) => (
                <div key={k}><dt className="text-xs text-muted-foreground">{k}</dt><dd className="font-semibold">{v}</dd></div>
              ))}
            </dl>
          ) : <p className="text-sm text-muted-foreground">Preencha data, nascimento, sexo, peso, altura e as 7 dobras para calcular.</p>}
        </section>

        <PhotoUploader a={a} />

        <section className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1"><Label htmlFor="notes">Observações</Label><Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={3000} rows={4} /></div>
          <div className="space-y-1"><Label htmlFor="recs">Recomendações</Label><Textarea id="recs" value={recs} onChange={(e) => setRecs(e.target.value)} maxLength={3000} rows={4} /></div>
        </section>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => save(false)} disabled={saving} className="min-h-11">Salvar rascunho</Button>
          <Button onClick={() => save(true)} disabled={saving} className="min-h-11">{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Salvar e publicar</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PhotoUploader({ a }: { a: AssessmentRow }) {
  const qc = useQueryClient();
  const { data: photos } = useAssessmentPhotos(a.id);
  const [busy, setBusy] = useState<PhotoPosition | "">("");
  useEffect(() => () => setBusy(""), []);

  const upload = async (position: PhotoPosition, file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Envie uma imagem.");
    if (file.size > 15 * 1024 * 1024) return toast.error("Imagem acima de 15 MB.");
    setBusy(position);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const path = `${a.user_id}/${a.id}/${position}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from(ASSESSMENT_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;
      const { error } = await db.from("physical_assessment_photos")
        .upsert({ assessment_id: a.id, user_id: a.user_id, position, storage_path: path, mime_type: file.type }, { onConflict: "assessment_id,position" });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: assessmentKeys.photos(a.id) });
      toast.success("Foto salva.");
    } catch (e: any) {
      toast.error(e?.message || "Falha no envio da foto");
    } finally {
      setBusy("");
    }
  };

  return (
    <section className="space-y-2">
      <p className="eyebrow-label">Fotos originais</p>
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        {PHOTO_POSITIONS.map((p) => {
          const ph = photos?.find((x) => x.position === p.key);
          return (
            <div key={p.key} className="rounded-lg border border-border overflow-hidden min-w-0">
              <div className="aspect-[3/4] bg-muted/30 flex items-center justify-center">
                {busy === p.key ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  : ph?.url ? <img src={ph.url} alt={p.label} className="h-full w-full object-contain" />
                  : <span className="text-xs text-muted-foreground">{p.label}</span>}
              </div>
              <div className="p-2 space-y-1.5">
                <p className="text-xs font-medium">{p.label}</p>
                <div className="flex flex-wrap gap-1.5">
                  <label className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1.5 text-xs cursor-pointer min-h-9">
                    <Camera className="h-3.5 w-3.5" />Câmera
                    <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => { upload(p.key, e.target.files?.[0]); e.target.value = ""; }} />
                  </label>
                  <label className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1.5 text-xs cursor-pointer min-h-9">
                    <Upload className="h-3.5 w-3.5" />{ph ? "Substituir" : "Arquivo"}
                    <input type="file" accept="image/*" className="sr-only" onChange={(e) => { upload(p.key, e.target.files?.[0]); e.target.value = ""; }} />
                  </label>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
