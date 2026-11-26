import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const key = ["admin-hormonal-compounds"];
export function useHormonalCompounds() {
  return useQuery({ queryKey: key, queryFn: async () => {
    const { data, error } = await supabase.from("hormonal_compounds").select("*").order("name");
    if (error) throw error;
    return data;
  } });
}
const empty = { name: "", class_name: "", route: "", concentration_reference: "", half_life_reference: "", source_reference: "" };
const fields: [keyof typeof empty, string][] = [["name", "Nome do fármaco"], ["class_name", "Classe"], ["route", "Via"], ["concentration_reference", "Concentração conforme fonte"], ["half_life_reference", "Meia-vida conforme fonte"], ["source_reference", "Fonte, apresentação e data de consulta"]];

export function HormonalCompoundCatalog() {
  const query = useHormonalCompounds();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  function reset() { setDraft(empty); setEditing(null); }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!draft.name.trim() || busy) return;
    setBusy(true);
    try {
      const payload = Object.fromEntries(Object.entries(draft).map(([field, value]) => [field, value.trim()])) as typeof empty;
      const { error } = editing ? await supabase.from("hormonal_compounds").update(payload).eq("id", editing) : await supabase.from("hormonal_compounds").insert(payload);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: key }); reset(); toast.success("Fármaco salvo no catálogo.");
    } catch { toast.error("Não foi possível salvar o fármaco. Tente novamente."); } finally { setBusy(false); }
  }
  async function remove(id: string) {
    if (busy || !window.confirm("Excluir este fármaco do catálogo? As transcrições já abertas não serão alteradas.")) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("hormonal_compounds").delete().eq("id", id);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: key }); if (editing === id) reset(); toast.success("Fármaco excluído.");
    } catch { toast.error("Não foi possível excluir o fármaco."); } finally { setBusy(false); }
  }
  return <div className="space-y-8 min-w-0">
    <section className="space-y-5">
      <h2 className="section-title">{editing ? "Editar fármaco" : "Cadastrar fármaco"}</h2>
      <form onSubmit={save} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-5">{fields.map(([field, label]) => <div className="space-y-2" key={field}><Label htmlFor={`compound-${field}`}>{label}</Label><Input id={`compound-${field}`} value={draft[field]} required={field === "name"} maxLength={field === "name" ? 120 : 1000} onChange={(event) => setDraft({ ...draft, [field]: event.target.value })} /></div>)}</div>
        <div className="flex flex-wrap gap-3"><Button type="submit" disabled={busy || !draft.name.trim()}>{editing ? <Save /> : <Plus />}{busy ? "Salvando…" : "Salvar fármaco"}</Button>{editing && <Button variant="outline" type="button" disabled={busy} onClick={reset}><X />Cancelar edição</Button>}</div>
      </form>
      <p className="text-sm text-muted-foreground">Referências transcritas, sem validação clínica. Concentração e meia-vida variam conforme apresentação e fonte. Não há doses-base nem preenchimento de prescrição pelo catálogo.</p>
    </section>
    <section className="space-y-4 border-t border-border pt-6">
      <h2 className="section-title">Catálogo de fármacos</h2>
      <div className="space-y-2 max-w-xl"><Label htmlFor="compound-search">Buscar fármaco</Label><Input id="compound-search" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
      {query.isPending && <p role="status">Carregando catálogo…</p>}
      {query.isError && <div role="alert"><p>Não foi possível carregar o catálogo.</p><Button variant="outline" onClick={() => query.refetch()}>Tentar novamente</Button></div>}
      {query.data && <ul className="divide-y divide-border border-y border-border">{query.data.filter((item) => item.name.toLocaleLowerCase().includes(search.toLocaleLowerCase())).map((item) => <li key={item.id} className="py-5 space-y-3">
        <div className="flex items-center justify-between gap-3"><h3 className="font-medium break-words min-w-0">{item.name}</h3><div className="flex shrink-0"><Button variant="ghost" size="icon" aria-label={`Editar ${item.name}`} title="Editar fármaco" disabled={busy} onClick={() => { setEditing(item.id); setDraft({ name: item.name, class_name: item.class_name, route: item.route, concentration_reference: item.concentration_reference, half_life_reference: item.half_life_reference, source_reference: item.source_reference }); }}><Pencil /></Button><Button variant="ghost" size="icon" aria-label={`Excluir ${item.name}`} title="Excluir fármaco" disabled={busy} onClick={() => remove(item.id)}><Trash2 /></Button></div></div>
        <dl className="grid sm:grid-cols-2 gap-3 text-sm">{fields.slice(1).map(([field, label]) => <div key={field} className="min-w-0"><dt className="text-muted-foreground">{label}</dt><dd className="break-words whitespace-pre-wrap">{item[field] || "Não informado"}</dd></div>)}</dl>
      </li>)}</ul>}
      {query.data?.length === 0 && <p className="text-sm text-muted-foreground">Nenhum fármaco cadastrado.</p>}
    </section>
  </div>;
}