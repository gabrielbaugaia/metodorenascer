import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { documentDates, documentProfileFields, extractedValues, profilePatch, profileSuggestions, reviewedProfileValues, type ProfileField } from "@/lib/clientDocumentProfile";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props { data: unknown; reviewedProfile: unknown; summary: string; date: string | null; applied: boolean; disabled: boolean; onApply: (date: string, values: Record<string, number>) => Promise<void> }
export function DocumentProfileReview({ data, reviewedProfile, summary, date, applied, disabled, onApply }: Props) {
  const dates = documentDates(summary + " " + extractedValues(data).map(v => v.name).join(" "));
  const [selectedDate, setSelectedDate] = useState(date ?? dates.at(-1) ?? "");
  const [values, setValues] = useState<Partial<Record<ProfileField, string>>>(() => ({ ...profileSuggestions(data, date ?? dates.at(-1) ?? ""), ...reviewedProfileValues(reviewedProfile) }));
  const [saving, setSaving] = useState(false);
  const rows = extractedValues(data);
  const changeDate = (value: string) => { setSelectedDate(value); setValues(profileSuggestions(data, value)); };
  const apply = async () => {
    try {
      const patch = profilePatch(values);
      if (!selectedDate || !Object.keys(patch).length) return toast.error("Confirme a data e pelo menos uma medida");
      if (!confirm("Aplicar estes valores ao cadastro do cliente? Confira a data e as unidades. Dados mais antigos não substituirão os mais recentes dos anexos.")) return;
      setSaving(true); await onApply(selectedDate, patch);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Não foi possível aplicar os dados"); }
    finally { setSaving(false); }
  };
  return <div className="space-y-4 border-t pt-4">
    {rows.length > 0 && <details><summary className="cursor-pointer text-sm font-medium">Valores extraídos ({rows.length})</summary><dl className="mt-3 space-y-2 text-sm">{rows.map((r, i) => <div key={i} className="break-words"><dt className="text-muted-foreground">{r.name}</dt><dd>{r.value} {r.unit}</dd></div>)}</dl></details>}
    <p className="text-sm font-medium">{applied ? "Dados aplicados ao cadastro" : "Dados para o cadastro"}</p>
    <div className="space-y-1"><Label>Data das medidas</Label><Input aria-label="Data das medidas" type="date" value={selectedDate} onChange={e => changeDate(e.target.value)} /></div>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{documentProfileFields.map(f => <div key={f.key} className="space-y-1"><Label>{f.label}</Label><Input aria-label={f.label} inputMode="decimal" value={values[f.key] ?? ""} placeholder="Não informado" onChange={e => setValues(s => ({ ...s, [f.key]: e.target.value }))} /></div>)}</div>
    <Button variant="outline" onClick={apply} disabled={disabled || saving}>{saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />} Revisar e aplicar ao cadastro</Button>
  </div>;
}