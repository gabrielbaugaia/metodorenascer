import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import type { Sex } from "@/lib/vo2maxCalc";

export interface BruceData {
  total_minutes: number;
  sex: Sex;
  test_date: string;
  local?: string;
  notas?: string;
  screenshotFile?: File | null;
}

interface Props {
  onSubmit: (data: BruceData) => void;
  onBack: () => void;
}

const INSTRUCTIONS = [
  "O teste é progressivo: cada estágio dura 3 minutos",
  "A velocidade e inclinação aumentam a cada estágio",
  "Pare quando não conseguir mais manter o ritmo (exaustão voluntária)",
  "Anote o tempo total exato ao parar",
  "Recomendado ter um profissional ou acompanhante presente",
];

const STAGES = [
  { e: 1, v: "2.7", i: "10%" },
  { e: 2, v: "4.0", i: "12%" },
  { e: 3, v: "5.5", i: "14%" },
  { e: 4, v: "6.8", i: "16%" },
  { e: 5, v: "8.0", i: "18%" },
  { e: 6, v: "8.9", i: "20%" },
  { e: 7, v: "9.7", i: "22%" },
];

export function Vo2MaxBruceForm({ onSubmit, onBack }: Props) {
  const today = new Date().toISOString().split("T")[0];
  const [step, setStep] = useState<1 | 2>(1);
  const [sex, setSex] = useState<Sex>("M");
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");
  const [date, setDate] = useState(today);
  const [local, setLocal] = useState("");
  const [notas, setNotas] = useState("");
  const [file, setFile] = useState<File | null>(null);

  if (step === 1) {
    return (
      <Card className="p-4 space-y-4">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Passo 1 de 2</p>
          <h3 className="font-semibold text-foreground">Instruções — Protocolo Bruce</h3>
        </div>
        <ul className="space-y-2">
          {INSTRUCTIONS.map((t, i) => (
            <li key={i} className="flex gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>{t}</span>
            </li>
          ))}
        </ul>

        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-muted">
              <tr>
                <th className="px-2 py-1.5 text-left">Estágio</th>
                <th className="px-2 py-1.5 text-left">Vel. (km/h)</th>
                <th className="px-2 py-1.5 text-left">Inclinação</th>
              </tr>
            </thead>
            <tbody>
              {STAGES.map((s) => (
                <tr key={s.e} className="border-t border-border">
                  <td className="px-2 py-1.5 text-foreground">{s.e}</td>
                  <td className="px-2 py-1.5 text-muted-foreground">{s.v}</td>
                  <td className="px-2 py-1.5 text-muted-foreground">{s.i}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[10px] text-muted-foreground px-2 py-1">Cada estágio dura 3 minutos.</p>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-2" /> Voltar</Button>
          <Button className="flex-1" onClick={() => setStep(2)}>
            Continuar <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </Card>
    );
  }

  const submit = () => {
    const m = Number(minutes) || 0;
    const s = Number(seconds) || 0;
    const total = m + s / 60;
    if (total <= 0) return;
    onSubmit({
      total_minutes: total,
      sex,
      test_date: date,
      local: local || undefined,
      notas: notas || undefined,
      screenshotFile: file,
    });
  };

  return (
    <Card className="p-4 space-y-4">
      <div>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Passo 2 de 2</p>
        <h3 className="font-semibold text-foreground">Dados do Teste</h3>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Sexo</Label>
        <Select value={sex} onValueChange={(v) => setSex(v as Sex)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="M">Masculino</SelectItem>
            <SelectItem value="F">Feminino</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Tempo total (min) *</Label>
          <Input type="number" placeholder="9" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Segundos</Label>
          <Input type="number" placeholder="30" value={seconds} onChange={(e) => setSeconds(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Data</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Local</Label>
          <Input placeholder="Academia" value={local} onChange={(e) => setLocal(e.target.value)} />
        </div>
      </div>

      <Textarea placeholder="Observações" value={notas} onChange={(e) => setNotas(e.target.value)} className="min-h-[60px]" />

      <div>
        <Label className="text-xs">Anexar print do display da esteira</Label>
        <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="h-4 w-4 mr-2" /> Voltar</Button>
        <Button className="flex-1" onClick={submit}>Calcular VO2 Máx</Button>
      </div>
    </Card>
  );
}
