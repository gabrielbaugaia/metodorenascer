import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Search, UserRound, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { studySubstances, type StudyNotes } from "@/lib/hormonalStudy";

export type StudyClient = {
  id: string; full_name: string; age: number | null; weight: number | null;
  sexo: string | null; restricoes_medicas: string | null; injuries: string | null;
};

export function StudyClientPicker({ client, onSelect }: { client: StudyClient | null; onSelect: (client: StudyClient | null) => void }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<StudyClient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const term = search.trim().replace(/[%_]/g, "");
    setResults([]); setError(false);
    if (term.length < 2) { setLoading(false); return; }
    setLoading(true);
    const timeout = setTimeout(async () => {
      const { data, error: queryError } = await supabase.from("profiles")
        .select("id, full_name, age, weight, sexo, restricoes_medicas, injuries")
        .is("archived_at", null).ilike("full_name", `%${term}%`).order("full_name").limit(20);
      if (cancelled) return;
      setResults(data ?? []); setError(Boolean(queryError)); setLoading(false);
    }, 300);
    return () => { cancelled = true; clearTimeout(timeout); };
  }, [search]);

  return <section className="space-y-4 border-b border-border pb-6">
    <h2 className="font-serif text-2xl flex items-center gap-2"><UserRound className="size-5 text-primary" />Cliente do estudo</h2>
    <div className="space-y-2 max-w-xl"><Label htmlFor="study-client-search">Buscar cliente pelo nome</Label><div className="relative"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><Input id="study-client-search" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} autoComplete="off" /></div></div>
    {loading && <p role="status" className="text-sm text-muted-foreground">Buscando clientes…</p>}
    {error && <p role="alert" className="text-sm text-destructive">Não foi possível buscar. Altere a busca para tentar novamente.</p>}
    {!loading && !error && search.trim().length >= 2 && !results.length && <p className="text-sm text-muted-foreground">Nenhum cliente encontrado.</p>}
    {!!results.length && <ul className="max-h-64 overflow-y-auto divide-y divide-border border-y border-border">{results.map((result) => <li key={result.id}><Button variant="ghost" className="w-full justify-start h-auto py-3 whitespace-normal text-left" onClick={() => { onSelect(result); setSearch(""); }}>{result.full_name}</Button></li>)}</ul>}
    {client && <div className="space-y-3 border-l-2 border-primary pl-4">
      <div className="flex items-center justify-between gap-3"><p className="font-medium break-words">{client.full_name}</p><Button variant="ghost" size="icon" aria-label="Remover cliente selecionado" title="Remover cliente selecionado" onClick={() => onSelect(null)}><X /></Button></div>
      <dl className="grid grid-cols-3 gap-3 text-sm"><div><dt className="text-muted-foreground">Idade cadastrada</dt><dd>{client.age == null ? "Não informada" : `${client.age} anos`}</dd></div><div><dt className="text-muted-foreground">Peso cadastrado</dt><dd>{client.weight == null ? "Não informado" : `${client.weight} kg`}</dd></div><div><dt className="text-muted-foreground">Sexo informado</dt><dd>{client.sexo || "Não informado"}</dd></div></dl>
      <p className="text-sm break-words"><span className="text-muted-foreground">Restrições médicas: </span>{client.restricoes_medicas || "Não informadas"}</p>
      <p className="text-sm break-words"><span className="text-muted-foreground">Lesões informadas: </span>{client.injuries || "Não informadas"}</p>
      <Button variant="outline" asChild><Link to={`/admin/clientes/${client.id}`}><UserRound />Abrir cadastro e exames</Link></Button>
    </div>}
  </section>;
}

export function HormonalStudyPanel({ value, onChange }: { value: StudyNotes; onChange: (value: StudyNotes) => void }) {
  const update = (key: keyof StudyNotes, text: string) => onChange({ ...value, [key]: text });
  return <div className="space-y-6">
    <h2 className="font-serif text-2xl flex items-center gap-2"><BookOpen className="size-5 text-primary" />Base de estudo</h2>
    <div className="grid sm:grid-cols-2 gap-5">
      <div className="space-y-2"><Label htmlFor="study-topic">Tema do estudo</Label><Input id="study-topic" value={value.topic} onChange={(e) => update("topic", e.target.value)} /></div>
      <div className="space-y-2"><Label htmlFor="study-substance">Substância de referência</Label><Select value={value.substance || "none"} onValueChange={(s) => update("substance", s === "none" ? "" : s)}><SelectTrigger id="study-substance"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Nenhuma selecionada</SelectItem>{studySubstances.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
    </div>
    <p className="text-sm text-muted-foreground">Índice de nomes para consulta, não uma base farmacológica validada. A inclusão de uma substância não indica aprovação para uso humano, indicação ou segurança.</p>
    <div className="space-y-2"><Label htmlFor="study-notes">Notas de estudo e dúvidas para o médico</Label><Textarea id="study-notes" rows={6} value={value.notes} onChange={(e) => update("notes", e.target.value)} /></div>
    <div className="space-y-2"><Label htmlFor="study-references">Referências consultadas — título, autor, endereço e data</Label><Textarea id="study-references" rows={4} value={value.references} onChange={(e) => update("references", e.target.value)} /></div>
    <div className="border-t border-border pt-4 space-y-2"><h3 className="font-medium">Fontes de consulta</h3><div className="flex flex-wrap gap-4 text-sm"><a className="text-primary underline underline-offset-4" href="https://consultas.anvisa.gov.br/#/bulario/" target="_blank" rel="noopener noreferrer">Bulário eletrônico da Anvisa</a><a className="text-primary underline underline-offset-4" href="https://pubmed.ncbi.nlm.nih.gov/" target="_blank" rel="noopener noreferrer">PubMed</a></div></div>
  </div>;
}