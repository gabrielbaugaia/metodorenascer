import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { MOVEMENT_FINDINGS, PHOTO_POSITIONS, VIDEO_POSITIONS, type Finding, type Severity } from "@/lib/movementAssessment";

const db = supabase as any;
const BUCKET = "movement-media";
const SEVS: Severity[] = ["leve", "moderada", "importante"];
const dateBR = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("pt-BR");

type Assessment = {
  id: string; user_id: string; assessed_at: string; findings: Finding[]; restrictions: string | null;
  notes: string | null; status: string; published_at: string | null;
};

export default function AdminAvaliacoesMovimento() {
  const [params, setParams] = useSearchParams();
  const studentId = params.get("aluno") ?? "";
  const selectedId = params.get("id") ?? "";
  const [search, setSearch] = useState("");
  const qc = useQueryClient();

  const students = useQuery({
    queryKey: ["mv-students"],
    queryFn: async () => {
      const { data, error } = await db.from("profiles").select("id, full_name, email").is("archived_at", null).order("full_name").limit(1000);
      if (error) throw error;
      return data as { id: string; full_name: string | null; email: string | null }[];
    },
  });
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (students.data ?? []).filter((s) => !q || `${s.full_name} ${s.email}`.toLowerCase().includes(q)).slice(0, 30);
  }, [students.data, search]);
  const student = students.data?.find((s) => s.id === studentId);

  const profile = useQuery({
    enabled: !!studentId,
    queryKey: ["mv-ficha", studentId],
    queryFn: async () => {
      const [{ data: p }, { data: pa }, { count: photos }] = await Promise.all([
        db.from("profiles").select("anamnese_completa, objetivo_principal, injuries, restricoes_medicas, foto_frente_url, foto_costas_url, foto_lado_url").eq("id", studentId).maybeSingle(),
        db.from("physical_assessments").select("assessed_at, results").eq("user_id", studentId).eq("status", "published").order("assessed_at", { ascending: false }).limit(1).maybeSingle(),
        db.from("physical_assessment_photos").select("id", { count: "exact", head: true }).eq("user_id", studentId),
      ]);
      return { p, pa, photos: photos ?? 0 };
    },
  });

  const list = useQuery({
    enabled: !!studentId,
    queryKey: ["mv-list", studentId],
    queryFn: async () => {
      const { data, error } = await db.from("movement_assessments").select("*").eq("user_id", studentId).order("assessed_at", { ascending: false });
      if (error) throw error;
      return data as Assessment[];
    },
  });
  const current = list.data?.find((a) => a.id === selectedId);

  const select = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next);
  };

  const createDraft = async () => {
    const { data, error } = await db.from("movement_assessments").insert({ user_id: studentId }).select("id").single();
    if (error) return toast.error(error.message);
    await qc.invalidateQueries({ queryKey: ["mv-list", studentId] });
    select({ id: data.id });
  };

  return (
    <ClientLayout>
      <PageHeader title="Avaliação de Movimento" subtitle="Postural, biomecânica e funcional, ligada ao cadastro do aluno e ao treino." />
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <Card>
          <CardHeader><CardTitle className="text-base">Aluno</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Buscar nome ou e-mail" value={search} onChange={(e) => setSearch(e.target.value)} />
            {students.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <ul className="max-h-[50vh] space-y-1 overflow-y-auto">
                {filtered.map((s) => (
                  <li key={s.id}>
                    <button onClick={() => select({ aluno: s.id, id: "" })}
                      className={`w-full rounded-md px-3 py-2 text-left text-sm hover:bg-secondary ${s.id === studentId ? "bg-secondary" : ""}`}>
                      <div className="font-medium break-words">{s.full_name || "Sem nome"}</div>
                      <div className="text-xs text-muted-foreground break-words">{s.email}</div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="min-w-0 space-y-6">
          {!student ? <p className="text-sm text-muted-foreground">Escolha um aluno para ver a ficha e lançar a avaliação.</p> : (
            <>
              <Card>
                <CardHeader><CardTitle className="text-base">Ficha única · {student.full_name}</CardTitle></CardHeader>
                <CardContent className="grid gap-3 text-sm sm:grid-cols-3">
                  <div><div className="text-muted-foreground">Anamnese</div>{profile.data?.p?.anamnese_completa ? "Completa" : "Pendente"}</div>
                  <div><div className="text-muted-foreground">Dobras (última)</div>
                    {profile.data?.pa ? `${Number(profile.data.pa.results?.body_fat_pct ?? 0).toFixed(1)}% · ${dateBR(profile.data.pa.assessed_at)}` : "Nenhuma publicada"}</div>
                  <div><div className="text-muted-foreground">Fotos</div>{(profile.data?.photos ?? 0) + [profile.data?.p?.foto_frente_url, profile.data?.p?.foto_costas_url, profile.data?.p?.foto_lado_url].filter(Boolean).length}</div>
                  {(profile.data?.p?.injuries || profile.data?.p?.restricoes_medicas) && (
                    <div className="sm:col-span-3"><div className="text-muted-foreground">Lesões / restrições da anamnese</div>
                      {[profile.data.p.injuries, profile.data.p.restricoes_medicas].filter(Boolean).join(" · ")}</div>
                  )}
                  <p className="text-xs text-muted-foreground sm:col-span-3">Anamnese, dobras, fotos e a última avaliação de movimento publicada entram na geração do treino. Prescrições manuais continuam valendo acima de tudo.</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base">Histórico</CardTitle>
                  <Button size="sm" onClick={createDraft}>Nova avaliação</Button>
                </CardHeader>
                <CardContent>
                  {list.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : !list.data?.length ? (
                    <p className="text-sm text-muted-foreground">Nenhuma avaliação de movimento ainda.</p>
                  ) : (
                    <ul className="space-y-1">
                      {list.data.map((a) => (
                        <li key={a.id}>
                          <button onClick={() => select({ id: a.id })}
                            className={`flex w-full flex-wrap justify-between gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-secondary ${a.id === selectedId ? "bg-secondary" : ""}`}>
                            <span>{dateBR(a.assessed_at)} · {(a.findings ?? []).length} achados</span>
                            <span className="text-muted-foreground">{a.status === "published" ? "Publicada" : "Rascunho"}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              {current && <Editor key={current.id} a={current} onChanged={() => qc.invalidateQueries({ queryKey: ["mv-list", studentId] })} onDeleted={() => select({ id: "" })} />}
            </>
          )}
        </div>
      </div>
    </ClientLayout>
  );
}

function Editor({ a, onChanged, onDeleted }: { a: Assessment; onChanged: () => void; onDeleted: () => void }) {
  const [date, setDate] = useState(a.assessed_at);
  const [findings, setFindings] = useState<Finding[]>(a.findings ?? []);
  const [restrictions, setRestrictions] = useState(a.restrictions ?? "");
  const [notes, setNotes] = useState(a.notes ?? "");
  const [busy, setBusy] = useState<string | null>(null);
  const qc = useQueryClient();

  const media = useQuery({
    queryKey: ["mv-media", a.id],
    queryFn: async () => {
      const { data, error } = await db.from("movement_assessment_media").select("*").eq("assessment_id", a.id);
      if (error) throw error;
      const rows = data as { id: string; kind: string; position_key: string; storage_path: string }[];
      const urls: Record<string, string> = {};
      await Promise.all(rows.map(async (r) => {
        const { data: s } = await supabase.storage.from(BUCKET).createSignedUrl(r.storage_path, 3600);
        if (s?.signedUrl) urls[r.id] = s.signedUrl;
      }));
      return rows.map((r) => ({ ...r, url: urls[r.id] }));
    },
  });

  const toggle = (f: (typeof MOVEMENT_FINDINGS)[number], sev: Severity | null) => {
    setFindings((prev) => {
      const rest = prev.filter((x) => x.key !== f.key);
      return sev ? [...rest, { key: f.key, label: f.label, region: f.region, severity: sev }] : rest;
    });
  };

  const save = async (publish = false) => {
    setBusy(publish ? "pub" : "save");
    const patch: Record<string, unknown> = { assessed_at: date, findings, restrictions: restrictions || null, notes: notes || null };
    if (publish) { patch.status = "published"; patch.published_at = new Date().toISOString(); }
    const { error } = await db.from("movement_assessments").update(patch).eq("id", a.id);
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success(publish ? "Avaliação publicada. O próximo treino gerado vai considerá-la." : "Salvo");
    onChanged();
  };

  const remove = async () => {
    if (!confirm("Excluir esta avaliação e suas mídias?")) return;
    const paths = (media.data ?? []).map((m) => m.storage_path);
    if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
    const { error } = await db.from("movement_assessments").delete().eq("id", a.id);
    if (error) return toast.error(error.message);
    onChanged(); onDeleted();
  };

  const upload = async (kind: "photo" | "video", key: string, file: File) => {
    setBusy(key);
    try {
      const old = media.data?.find((m) => m.position_key === key);
      if (old) {
        await supabase.storage.from(BUCKET).remove([old.storage_path]);
        await db.from("movement_assessment_media").delete().eq("id", old.id);
      }
      const ext = file.name.split(".").pop() || (kind === "photo" ? "jpg" : "mp4");
      const path = `${a.user_id}/${a.id}/${key}_${Date.now()}.${ext}`;
      const { error: up } = await supabase.storage.from(BUCKET).upload(path, file);
      if (up) throw up;
      const { error } = await db.from("movement_assessment_media").insert({ assessment_id: a.id, user_id: a.user_id, kind, position_key: key, storage_path: path });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["mv-media", a.id] });
    } catch (e: any) {
      toast.error(e.message ?? "Erro no envio");
    } finally { setBusy(null); }
  };

  const slot = (kind: "photo" | "video", p: { key: string; label: string }) => {
    const m = media.data?.find((x) => x.position_key === p.key);
    return (
      <div key={p.key} className="min-w-0 space-y-2 rounded-lg border border-border p-2">
        <div className="text-xs font-medium">{p.label}</div>
        {m?.url ? (kind === "photo"
          ? <img src={m.url} alt={p.label} className="aspect-[3/4] w-full rounded object-contain bg-secondary" />
          : <video src={m.url} controls className="aspect-video w-full rounded bg-secondary" />)
          : <div className="flex aspect-[3/4] items-center justify-center rounded bg-secondary text-xs text-muted-foreground">Sem arquivo</div>}
        <label className="flex cursor-pointer items-center justify-center gap-1 rounded-md border border-border py-1.5 text-xs hover:bg-secondary">
          {busy === p.key ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
          {m ? "Trocar" : "Enviar"}
          <input type="file" hidden accept={kind === "photo" ? "image/*" : "video/*"}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(kind, p.key, f); e.target.value = ""; }} />
        </label>
      </div>
    );
  };

  const regions = [...new Set(MOVEMENT_FINDINGS.map((f) => f.region))];
  const published = a.status === "published";

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle className="text-base">{published ? "Avaliação publicada" : "Rascunho"}</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="ghost" onClick={remove}><Trash2 className="h-4 w-4" /></Button>
          <Button size="sm" variant="outline" disabled={!!busy} onClick={() => save(false)}>{busy === "save" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}</Button>
          {!published && <Button size="sm" disabled={!!busy} onClick={() => save(true)}>{busy === "pub" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publicar"}</Button>}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="max-w-xs"><label className="text-sm text-muted-foreground">Data</label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>

        <section className="space-y-2"><h3 className="text-sm font-semibold">Fotos posturais</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{PHOTO_POSITIONS.map((p) => slot("photo", p))}</div></section>
        <section className="space-y-2"><h3 className="text-sm font-semibold">Vídeos de movimento</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{VIDEO_POSITIONS.map((p) => slot("video", p))}</div></section>

        <section className="space-y-3"><h3 className="text-sm font-semibold">Achados</h3>
          {regions.map((r) => (
            <div key={r} className="space-y-1">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{r}</div>
              {MOVEMENT_FINDINGS.filter((f) => f.region === r).map((f) => {
                const sev = findings.find((x) => x.key === f.key)?.severity ?? null;
                return (
                  <div key={f.key} className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 py-1.5 text-sm">
                    <span className="min-w-0">{f.label}</span>
                    <div className="flex gap-1">
                      {SEVS.map((s) => (
                        <Button key={s} size="sm" variant={sev === s ? "default" : "outline"} className="h-7 px-2 text-xs"
                          onClick={() => toggle(f, sev === s ? null : s)}>{s}</Button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </section>

        <div className="space-y-2"><label className="text-sm font-semibold">Restrições para o treino</label>
          <Textarea value={restrictions} onChange={(e) => setRestrictions(e.target.value)} placeholder="Ex.: sem agachamento livre com barra; evitar desenvolvimento atrás da nuca" /></div>
        <div className="space-y-2"><label className="text-sm font-semibold">Observações da Equipe GB</label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
      </CardContent>
    </Card>
  );
}
