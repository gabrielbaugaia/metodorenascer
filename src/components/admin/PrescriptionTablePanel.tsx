import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { addPrescriptionMedication, addPrescriptionWeek, removePrescriptionMedication, setPrescriptionEntry, type PrescriptionTable } from "@/lib/hormonalPrescription";

export function PrescriptionTablePanel({ value, onChange }: { value: PrescriptionTable; onChange: (value: PrescriptionTable) => void }) {
  const [name, setName] = useState("");
  function addMedication(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    onChange(addPrescriptionMedication(value, name));
    setName("");
  }
  return <div className="space-y-8 min-w-0">
    <section className="space-y-5">
      <div className="space-y-2"><h2 className="section-title tracking-normal">Medicamentos da prescrição</h2><p className="text-sm text-muted-foreground">Transcrição de documento médico existente · Sem cálculo ou recomendação</p></div>
      <form onSubmit={addMedication} className="flex flex-col sm:flex-row gap-3 items-end">
        <div className="space-y-2 w-full sm:max-w-md"><Label htmlFor="prescription-medication-name">Nome conforme a prescrição</Label><Input id="prescription-medication-name" maxLength={80} value={name} onChange={(event) => setName(event.target.value)} autoComplete="off" /></div>
        <Button type="submit" variant="outline" disabled={!name.trim()} className="w-full sm:w-auto"><Plus />Adicionar medicamento</Button>
      </form>
      {!value.medications.length && <p className="text-sm text-muted-foreground py-6 border-y border-border">Nenhum medicamento registrado.</p>}
      <div className="divide-y divide-border">{value.medications.map((medication) => <div key={medication.id} className="py-5 space-y-4">
        <div className="flex items-end gap-3"><div className="space-y-2 flex-1 min-w-0"><Label htmlFor={`medication-${medication.id}`}>Medicamento</Label><Input id={`medication-${medication.id}`} maxLength={80} value={medication.name} onChange={(event) => onChange({ ...value, medications: value.medications.map((item) => item.id === medication.id ? { ...item, name: event.target.value } : item) })} /></div><Button variant="ghost" size="icon" title="Remover medicamento e registros" aria-label={`Remover medicamento ${medication.name}`} onClick={() => { if (window.confirm("Remover este medicamento e seus registros semanais?")) onChange(removePrescriptionMedication(value, medication.id)); }}><Trash2 /></Button></div>
        <div className="space-y-2"><Label htmlFor={`instructions-${medication.id}`}>Orientações do médico — transcrição fiel</Label><Textarea id={`instructions-${medication.id}`} rows={3} maxLength={4000} value={medication.instructions} onChange={(event) => onChange({ ...value, medications: value.medications.map((item) => item.id === medication.id ? { ...item, instructions: event.target.value } : item) })} /></div>
      </div>)}</div>
    </section>
    <section className="space-y-5 border-t border-border pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"><h2 className="section-title tracking-normal">Tabela semanal transcrita</h2><Button variant="outline" disabled={!value.medications.length} onClick={() => onChange(addPrescriptionWeek(value))} className="self-start"><Plus />Adicionar semana</Button></div>
      {!value.weeks.length ? <p className="text-sm text-muted-foreground py-6 border-y border-border">Nenhuma semana registrada.</p> : <Table aria-label="Tabela semanal da prescrição médica">
        <TableHeader><TableRow className="bg-muted/40"><TableHead className="w-24 whitespace-nowrap">Semana</TableHead>{value.medications.map((medication) => <TableHead key={medication.id} className="min-w-56 max-w-xs text-primary break-words">{medication.name || "Medicamento sem nome"}</TableHead>)}<TableHead className="w-14"><span className="sr-only">Remover semana</span></TableHead></TableRow></TableHeader>
        <TableBody>{value.weeks.map((week, index) => <TableRow key={week.id}><TableCell className="text-primary font-medium align-top pt-6 whitespace-nowrap">S{index + 1}</TableCell>{value.medications.map((medication) => <TableCell key={medication.id} className="align-top"><Textarea rows={3} maxLength={2000} className="min-w-48 text-sm" aria-label={`Semana ${index + 1} — ${medication.name || "Medicamento sem nome"}`} value={week.entries[medication.id] ?? ""} onChange={(event) => onChange(setPrescriptionEntry(value, week.id, medication.id, event.target.value))} /></TableCell>)}<TableCell className="align-top"><Button variant="ghost" size="icon" aria-label={`Remover semana ${index + 1}`} title="Remover semana" onClick={() => { if (window.confirm("Remover esta semana e seus registros?")) onChange({ ...value, weeks: value.weeks.filter((item) => item.id !== week.id) }); }}><Trash2 /></Button></TableCell></TableRow>)}</TableBody>
      </Table>}
    </section>
  </div>;
}