import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Loader2, Upload, Trash2, Eye, RefreshCw, Check } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { DocumentProfileReview } from "./DocumentProfileReview";

type Category = "composicao_corporal" | "movimento" | "exame_medico";
const CATEGORIES: { value: Category; label: string }[] = [
  { value: "composicao_corporal", label: "Avaliação física / composição corporal" },
  { value: "movimento", label: "Avaliação de movimento" },
  { value: "exame_medico", label: "Exame médico" },
];
const STATUS: Record<string, string> = { pending: "Aguardando leitura", processing: "Lendo", extracted: "Lido — revisar", reviewed: "Revisado", failed: "Falhou" };

interface Doc { id: string; category: Category; title: string; storage_path: string; mime_type: string; document_date: string | null; status: string; reviewed_summary: string | null; use_in_protocol: boolean; error_message: string | null; created_at: string; updated_at: string; extracted_data: unknown; reviewed_profile: unknown; profile_applied_at: string | null; }
interface SysAssessment { id: string; kind: string; date: string; }

export function ClientDocumentsSection({ userId, onProfileUpdated }: { userId: string; onProfileUpdated?: () => Promise<void> }) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [sys, setSys] = useState<SysAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category>("exame_medico");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const [d, p, m] = await Promise.all([
      supabase.from("client_documents").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("physical_assessments").select("id, assessed_at").eq("user_id", userId).eq("status", "published").order("assessed_at", { ascending: false }),
      supabase.from("movement_assessments").select("id, assessed_at").eq("user_id", userId).eq("status", "published").order("assessed_at", { ascending: false }),
    ]);
    setDocs((d.data as Doc[]) ?? []);
    setSys([
      ...(p.data ?? []).map((a: any) => ({ id: a.id, kind: "Composição corporal", date: a.assessed_at })),
      ...(m.data ?? []).map((a: any) => ({ id: a.id, kind: "Movimento", date: a.assessed_at })),
    ].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "")));
    setLoading(false);
  }, [userId]);
  useEffect(() => { load(); }, [load]);

  const read = async (id: string) => {
    setBusy(id);
    const { error } = await supabase.functions.invoke("read-client-document", { body: { documentId: id } });
    if (error) toast.error("Não foi possível ler o documento. Revise o resumo manualmente.");
    else toast.success("Documento lido. Revise o resumo antes de usar no protocolo.");
    setBusy(null); load();
  };

  const upload = async () => {
    if (!file || !title.trim()) return toast.error("Escolha o arquivo e dê um título");
    if (!["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(file.type)) return toast.error("Envie PDF, JPG, PNG ou WEBP");
    if (file.size > 20 * 1024 * 1024) return toast.error("Arquivo acima de 20 MB");
    setBusy("upload");
    const path = `${userId}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
    const { error: upErr } = await supabase.storage.from("client-documents").upload(path, file, { contentType: file.type });
    if (upErr) { setBusy(null); return toast.error("Falha ao enviar arquivo"); }
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("client_documents").insert({ user_id: userId, category, title: title.trim(), storage_path: path, mime_type: file.type, document_date: date || null, created_by: user?.id }).select("id").single();
    setBusy(null);
    if (error || !data) return toast.error("Falha ao salvar documento");
    setTitle(""); setDate(""); setFile(null);
    await load();
    read(data.id);
  };

  const view = async (d: Doc) => {
    const { data } = await supabase.storage.from("client-documents").createSignedUrl(d.storage_path, 300);
    if (data) window.open(data.signedUrl, "_blank", "noopener");
  };

  const save = async (d: Doc, use: boolean, measuredDate = d.document_date, profileValues: Record<string, number> = {}) => {
    const summary = drafts[d.id] ?? d.reviewed_summary ?? "";
    if (!summary.trim()) throw new Error("Escreva o resumo antes de salvar a revisão");
    setBusy(d.id);
    try {
      const { data, error } = await supabase.rpc("review_client_document", { _id: d.id, _summary: summary, _use: use, _date: measuredDate, _profile: profileValues });
      if (error) throw error;
      const skipped = data && typeof data === "object" && !Array.isArray(data) && "skipped" in data && Array.isArray(data.skipped) ? data.skipped : [];
      if (skipped.length) toast.info("Medidas anteriores preservadas no documento; o cadastro manteve os dados mais recentes.");
      else toast.success(Object.keys(profileValues).length ? "Cadastro atualizado com os valores revisados" : use ? "Revisado e ligado aos próximos protocolos" : "Revisado");
      await Promise.all([load(), onProfileUpdated?.()]);
    } finally { setBusy(null); }
  };
  const saveReview = (d: Doc, use: boolean) => save(d, use).catch(() => toast.error("Não foi possível salvar a revisão"));

  const remove = async (d: Doc) => {
    if (!confirm("Excluir este documento?")) return;
    await supabase.storage.from("client-documents").remove([d.storage_path]);
    await supabase.from("client_documents").delete().eq("id", d.id);
    load();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Avaliações e exames</CardTitle>
        <CardDescription>Anexe PDFs ou imagens. O sistema lê, você revisa, e o resumo revisado entra nos próximos treinos e dietas.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="text-sm font-medium mb-2">Avaliações feitas no sistema (já usadas no protocolo)</p>
          {sys.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma avaliação publicada.</p> : (
            <div className="flex flex-wrap gap-2">
              {sys.map(s => <Badge key={s.id} variant="secondary">{s.kind} · {s.date ? format(new Date(s.date), "dd/MM/yyyy") : "—"}</Badge>)}
            </div>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 rounded-lg border p-4">
          <div className="space-y-1">
            <Label>Tipo</Label>
            <Select value={category} onValueChange={v => setCategory(v as Category)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label>Título</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex.: Hemograma, Bioimpedância" /></div>
          <div className="space-y-1"><Label>Data do documento</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
          <div className="space-y-1"><Label>Arquivo (PDF ou imagem)</Label><Input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={e => setFile(e.target.files?.[0] ?? null)} /></div>
          <Button className="sm:col-span-2" onClick={upload} disabled={busy === "upload"}>
            {busy === "upload" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />} Anexar e ler
          </Button>
        </div>

        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : docs.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum documento anexado.</p> : (
          <div className="space-y-4">
            {docs.map(d => (
              <div key={d.id} className="rounded-lg border p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium break-words">{d.title}</p>
                    <p className="text-xs text-muted-foreground">{CATEGORIES.find(c => c.value === d.category)?.label}{d.document_date ? ` · ${format(new Date(d.document_date + "T12:00"), "dd/MM/yyyy")}` : ""}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={d.status === "reviewed" ? "default" : "outline"}>{STATUS[d.status] ?? d.status}</Badge>
                    {d.use_in_protocol && d.status === "reviewed" && <Badge>No protocolo</Badge>}
                    {d.profile_applied_at && <Badge variant="secondary">Cadastro atualizado</Badge>}
                    <Button size="icon" variant="ghost" onClick={() => view(d)} aria-label="Ver arquivo"><Eye className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => read(d.id)} disabled={busy === d.id} aria-label="Ler novamente">{busy === d.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}</Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(d)} aria-label="Excluir"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                {d.error_message && <p className="text-xs text-destructive">{d.error_message}</p>}
                <Textarea rows={5} value={drafts[d.id] ?? d.reviewed_summary ?? ""} onChange={e => setDrafts(s => ({ ...s, [d.id]: e.target.value }))} placeholder="Resumo, restrições e orientações para o protocolo" />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <Switch checked={d.use_in_protocol} disabled={busy === d.id} onCheckedChange={v => saveReview(d, v)} /> Usar nos próximos protocolos
                  </label>
                  <Button size="sm" variant="outline" disabled={busy === d.id} onClick={() => saveReview(d, d.use_in_protocol)}><Check className="h-4 w-4 mr-1" /> Salvar revisão</Button>
                </div>
                <DocumentProfileReview key={`${d.id}-${d.updated_at ?? d.status}-${d.profile_applied_at}`} data={d.extracted_data} reviewedProfile={d.reviewed_profile} summary={d.reviewed_summary ?? ""} date={d.document_date} applied={!!d.profile_applied_at} disabled={busy === d.id} onApply={(measuredDate, values) => save(d, d.use_in_protocol, measuredDate, values)} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
