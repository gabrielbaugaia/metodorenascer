import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useHormonalCompounds } from "./HormonalCompoundCatalog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { addPrescriptionMedication, addPrescriptionWeek, emptyDose, fillWeeksFromDoses, frequencyText, parseConcentration, removePrescriptionMedication, resizePrescriptionWeeks, setMedicationDose, setPrescriptionEntry, suppliesText, weeklyEntryText, type DoseInput, type PrescriptionTable } from "@/lib/hormonalPrescription";

export function PrescriptionTablePanel({ value, onChange }: { value: PrescriptionTable; onChange: (value: PrescriptionTable) => void }) {
  const [name, setName] = useState("");
  const [weeks, setWeeks] = useState("8");
  const compounds = useHormonalCompounds();
  function generateWeeks() {
    const count = Number(weeks);
    if (!Number.isInteger(count) || count < 1 || count > 104) return;
    if (count < value.weeks.length && !window.confirm("Reduzir o período exclui as últimas semanas e seus registros. Continuar?")) return;
    onChange(resizePrescriptionWeeks(value, count));
  }
  function addMedication(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    onChange(addPrescriptionMedication(value, name));
    setName("");
  }
  return <div className="space-y-8 min-w-0">
    <section className="space-y-5">
      <div className="space-y-2"><h2 className="section-title tracking-normal">Medicamentos da prescrição</h2><p className="text-sm text-muted-foreground">Digite as doses da receita médica · O sistema só converte em ml, aplicações e insumos</p></div>
      <div className="space-y-2 max-w-xl"><Label htmlFor="prescription-catalog">Escolher fármaco do catálogo</Label><Select value="" onValueChange={(id) => {
        const compound = compounds.data?.find((item) => item.id === id);
        if (compound) onChange(addPrescriptionMedication(value, compound.name, parseConcentration(compound.concentration_reference)));
      }}><SelectTrigger id="prescription-catalog" disabled={!compounds.data?.length}><SelectValue placeholder={compounds.isPending ? "Carregando…" : "Selecionar fármaco"} /></SelectTrigger><SelectContent>{compounds.data?.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select>
      {compounds.isError && <p role="alert" className="text-sm text-destructive">Não foi possível carregar o catálogo.</p>}
      {compounds.data?.length === 0 && <p className="text-sm text-muted-foreground">Cadastre os compostos na aba Catálogo de fármacos.</p>}</div>
      <form onSubmit={addMedication} className="flex flex-col sm:flex-row gap-3 items-end">
        <div className="space-y-2 w-full sm:max-w-md"><Label htmlFor="prescription-medication-name">Nome conforme a prescrição</Label><Input id="prescription-medication-name" maxLength={80} value={name} onChange={(event) => setName(event.target.value)} autoComplete="off" /></div>
        <Button type="submit" variant="outline" disabled={!name.trim()} className="w-full sm:w-auto"><Plus />Adicionar medicamento</Button>
      </form>
      {!value.medications.length && <p className="text-sm text-muted-foreground py-6 border-y border-border">Nenhum medicamento registrado.</p>}
      <div className="divide-y divide-border">{value.medications.map((medication) => <div key={medication.id} className="py-5 space-y-4">
        <div className="flex items-end gap-3"><div className="space-y-2 flex-1 min-w-0"><Label htmlFor={`medication-${medication.id}`}>Medicamento</Label><Input id={`medication-${medication.id}`} maxLength={80} value={medication.name} onChange={(event) => onChange({ ...value, medications: value.medications.map((item) => item.id === medication.id ? { ...item, name: event.target.value } : item) })} /></div><Button variant="ghost" size="icon" title="Remover medicamento e registros" aria-label={`Remover medicamento ${medication.name}`} onClick={() => { if (window.confirm("Remover este medicamento e seus registros semanais?")) onChange(removePrescriptionMedication(value, medication.id)); }}><Trash2 /></Button></div>
        <DoseFields medicationId={medication.id} dose={medication.dose ?? emptyDose()} onChange={(dose) => onChange(setMedicationDose(value, medication.id, dose))} />
        {(weeklyEntryText(medication.dose) || frequencyText(medication.dose)) && <div className="text-sm space-y-1 border-l-2 border-primary pl-3"><p className="text-primary">{weeklyEntryText(medication.dose)} por semana</p>{frequencyText(medication.dose) && <p className="text-muted-foreground">{frequencyText(medication.dose)}</p>}</div>}
        <div className="space-y-2"><Label htmlFor={`instructions-${medication.id}`}>Orientações do médico — transcrição fiel</Label><Textarea id={`instructions-${medication.id}`} rows={3} maxLength={4000} value={medication.instructions} onChange={(event) => onChange({ ...value, medications: value.medications.map((item) => item.id === medication.id ? { ...item, instructions: event.target.value } : item) })} /></div>
      </div>)}</div>
    </section>
    <section className="space-y-5 border-t border-border pt-6">
      <div className="flex flex-col sm:flex-row gap-3 items-end"><div className="space-y-2 w-full sm:w-40"><Label htmlFor="prescription-weeks">Período em semanas</Label><Input id="prescription-weeks" type="number" min={1} max={104} step={1} value={weeks} onChange={(event) => setWeeks(event.target.value)} /></div><Button variant="outline" disabled={!value.medications.length || !Number.isInteger(Number(weeks)) || Number(weeks) < 1 || Number(weeks) > 104} onClick={generateWeeks}><Plus />Gerar grade semanal</Button></div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"><h2 className="section-title tracking-normal">Painel semanal do protocolo</h2><div className="flex flex-wrap gap-2"><Button variant="outline" disabled={!value.weeks.length || !value.medications.some((m) => weeklyEntryText(m.dose))} onClick={() => onChange(fillWeeksFromDoses(value))}><Plus />Preencher semanas com as doses digitadas</Button><Button variant="outline" disabled={!value.medications.length} onClick={() => onChange(addPrescriptionWeek(value))}><Plus />Adicionar semana</Button></div></div>
      {!value.weeks.length ? <p className="text-sm text-muted-foreground py-6 border-y border-border">Nenhuma semana registrada.</p> : <Table aria-label="Tabela semanal da prescrição médica">
        <TableHeader><TableRow className="bg-muted/40"><TableHead className="w-24 whitespace-nowrap">Semana</TableHead>{value.medications.map((medication) => <TableHead key={medication.id} className="min-w-56 max-w-xs text-primary break-words">{medication.name || "Medicamento sem nome"}</TableHead>)}<TableHead className="w-14"><span className="sr-only">Remover semana</span></TableHead></TableRow></TableHeader>
        <TableBody>{value.weeks.map((week, index) => <TableRow key={week.id}><TableCell className="text-primary font-medium align-top pt-6 whitespace-nowrap">S{index + 1}</TableCell>{value.medications.map((medication) => <TableCell key={medication.id} className="align-top"><Textarea rows={3} maxLength={2000} className="min-w-48 text-sm" aria-label={`Semana ${index + 1} — ${medication.name || "Medicamento sem nome"}`} value={week.entries[medication.id] ?? ""} onChange={(event) => onChange(setPrescriptionEntry(value, week.id, medication.id, event.target.value))} /></TableCell>)}<TableCell className="align-top"><Button variant="ghost" size="icon" aria-label={`Remover semana ${index + 1}`} title="Remover semana" onClick={() => { if (window.confirm("Remover esta semana e seus registros?")) onChange({ ...value, weeks: value.weeks.filter((item) => item.id !== week.id) }); }}><Trash2 /></Button></TableCell></TableRow>)}</TableBody>
      </Table>}
    </section>
    {value.medications.some((m) => frequencyText(m.dose) || suppliesText(m.dose, value.weeks.length)) && <section className="space-y-5 border-t border-border pt-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3"><h3 className="section-title tracking-normal text-lg">Frequência e fracionamento</h3>{value.medications.map((m) => frequencyText(m.dose) && <div key={m.id} className="text-sm"><p className="font-medium">{m.name}</p><p className="text-primary">{weeklyEntryText(m.dose)} por semana</p><p className="text-muted-foreground">{frequencyText(m.dose)}</p></div>)}</div>
        <div className="space-y-3"><h3 className="section-title tracking-normal text-lg">Estimativa de insumos · {value.weeks.length} semana(s)</h3>{value.medications.map((m) => suppliesText(m.dose, value.weeks.length) && <p key={m.id} className="text-sm"><span className="font-medium">{m.name}:</span> {suppliesText(m.dose, value.weeks.length)}</p>)}{!value.weeks.length && <p className="text-sm text-muted-foreground">Gere a grade semanal para estimar os insumos.</p>}</div>
      </div>
    </section>}
    <section className="space-y-5 border-t border-border pt-6">
      <div className="space-y-2"><h2 className="section-title tracking-normal">Protetores e TPC da prescrição</h2><p className="text-sm text-muted-foreground">Copie da receita médica: medicamentos, doses, semanas e o médico responsável.</p></div>
      <div className="grid md:grid-cols-2 gap-5">
        <div className="space-y-2"><Label htmlFor="prescription-protectors">Protetores durante o ciclo</Label><Textarea id="prescription-protectors" rows={5} maxLength={4000} value={value.protectors ?? ""} onChange={(event) => onChange({ ...value, protectors: event.target.value })} /></div>
        <div className="space-y-2"><Label htmlFor="prescription-pct">Cronograma de TPC</Label><Textarea id="prescription-pct" rows={5} maxLength={4000} value={value.pct ?? ""} onChange={(event) => onChange({ ...value, pct: event.target.value })} /></div>
      </div>
    </section>
  </div>;
}

function DoseFields({ medicationId, dose, onChange }: { medicationId: string; dose: DoseInput; onChange: (dose: DoseInput) => void }) {
  const field = (key: keyof DoseInput, label: string, numeric = true) => <div className="space-y-2 min-w-0"><Label htmlFor={`${key}-${medicationId}`} className="text-xs">{label}</Label><Input id={`${key}-${medicationId}`} inputMode={numeric ? "decimal" : "text"} maxLength={numeric ? 8 : 80} value={dose[key]} onChange={(event) => onChange({ ...dose, [key]: event.target.value })} /></div>;
  return <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
    {field("weeklyMg", "Dose da receita (mg/semana)")}
    {field("concentrationMgMl", "Concentração (mg/ml)")}
    {field("applicationsPerWeek", "Aplicações por semana")}
    {field("vialMl", "Frasco (ml)")}
    <div className="col-span-2 lg:col-span-1">{field("applicationDays", "Dias de aplicação", false)}</div>
  </div>;
}